import {
	AppLoggerServiceInterface,
	CacheMetrics,
	CacheServiceInterface,
	ErrorHandlerServiceInterface,
	ErrorLoggerServiceInterface
} from '../index/interfaces/main';
import { serviceTTLConfig } from '../config/cache';
import { withRetry } from '../utils/helpers';
import { LoggerServiceFactory } from '../index/factory/subfactories/LoggerServiceFactory';
import { ErrorHandlerServiceFactory } from '../index/factory/subfactories/ErrorHandlerServiceFactory';

export class CacheService implements CacheServiceInterface {
	private static instance: CacheService | null = null;

	private logger: AppLoggerServiceInterface;
	private errorLogger: ErrorLoggerServiceInterface;
	private errorHandler: ErrorHandlerServiceInterface;

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

	private constructor(
		logger: AppLoggerServiceInterface,
		errorLogger: ErrorLoggerServiceInterface,
		errorHandler: ErrorHandlerServiceInterface
	) {
		this.logger = logger;
		this.errorLogger = errorLogger;
		this.errorHandler = errorHandler;
	}

	public static async getInstance(): Promise<CacheService> {
		if (!CacheService.instance) {
			CacheService.instance = new CacheService(
				await LoggerServiceFactory.getLoggerService(),
				await LoggerServiceFactory.getErrorLoggerService(),
				await ErrorHandlerServiceFactory.getErrorHandlerService()
			);
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

			this.updateMetrics(service, 'miss');
			this.logger.info(`Cache miss for key: ${namespacedKey}`);

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

			this.logger.info(
				`Key ${namespacedKey} does not exist in memory, checked by service ${service}`
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
				newValue = 1;

				if (!serviceMemoryCache) {
					serviceMemoryCache = new Map();
					this.memoryCache.set(service, serviceMemoryCache);
				}
				const expiration = expirationInSeconds
					? Date.now() + expirationInSeconds * 1000
					: Date.now() + this.getServiceTTL(service) * 1000;

				serviceMemoryCache.set(namespacedKey, {
					value: newValue,
					expiration
				});
				this.logger.info(
					`Initialized incremented value in memory cache for key: ${namespacedKey} by service: ${service}`
				);
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
			} else {
				this.logger.warn(
					`No memory cache found for service: ${service}`
				);
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
			} else {
				this.logger.warn(
					`No memory cache found for service: ${service}`
				);
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
			this.logger.info(
				'No connection to close for memory cache *(LAYER 2 NOT IMPLEMENTED'
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
			this.logger.info('Clearing memory cache in Cache Service...');

			this.memoryCache.clear();
			this.memoryCacheLRU.clear();

			this.logger.info('Memory cache cleared successfully.');
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
