import {
	AppLoggerServiceInterface,
	CacheMetrics,
	ErrorHandlerServiceInterface,
	ErrorLoggerServiceInterface,
	CacheServiceInterface,
	RedisServiceInterface
} from '../index/interfaces';
import { ServiceFactory } from '../index/factory';
import { serviceTTLConfig } from '../config/cache';

export class CacheService implements CacheServiceInterface {
	private static instance: CacheService | null = null;
	private redisService: RedisServiceInterface;
	private logger: AppLoggerServiceInterface;
	private errorLogger: ErrorLoggerServiceInterface;
	private errorHandler: ErrorHandlerServiceInterface;
	private memoryCache = new Map<
		string, // service name
		Map<string, { value: unknown; expiration: number | undefined }>
	>();
	private serviceMetrics: {
		[service: string]: {
			cacheHits: number;
			cacheMisses: number;
			redisHits: number;
		};
	} = {};

	private constructor() {
		this.logger = ServiceFactory.getLoggerService();
		this.errorLogger = ServiceFactory.getErrorLoggerService();
		this.errorHandler = ServiceFactory.getErrorHandlerService();
		this.redisService = ServiceFactory.getRedisService();
	}

	public static getInstance(): CacheService {
		if (!CacheService.instance) {
			CacheService.instance = new CacheService();
		}

		return CacheService.instance;
	}

	private getServiceTTL(service: string): number {
		return serviceTTLConfig[service] || serviceTTLConfig['default'];
	}

	private getNamespacedKey(service: string, key: string): string {
		return `${service}:${key}`;
	}

	private updateMetrics(
		service: string,
		type: 'hit' | 'miss' | 'redisHit'
	): void {
		if (!this.serviceMetrics[service]) {
			this.serviceMetrics[service] = {
				cacheHits: 0,
				cacheMisses: 0,
				redisHits: 0
			};
		}

		if (type === 'hit') {
			this.serviceMetrics[service].cacheHits++;
		} else if (type === 'miss') {
			this.serviceMetrics[service].cacheMisses++;
		} else if (type === 'redisHit') {
			this.serviceMetrics[service].redisHits++;
		}
	}

	public getCacheMetrics(service: string): CacheMetrics {
		return (
			this.serviceMetrics[service] || {
				cacheHits: 0,
				cacheMisses: 0,
				redisHits: 0
			}
		);
	}

	public async get<T>(key: string, service: string): Promise<T | null> {
		const namespacedKey = this.getNamespacedKey(service, key);

		try {
			const serviceMemoryCache = this.memoryCache.get(service);
			if (serviceMemoryCache) {
				const memoryEntry = serviceMemoryCache.get(namespacedKey);
				if (memoryEntry) {
					if (
						memoryEntry.expiration &&
						Date.now() > memoryEntry.expiration
					) {
						serviceMemoryCache.delete(namespacedKey);
						this.logger.info(
							`Memory cache expired for key: ${namespacedKey}`
						);
					} else {
						this.updateMetrics(service, 'hit');
						this.logger.info(
							`Memory cache hit for key: ${namespacedKey} by service: ${service}`
						);
						return memoryEntry.value as T;
					}
				}
			}

			const redisValue = await this.redisService.get<T>(namespacedKey);
			if (redisValue) {
				const defaultExpiration =
					Date.now() + this.getServiceTTL(service) * 1000;
				if (!serviceMemoryCache) {
					this.memoryCache.set(service, new Map());
				}
				this.memoryCache.get(service)?.set(namespacedKey, {
					value: redisValue,
					expiration: defaultExpiration
				});
				this.updateMetrics(service, 'redisHit');
				this.logger.info(
					`Fetched key: ${namespacedKey} from Redis for service: ${service} and added to memory cache`
				);
			} else {
				this.updateMetrics(service, 'miss');
				this.logger.info(
					`Cache miss for key: ${namespacedKey} by service: ${service}`
				);
			}
			return redisValue;
		} catch (error) {
			this.handleCacheError(
				error,
				'CACHE_GET_ERROR',
				{
					reason: `Cache get failed for key ${key}`,
					key: key || 'unknown',
					service: service || 'unknown'
				},
				`Error fetching key ${namespacedKey} from cache for service ${service}`
			);
			return null;
		}
	}

	public async set<T>(
		key: string,
		value: T,
		service: string,
		expirationInSeconds?: number
	): Promise<void> {
		const namespacedKey = this.getNamespacedKey(service, key);
		try {
			const expiration = expirationInSeconds
				? Date.now() + expirationInSeconds * 1000
				: Date.now() + this.getServiceTTL(service) * 1000;

			let serviceMemoryCache = this.memoryCache.get(service);
			if (!serviceMemoryCache) {
				serviceMemoryCache = new Map();
				this.memoryCache.set(service, serviceMemoryCache);
			}
			serviceMemoryCache.set(namespacedKey, { value, expiration });

			await this.redisService.set(
				namespacedKey,
				value,
				expirationInSeconds
			);

			this.logger.info(
				`Key ${namespacedKey} set by service ${service} with TTL ${
					expirationInSeconds || this.getServiceTTL(service)
				} seconds in both memory and Redis cache`
			);
		} catch (error) {
			this.handleCacheError(
				error,
				'CACHE_SET_ERROR',
				{
					reason: `Cache set failed for key ${key}`,
					key: key || 'unknown',
					expiration: expirationInSeconds || 'unknown',
					service: service || 'unknown'
				},
				`Error setting key ${namespacedKey} in cache for service ${service}`
			);
		}
	}

