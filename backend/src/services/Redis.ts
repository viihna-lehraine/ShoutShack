import { RedisClientType } from 'redis';
import {
	RedisMetrics,
	RedisServiceDeps,
	RedisServiceInterface
} from '../index/interfaces';
import { ServiceFactory } from '../index/factory';

export class RedisService implements RedisServiceInterface {
	private static instance: RedisService | null = null;
	private redisClient: RedisClientType | null = null;
	private logger = ServiceFactory.getLoggerService();
	private errorLogger = ServiceFactory.getErrorLoggerService();
	private errorHandler = ServiceFactory.getErrorHandlerService();
	private envConfig = ServiceFactory.getEnvConfigService();

	private constructor(
		private readonly createRedisClient: typeof import('redis').createClient
	) {}

	public static getInstance(deps: RedisServiceDeps): RedisService {
		if (!RedisService.instance) {
			deps.validateDependencies(
				[
					{
						name: 'createRedisClient',
						instance: deps.createRedisClient
					}
				],
				ServiceFactory.getLoggerService()
			);
			RedisService.instance = new RedisService(deps.createRedisClient);
		}
		return RedisService.instance;
	}

	private async connectRedisClient(): Promise<void> {
		if (this.redisClient) return;

		try {
			this.redisClient = this.createRedisClient({
				url: this.envConfig.getEnvVariable('redisUrl'),
				socket: {
					reconnectStrategy: retries => {
						const retryAfter = Math.min(retries * 100, 3000);
						this.errorLogger.logWarn(
							`Error connecting to Redis, retrying in ${retryAfter}ms. Retries: ${retries}`
						);
						if (retries >= 10) {
							this.handleRedisFailure(retries);
						}
						return retryAfter;
					}
				}
			});

			this.redisClient.on('error', error => {
				this.errorLogger.logError(`Redis error: ${error}`);
			});

			await this.redisClient.connect();
			this.logger.info('Connected to Redis');
		} catch (error) {
			this.handleRedisError(
				error,
				'REDIS_CONNECTION_ERROR',
				{ reason: 'Failed to connect to Redis' },
				'Error connecting to Redis'
			);
		}
	}

	public async getRedisClient(): Promise<RedisClientType | null> {
		try {
			await this.connectRedisClient();
			return this.redisClient;
		} catch (error) {
			this.handleRedisError(
				error,
				'REDIS_CLIENT_ERROR',
				{ reason: 'Failed to get Redis client' },
				'Error getting Redis client'
			);
			return null;
		}
	}

	public async get<T>(key: string): Promise<T | null> {
		await this.connectRedisClient();
		if (!this.redisClient) throw new Error('Redis client is not connected');
		try {
			const result = await this.redisClient.get(key);

			if (!result) {
				this.logger.info(`Key ${key} not found or expired in Redis`);
				return null;
			}

			return result ? JSON.parse(result) : null;
		} catch (error) {
			this.handleRedisError(
				error,
				'REDIS_GET_ERROR',
				{ reason: `Failed to get key` },
				`Error fetching key ${key} from Redis`
			);
			return null;
		}
	}

	public async set<T>(
		key: string,
		value: T,
		expiration?: number
	): Promise<void> {
		await this.connectRedisClient();
		if (!this.redisClient) throw new Error('Redis client is not connected');
		try {
			const valueString = JSON.stringify(value);
			if (expiration) {
				await this.redisClient.set(key, valueString, {
					EX: expiration
				});
			} else {
				await this.redisClient.set(key, valueString);
			}
			this.logger.info(
				`Key ${key} set in Redis with expiration ${expiration ?? 'no expiration'}`
			);
		} catch (error) {
			this.handleRedisError(
				error,
				'REDIS_SET_ERROR',
				{ reason: `Failed to set key ${key}` },
				`Error setting key ${key} in Redis`
			);
		}
	}

	public async del(key: string): Promise<void> {
		if (!this.redisClient) {
			throw new Error('Redis client is not connected');
		}
		try {
			await this.redisClient.del(key);
			this.logger.info(`Key ${key} deleted from Redis`);
		} catch (error) {
			this.handleRedisError(
				error,
				'REDIS_DEL_ERROR',
				{ reason: `Failed to delete key ${key}` },
				`Error deleting key ${key} from Redis`
			);
		}
	}

	public async exists(key: string): Promise<boolean> {
		if (!this.redisClient) {
			throw new Error('Redis client is not connected');
		}
		try {
			const result = await this.redisClient.exists(key);
			return result > 0;
		} catch (error) {
			this.handleRedisError(
				error,
				'REDIS_EXISTS_ERROR',
				{ reason: `Failed to check existence of key ${key}` },
				`Error checking existence of key ${key} in Redis`
			);
			return false;
		}
	}

	public async increment(
		key: string,
		expiration?: number
	): Promise<number | null> {
		if (!this.redisClient) {
			throw new Error('Redis client is not connected');
		}
		try {
			const newValue = await this.redisClient.incr(key);
			if (expiration) {
				await this.redisClient.expire(key, expiration);
			}
			return newValue;
		} catch (error) {
			this.handleRedisError(
				error,
				'REDIS_INCREMENT_ERROR',
				{ reason: `Failed to increment key ${key}` },
				`Error incrementing key ${key} in Redis`
			);
			return null;
		}
	}

