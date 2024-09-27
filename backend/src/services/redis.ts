import { RedisClientType } from 'redis';
import {
	AppLoggerServiceInterface,
	ConfigServiceInterface,
	ErrorHandlerServiceInterface,
	ErrorLoggerServiceInterface,
	FlushRedisMemoryCacheInterface,
	GetRedisClientInterface,
	RedisServiceDeps,
	RedisServiceInterface
} from '../index/interfaces';
import { HandleErrorStaticParameters } from '../index/parameters';
import { validateDependencies } from '../utils/helpers';
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

	public async connectRedis({
		req,
		res,
		next,
		blankRequest
	}: RedisServiceDeps): Promise<RedisClientType | null> {
		try {
			validateDependencies(
				[
					{
						name: 'createRedisClient',
						instance: this.createRedisClient
					}
				],
				this.logger
			);

			if (!this.redisClient) {
				const client: RedisClientType = this.createRedisClient({
					url: this.configService.getEnvVariable('redisUrl'),
					socket: {
						reconnectStrategy: retries => {
							const retryAfter = Math.min(retries * 100, 3000);
							this.errorLogger.logWarn(
								`reason: Error connecting to Redis instance at ${this.configService.getEnvVariable('redisUrl')}, retrying in ${retryAfter}ms. ${retries} retries so far`,
								{}
							);
							if (retries >= 10) {
								const serviceError =
									new this.errorHandler.ErrorClasses.ServiceUnavailableError(
										retryAfter,
										'Redis Service',
										{
											retries,
											redisUrl:
												this.configService.getEnvVariable(
													'redisUrl'
												),
											exposeToClient: false
										}
									);
								this.errorLogger.logError(
									serviceError.message,
									{}
								);
								this.errorHandler.handleError({
									error:
										serviceError ||
										Error ||
										'Redis Service Error',
									details: {
										reason: 'Failed to initialize Redis'
									}
								});

								this.errorLogger.logError(
									'Max retries reached when trying to initialize Redis.'
								);
							}

							return retryAfter;
						}
					}
				});

				client.on('error', error => {
					this.errorHandler.expressErrorHandler()(
						error,
						req || blankRequest,
						res,
						next
					);
				});

				await client.connect();
				this.logger.info('Connected to Redis');

				this.redisClient = client;
			}

			return this.redisClient;
		} catch (serviceError) {
			const redisServiceError =
				new this.errorHandler.ErrorClasses.ServiceUnavailableError(
					20,
					`Failed to connect to Redis instance at ${this.configService.getEnvVariable('redisUrl')}`
				);
			this.errorLogger.logError(redisServiceError.message);
			this.errorHandler.handleError({
				...HandleErrorStaticParameters,
				error:
					redisServiceError ||
					serviceError ||
					Error ||
					'Redis Service Unavailable'
			});
			return null;
		}
	}

	public async getRedisClient({
		req,
		res,
		next,
		blankRequest,
		createRedisClient
	}: GetRedisClientInterface): Promise<RedisClientType | null> {
		if (this.redisClient) {
			this.logger.info('Redis client is already connected', {});
		} else {
			this.errorLogger.logWarn(
				'Redis client is not connected. Calling connectRedis()',
				{}
			);
			await this.connectRedis({
				req,
				res,
				next,
				blankRequest,
				createRedisClient,
				validateDependencies
			});
		}
		return this.redisClient;
	}

	public async flushRedisMemoryCache({
		req,
		res,
		next,
		blankRequest,
		createRedisClient
	}: FlushRedisMemoryCacheInterface): Promise<void> {
		this.logger.info('Flushing in-memory cache');
		const redisClient = await this.getRedisClient({
			req,
			res,
			next,
			blankRequest,
			createRedisClient
		});

		if (redisClient) {
			try {
				await redisClient.flushAll();
				this.logger.info('In-memory cache flushed');
			} catch (utilError) {
				const utilityError =
					new this.errorHandler.ErrorClasses.UtilityErrorRecoverable(
						'flushInMemoryCache()',
						{
							message: `Error flushing Redis cache\n${utilError instanceof Error ? utilError.message : utilError}`,
							originalError: utilError
						}
					);
				this.errorLogger.logError(utilityError.message, {});
				this.errorHandler.handleError({
					error:
						utilityError || Error || 'Unable to flush Redis cache'
				});
			}
		} else {
			this.errorLogger.logWarn(
				'Redis client is not available for cache flush\n',
				{}
			);
		}
	}
}