	public async del(key: string, service: string): Promise<void> {
		const namespacedKey = this.getNamespacedKey(service, key);
		try {
			const serviceMemoryCache = this.memoryCache.get(service);
			if (serviceMemoryCache) {
				serviceMemoryCache.delete(namespacedKey);
				this.logger.info(
					`Key ${namespacedKey} deleted from memory cache by service ${service}`
				);
			}

			await this.redisService.del(namespacedKey);
			this.logger.info(
				`Key ${namespacedKey} deleted from Redis by service ${service}`
			);
		} catch (error) {
			this.handleCacheError(
				error,
				'CACHE_DELETE_ERROR',
				{
					reason: `Cache delete failed for key ${key}`,
					key: key || 'unknown',
					service: service || 'unknown'
				},
				`Error deleting key ${namespacedKey} from cache for service ${service}`
			);
		}
	}

	public async exists(key: string, service: string): Promise<boolean> {
		const namespacedKey = this.getNamespacedKey(service, key);
		try {
			const serviceMemoryCache = this.memoryCache.get(service);
			if (serviceMemoryCache?.has(namespacedKey)) {
				this.logger.info(
					`Key ${namespacedKey} exists in memory cache, checked by service ${service}`
				);
				this.updateMetrics(service, 'hit');
				return true;
			}

			const redisExists = await this.redisService.exists(namespacedKey);
			if (redisExists) {
				this.logger.info(
					`Key ${namespacedKey} exists in Redis, checked by service ${service}`
				);
				this.updateMetrics(service, 'redisHit');
				return true;
			}

			this.logger.info(
				`Key ${namespacedKey} does not exist in memory or Redis, checked by service ${service}`
			);
			this.updateMetrics(service, 'miss');
			return false;
		} catch (error) {
			this.handleCacheError(
				error,
				'CACHE_EXISTS_ERROR',
				{
					reason: `Cache existence check failed for key ${key}`,
					key: key || 'unknown',
					service: service || 'unknown'
				},
				`Error checking existence of key ${namespacedKey} for service ${service}`
			);
			return false;
		}
	}

	public async increment(
		key: string,
		service: string,
		expirationInSeconds?: number
	): Promise<number | null> {
		const namespacedKey = this.getNamespacedKey(service, key);

		try {
			let serviceMemoryCache = this.memoryCache.get(service);
			let newValue: number | null = null;

			if (serviceMemoryCache) {
				const memoryEntry = serviceMemoryCache.get(namespacedKey);
				if (memoryEntry && typeof memoryEntry.value === 'number') {
					memoryEntry.value += 1;
					newValue = memoryEntry.value;
					this.logger.info(
						`Memory cache incremented for key: ${namespacedKey} by service: ${service}`
					);
				}
			}

			if (!serviceMemoryCache || typeof newValue !== 'number') {
				newValue = await this.redisService.increment(
					namespacedKey,
					expirationInSeconds
				);
				if (newValue !== null) {
					const expiration = expirationInSeconds
						? Date.now() + expirationInSeconds * 1000
						: Date.now() + this.getServiceTTL(service) * 1000;

					if (!serviceMemoryCache) {
						serviceMemoryCache = new Map();
						this.memoryCache.set(service, serviceMemoryCache);
					}
					serviceMemoryCache.set(namespacedKey, {
						value: newValue,
						expiration
					});
					this.logger.info(
						`Fetched incremented value from Redis and added to memory cache for key: ${namespacedKey} by service: ${service}`
					);
				}
			}

			return newValue;
		} catch (error) {
			this.handleCacheError(
				error,
				'CACHE_INCREMENT_ERROR',
				{
					reason: `Cache increment failed for key ${key}`,
					key: key || 'unknown',
					expiration: expirationInSeconds || 'unknown',
					service: service || 'unknown'
				},
				`Error incrementing key ${namespacedKey} in cache for service ${service}`
			);
			return null;
		}
	}

	public async flushCache(service: string): Promise<void> {
		try {
			const serviceMemoryCache = this.memoryCache.get(service);
			if (serviceMemoryCache) {
				serviceMemoryCache.clear();
				this.memoryCache.delete(service);
				this.logger.info(
					`Memory cache flushed for service: ${service}`
				);
			}

			const serviceKeys = await this.redisService.getKeysByPattern(
				`${service}:*`
			);
			if (serviceKeys.length > 0) {
				await this.redisService.delMultiple(service, serviceKeys);
				this.logger.info(`Redis cache flushed for service: ${service}`);
			}
		} catch (error) {
			this.handleCacheError(
				error,
				'CACHE_FLUSH_ERROR',
				{
					reason: `Cache flush failed for service ${service}`,
					service: service || 'unknown'
				},
				`Error flushing cache for service ${service}`
			);
		}
	}

	public async closeConnection(): Promise<void> {
		try {
			await this.redisService.cleanUpRedisClient();
		} catch (error) {
			this.handleCacheError(
				error,
				'CACHE_CLOSE_CONNECTION_ERROR',
				{
					reason: `Cache connection close failed`
				},
				`Error closing cache connection`
			);
		}
	}

	private handleCacheError(
		error: unknown,
		errorHeader: string,
		errorDetails: object,
		customMessage: string
	): void {
		const errorMessage = `${customMessage}: ${error}\n${error instanceof Error ? error.stack : ''}`;
		this.errorLogger.logError(errorMessage);

		const cacheError = new this.errorHandler.ErrorClasses.CacheServiceError(
			errorHeader,
			{
				details: errorDetails,
				exposeToClient: false
			}
		);

		this.errorHandler.handleError({
			error: cacheError
		});
	}
}
