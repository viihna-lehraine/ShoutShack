import {
	CacheServiceInterface,
	RedisServiceInterface
} from '../index/interfaces/services';
import { CacheMetrics } from '../index/interfaces/serviceComponents';
import { ServiceFactory } from '../index/factory';
import { serviceTTLConfig } from '../config/cache';
import { withRetry } from '../utils/helpers';

export class CacheService implements CacheServiceInterface {
	private static instance: CacheService | null = null;

	private logger = ServiceFactory.getLoggerService();
	private errorLogger = ServiceFactory.getErrorLoggerService();
	private errorHandler = ServiceFactory.getErrorHandlerService();
	private redisService: RedisServiceInterface | null =
		ServiceFactory.getRedisService();

	private memoryCache = new Map<
		string,
		Map<string, { value: unknown; expiration: number | undefined }>
	>();
	private memoryCacheLRU = new Map<string, number>();
	private serviceMetrics: {
		[service: string]: {
			cacheHits: number;
			cacheMisses: number;
			redisHits: number;
		};
	} = {};

	private constructor() {}

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

	public getMemoryCache(
		service: string
	): Map<string, { value: unknown; expiration: number | undefined }> | null {
		return this.memoryCache.get(service) || null;
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
						this.memoryCacheLRU.set(namespacedKey, Date.now());
						this.updateMetrics(service, 'hit');
						this.logger.info(
							`Memory cache hit for key: ${namespacedKey}`
						);
						return memoryEntry.value as T;
					}
				}
			}

			const redisValue =
				(await this.redisService?.get<T>(namespacedKey)) ?? null;
			if (redisValue !== null) {
				const defaultExpiration =
					Date.now() + this.getServiceTTL(service) * 1000;
				if (!serviceMemoryCache) {
					this.memoryCache.set(service, new Map());
				}

				this.memoryCache.get(service)?.set(namespacedKey, {
					value: redisValue,
					expiration: defaultExpiration
				});
				this.memoryCacheLRU.set(namespacedKey, Date.now());

				this.updateMetrics(service, 'redisHit');
				this.logger.info(`Fetched key: ${namespacedKey} from Redis`);
				return redisValue;
			} else {
				this.updateMetrics(service, 'miss');
				this.logger.info(`Cache miss for key: ${namespacedKey}`);
			}

			return null;
		} catch (error) {
			this.handleCacheError(
				error,
				'CACHE_GET_ERROR',
				{ key, service },
				`Error fetching key ${namespacedKey} from cache for service ${service}`
			);
			return null;
		}
	}

	public async set<T>(
		key: string,
		value: T,
		service: string,
		expirationInSeconds?: string | number
	): Promise<void> {
		const namespacedKey = this.getNamespacedKey(service, key);

		try {
			const expiration = expirationInSeconds
				? Date.now() + Number(expirationInSeconds) * 1000
				: Date.now() + this.getServiceTTL(service) * 1000;

			let serviceMemoryCache = this.memoryCache.get(service);

			if (!serviceMemoryCache) {
				serviceMemoryCache = new Map();
				this.memoryCache.set(service, serviceMemoryCache);
			}

			serviceMemoryCache.set(namespacedKey, { value, expiration });
			this.memoryCacheLRU.set(namespacedKey, Date.now());

			await this.redisService?.set(
				namespacedKey,
				value,
				Number(expirationInSeconds)
			);

			this.logger.info(
				`Key ${namespacedKey} set with TTL ${
					expirationInSeconds || this.getServiceTTL(service)
				} seconds in both memory and Redis cache`
			);
		} catch (error) {
			this.handleCacheError(
				error,
				'CACHE_SET_ERROR',
				{ key, service, expirationInSeconds },
				`Error setting key ${namespacedKey} in cache for service ${service}`
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

			const redisExists = await this.redisService?.exists(namespacedKey);
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
				{ key, service },
				`Error checking existence of key ${namespacedKey} for service ${service}`
			);
			return false;
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

			await this.redisService?.del(namespacedKey);
			this.logger.info(
				`Key ${namespacedKey} deleted from Redis by service ${service}`
			);
		} catch (error) {
			this.handleCacheError(
				error,
				'CACHE_DELETE_ERROR',
				{ key, service },
				`Error deleting key ${namespacedKey} from cache for service ${service}`
			);
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
				newValue =
					(await this.redisService?.increment(
						namespacedKey,
						expirationInSeconds
					)) ?? null;
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

			const serviceKeys = await this.redisService?.getKeysByPattern(
				`${service}:*`
			);

			if (typeof serviceKeys === 'undefined') {
				this.logger.warn(
					`Redis cache flush failed for service: ${service}`
				);
				return;
			}
			if (serviceKeys.length > 0) {
				await this.redisService?.delMultiple(service, serviceKeys);
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

	public cleanupExpiredEntries(): void {
		withRetry(
			() => {
				for (const [service, cache] of this.memoryCache.entries()) {
					for (const [key, { expiration }] of cache.entries()) {
						if (expiration && Date.now() > expiration) {
							cache.delete(key);
							this.logger.info(
								`Expired memory cache entry removed for key: ${key} from service: ${service}`
							);
						}
					}
				}
			},
			3,
			1000
		).catch(error => {
			this.logger.error(
				`Error cleaning up expired memory cache entries after retries: ${error}`
			);
		});
	}

	public async clearNamespace(service: string): Promise<void> {
		try {
			const serviceMemoryCache = this.memoryCache.get(service);

			if (serviceMemoryCache) {
				serviceMemoryCache.clear();
				this.memoryCache.delete(service);
				this.logger.info(
					`Memory cache cleared for service: ${service}`
				);
			}

			const serviceKeys = await this.redisService?.getKeysByPattern(
				`${service}:*`
			);

			if (typeof serviceKeys === 'undefined') {
				this.logger.warn(
					`Redis cache clear failed for service: ${service}`
				);
				return;
			}

			if (serviceKeys.length > 0) {
				await this.redisService?.delMultiple(service, serviceKeys);
				this.logger.info(`Redis cache cleared for service: ${service}`);
			}
		} catch (error) {
			this.handleCacheError(
				error,
				'CACHE_CLEAR_NAMESPACE_ERROR',
				{ service },
				`Error clearing cache for service ${service}`
			);
		}
	}

	public async closeConnection(): Promise<void> {
		try {
			await withRetry(
				async () => await this.redisService?.cleanUpRedisClient(),
				3,
				1000
			);
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

	public async shutdown(): Promise<void> {
		try {
			this.logger.info(
				'Shutting down Redis connection before Cache Service...'
			);
			try {
				await this.redisService?.cleanUpRedisClient();
				this.logger.info('Redis connection closed successfully.');
			} catch (redisError) {
				this.logger.error(
					`Failed to shut down Redis connection: ${redisError instanceof Error ? redisError.message : redisError}`
				);
			}

			this.logger.info('Clearing memory cache in Cache Service...');

			this.memoryCache.clear();
			this.memoryCacheLRU.clear();

			this.logger.info('Memory cache cleared successfully.');

			this.redisService = null;
			this.logger.info('Cache service shutdown completed.');
		} catch (error) {
			this.handleCacheError(
				error,
				'CACHE_SHUTDOWN_ERROR',
				{},
				`Error shutting down Cache Service`
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