	public async getKeysByPattern(pattern: string): Promise<string[]> {
		try {
			await this.connectRedisClient();

			if (!this.redisClient) {
				throw new Error('Redis client is not connected');
			}

			const keys = await this.redisClient.keys(pattern);
			this.logger.info(
				`Found ${keys.length} keys matching pattern: ${pattern}`
			);
			return keys;
		} catch (error) {
			this.handleRedisError(
				error,
				'REDIS_KEY_PATTERN_ERROR',
				{ reason: `Failed to get keys by pattern ${pattern}` },
				`Error fetching keys by pattern ${pattern} from Redis`
			);
			return [];
		}
	}

	public async delMultiple(service: string, keys: string[]): Promise<void> {
		try {
			await this.connectRedisClient();

			if (!this.redisClient) {
				throw new Error('Redis client is not connected');
			}

			if (keys.length > 0) {
				const namespacedKeys = keys.map(key => `${service}:${key}`);

				await this.redisClient.del(namespacedKeys);
				this.logger.info(
					`Deleted ${keys.length} keys from Redis for service ${service}`
				);
			} else {
				this.logger.info(`No keys to delete for service ${service}`);
			}
		} catch (error) {
			this.handleRedisError(
				error,
				'REDIS_DEL_MULTIPLE_ERROR',
				{
					reason: `Failed to delete multiple keys for service ${service}`
				},
				`Error deleting multiple keys from Redis for service ${service}`
			);
		}
	}

	public async flushCacheByService(service: string): Promise<void> {
		try {
			const servicePattern = `${service}:*`;
			const serviceKeys = await this.getKeysByPattern(servicePattern);
			if (serviceKeys.length > 0) {
				await this.delMultiple(service, serviceKeys);
				this.logger.info(`Flushed Redis cache for service ${service}`);
			} else {
				this.logger.info(
					`No keys found to flush for service ${service}`
				);
			}
		} catch (error) {
			this.handleRedisError(
				error,
				'REDIS_FLUSH_CACHE_BY_SERVICE_ERROR',
				{ service },
				`Error flushing Redis cache for service ${service}`
			);
		}
	}

	public async flushRedisMemoryCache(): Promise<void> {
		try {
			await this.connectRedisClient();

			if (this.redisClient) {
				try {
					await this.redisClient.flushAll();
					this.logger.info('Redis cache flushed successfully');
				} catch (error) {
					this.handleRedisError(
						error,
						'REDIS_FLUSH_ERROR',
						{ reason: 'Redis not connected' },
						'Error flushing Redis cache'
					);
				}
			} else {
				this.errorLogger.logWarn(
					'Redis client is not available for cache flush'
				);
			}
		} catch (error) {
			this.handleRedisError(
				error,
				'REDIS_FLUSH_ERROR',
				{ reason: 'Failed to flush Redis cache' },
				'Error flushing Redis cache'
			);
		}
	}

	public async cleanUpRedisClient(): Promise<void> {
		try {
			if (this.redisClient) {
				try {
					await this.redisClient.quit();
					this.logger.info('Redis client disconnected successfully');
					this.redisClient = null;
				} catch (error) {
					this.errorLogger.logError(
						`Error disconnecting Redis client: ${error}`
					);
				}
			}
		} catch (error) {
			this.handleRedisError(
				error,
				'REDIS_DISCONNECT_ERROR',
				{ reason: 'Failed to disconnect Redis client' },
				'Error disconnecting Redis client'
			);
		}
	}

	public async getRedisInfo(): Promise<RedisMetrics> {
		try {
			await this.connectRedisClient();
			if (!this.redisClient) {
				throw new Error('Redis client is not connected');
			}

			const info = await this.redisClient.info();
			const parsedInfo = this.parseRedisInfo(info);

			this.logger.info(`Redis metrics: ${JSON.stringify(parsedInfo)}`);
			return parsedInfo;
		} catch (error) {
			this.handleRedisError(
				error,
				'REDIS_METRICS_RETRIEVAL_ERROR',
				{ reason: 'Failed to retrieve Redis metrics' },
				`Error retrieving Redis metrics`
			);
			throw new Error('Error retrieving Redis metrics');
		}
	}

	private parseRedisInfo(info: string): RedisMetrics {
		const result: Partial<RedisMetrics> = {};
		const lines = info.split('\n');

		lines.forEach(line => {
			const [key, value] = line.split(':');
			if (key && value) {
				switch (key.trim()) {
					case 'uptime_in_seconds':
						result.uptime_in_seconds =
							parseInt(value.trim(), 10) || 0;
						break;
					case 'used_memory':
						result.used_memory = parseInt(value.trim(), 10) || 0;
						break;
					case 'connected_clients':
						result.connected_clients =
							parseInt(value.trim(), 10) || 0;
						break;
					case 'db0':
						const sizeMatch = value.match(/keys=(\d+)/);
						if (sizeMatch) {
							result.db0_size = parseInt(sizeMatch[1], 10);
						}
						break;
				}
			}
		});

		return result as RedisMetrics;
	}

	private handleRedisFailure(retries: number): void {
		this.errorLogger.logError(
			`Max retries (${retries}) reached for Redis connection`
		);
		this.errorHandler.handleError({
			error: new Error('Redis connection failed after max retries'),
			details: { reason: 'Failed to connect to Redis' }
		});
	}

	private handleRedisError(
		error: unknown,
		errorHeader: string,
		errorDetails: object,
		customMessage: string
	): void {
		const errorMessage = `${customMessage}: ${error}\n${error instanceof Error ? error.stack : ''}`;
		this.errorLogger.logError(errorMessage);

		const redisError = new this.errorHandler.ErrorClasses.RedisServiceError(
			errorHeader,
			{
				details: errorDetails,
				exposeToClient: false
			}
		);

		this.errorHandler.handleError({
			error: redisError
		});
	}
}
