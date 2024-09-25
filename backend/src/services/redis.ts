import { RedisClientType } from 'redis';
import {
	AppLoggerInterface,
	DependencyInterface,
	FlushRedisMemoryCacheInterface,
	GetRedisClientInterface,
	RedisServiceDeps,
	RedisServiceInterface
} from '../index/interfaces';
import { HandleErrorStaticParameters } from '../index/parameters';
import { validateDependencies } from '../utils/helpers';

export class RedisService implements RedisServiceInterface {
	private static instance: RedisService | null = null;
	private redisClient: RedisClientType | null = null;

	private constructor(
		private readonly configService: typeof import('../services/configService').configService,
		private readonly createRedisClient: typeof import('redis').createClient,
		private readonly validateDependencies: (
			dependencies: DependencyInterface[],
			logger: AppLoggerInterface
		) => void,
		private readonly errorHandler: typeof import('../services/errorHandler').errorHandler
	) {}

	public static getInstance(deps: RedisServiceDeps): RedisService {
		if (!RedisService.instance) {
			// Validate dependencies
			deps.validateDependencies(
				[
					{
						name: 'createRedisClient',
						instance: deps.createRedisClient
					}
				],
				deps.configService.getAppLogger()
			);

			RedisService.instance = new RedisService(
				deps.configService,
				deps.createRedisClient,
				deps.validateDependencies,
				deps.errorHandler
			);
		}
		return RedisService.instance;
	}

	public async connectRedis({
		req,
		res,
		next,
		blankRequest
	}: RedisServiceDeps): Promise<RedisClientType | null> {
		const logger = this.configService.getAppLogger();
		const errorLogger = this.configService.getErrorLogger();

		try {
			validateDependencies(
				[
					{
						name: 'createRedisClient',
						instance: this.createRedisClient
					}
				],
				logger
			);

			if (!this.redisClient) {
				const client: RedisClientType = this.createRedisClient({
					url: this.configService.getEnvVariables().redisUrl,
					socket: {
						reconnectStrategy: retries => {
							const retryAfter = Math.min(retries * 100, 3000);
							errorLogger.logWarn(
								`reason: Error connecting to Redis instance at ${this.configService.getEnvVariables().redisUrl}, retrying in ${retryAfter}ms. ${retries} retries so far`,
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
												this.configService.getEnvVariables()
													.redisUrl,
											exposeToClient: false
										}
									);
								errorLogger.logError(serviceError.message, {});
								this.errorHandler.handleError({
									error:
										serviceError ||
										Error ||
										'Redis Service Error',
									details: {
										reason: 'Failed to initialize Redis'
									}
								});

								logger.error(
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
				logger.info('Connected to Redis');

				this.redisClient = client;
			}

			return this.redisClient;
		} catch (serviceError) {
			const redisServiceError =
				new this.errorHandler.ErrorClasses.ServiceUnavailableError(
					20,
					`Failed to connect to Redis instance at ${this.configService.getEnvVariables().redisUrl}`
				);
			errorLogger.logError(redisServiceError.message);
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
		createRedisClient,
		configService,
		errorHandler
	}: GetRedisClientInterface): Promise<RedisClientType | null> {
		const logger = configService.getAppLogger();
		const errorLogger = configService.getErrorLogger();

		if (this.redisClient) {
			logger.info('Redis client is already connected', {});
		} else {
			errorLogger.logWarn(
				'Redis client is not connected. Calling connectRedis()',
				{}
			);
			await this.connectRedis({
				req,
				res,
				next,
				blankRequest,
				createRedisClient,
				configService,
				validateDependencies,
				errorHandler
			});
		}
		return this.redisClient;
	}

	public async flushRedisMemoryCache({
		req,
		res,
		next,
		blankRequest,
		configService,
		errorHandler,
		createRedisClient
	}: FlushRedisMemoryCacheInterface): Promise<void> {
		const logger = configService.getAppLogger();

		logger.info('Flushing in-memory cache');
		const redisClient = await this.getRedisClient({
			req,
			res,
			next,
			blankRequest,
			createRedisClient,
			configService,
			errorHandler
		});

		if (redisClient) {
			try {
				await redisClient.flushAll();
				logger.info('In-memory cache flushed');
			} catch (utilError) {
				const utilityError =
					new errorHandler.ErrorClasses.UtilityErrorRecoverable(
						'flushInMemoryCache()',
						{
							message: `Error flushing Redis cache\n${utilError instanceof Error ? utilError.message : utilError}`,
							originalError: utilError
						}
					);
				configService
					.getErrorLogger()
					.logError(utilityError.message, {});
				errorHandler.handleError({
					error:
						utilityError || Error || 'Unable to flush Redis cache'
				});
			}
		} else {
			configService
				.getErrorLogger()
				.logWarn('Redis client is not available for cache flush\n', {});
		}
	}
}
