import { RedisClientType } from 'redis';
import {
	AppLoggerServiceInterface,
	ConfigServiceInterface,
	ErrorHandlerServiceInterface,
	ErrorLoggerServiceInterface,
	RedisServiceDeps,
	RedisServiceInterface
} from '../index/interfaces';
import { HandleErrorStaticParameters } from '../index/parameters';
import { ServiceFactory } from '../index/factory';

export class RedisService implements RedisServiceInterface {
	private static instance: RedisService | null = null;
	private redisClient: RedisClientType | null = null;
	private logger: AppLoggerServiceInterface;
	private errorLogger: ErrorLoggerServiceInterface;
	private errorHandler: ErrorHandlerServiceInterface;
	private configService: ConfigServiceInterface;

	private constructor(
		private readonly createRedisClient: typeof import('redis').createClient
	) {
		this.logger = ServiceFactory.getLoggerService();
		this.errorLogger = ServiceFactory.getErrorLoggerService();
		this.errorHandler = ServiceFactory.getErrorHandlerService();
		this.configService = ServiceFactory.getConfigService();
	}

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

	public async get<T>(key: string): Promise<T | null> {
		await this.connectRedisClient();
		if (!this.redisClient) throw new Error('Redis client is not connected');
		try {
			const result = await this.redisClient.get(key);
			return result ? JSON.parse(result) : null;
		} catch (error) {
			this.errorLogger.logError(`Error fetching key ${key}: ${error}`);
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
				`Key ${key} set in Redis with expiration ${expiration}`
			);
		} catch (error) {
			this.errorLogger.logError(`Error setting key ${key}: ${error}`);
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
			this.errorLogger.logError(`Error deleting key ${key}: ${error}`);
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
			this.errorLogger.logError(
				`Error checking existence of key ${key}: ${error}`
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
			this.errorLogger.logError(
				`Error incrementing key ${key}: ${error}`
			);
			return null;
		}
	}

	private async connectRedisClient(): Promise<void> {
		if (this.redisClient) return;

		try {
			this.redisClient = this.createRedisClient({
				url: this.configService.getEnvVariable('redisUrl'),
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
			this.errorHandler.handleError({
				...HandleErrorStaticParameters,
				error,
				details: { reason: 'Failed to connect to Redis' }
			});
		}
	}

	public async getRedisClient(): Promise<RedisClientType | null> {
		await this.connectRedisClient();
		return this.redisClient;
	}

	public async flushRedisMemoryCache(): Promise<void> {
		await this.connectRedisClient();

		if (this.redisClient) {
			try {
				await this.redisClient.flushAll();
				this.logger.info('Redis cache flushed successfully');
			} catch (error) {
				this.errorLogger.logError(
					`Error flushing Redis cache: ${error}`
				);
			}
		} else {
			this.errorLogger.logWarn(
				'Redis client is not available for cache flush'
			);
		}
	}

	public async cleanUpRedisClient(): Promise<void> {
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
}
