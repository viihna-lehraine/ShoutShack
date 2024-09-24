import os from 'os';
import { RedisClientType } from 'redis';
import {
	FlushRedisMemoryCacheInterface,
	GetRedisClientInterface,
	RedisServiceInterface
} from '../index/interfaces';
import { ProcessErrorStaticParameters } from '../index/parameters';
import { AppError } from '../errors/errorClasses';
import { validateDependencies } from '../utils/helpers';
import { blankRequest } from '../utils/constants';

let redisClient: RedisClientType | null = null;

export async function connectRedis({
	createMemoryMonitor,
	createRedisClient,
	configService,
	validateDependencies,
	errorHandler
}: RedisServiceInterface): Promise<RedisClientType | null> {
	const logger = configService.getAppLogger();
	const errorLogger = configService.getErrorLogger();

	try {
		validateDependencies(
			[{ name: 'createRedisClient', instance: createRedisClient }],
			logger
		);

		if (!configService.getFeatureFlags().enableRedis) {
			logger.debug('Redis is disabled');
			return null;
		}

		if (!redisClient) {
			const client: RedisClientType = createRedisClient({
				url: configService.getEnvVariables().redisUrl,
				socket: {
					reconnectStrategy: retries => {
						const retryAfter = Math.min(retries * 100, 3000);
						errorLogger.logWarn(
							`reason: Error connecting to Redis instance at ${configService.getEnvVariables().redisUrl}, retrying in ${retryAfter}ms. ${retries} retries so far`,
							{}
						);
						if (retries >= 10) {
							const serviceError =
								new errorHandler.ErrorClasses.ServiceUnavailableError(
									retryAfter,
									'Redis Service',
									{
										retries,
										redisUrl:
											configService.getEnvVariables()
												.redisUrl,
										exposeToClient: false
									}
								);
							errorLogger.logError(serviceError.message, {});
							errorHandler.handleError({
								...ProcessErrorStaticParameters,
								error: serviceError as unknown as AppError,
								req: blankRequest,
								details: {
									reason: 'Failed to initialize Redis'
								}
							});

							logger.error(
								'Max retries reached when trying to initialize Redis. Falling back to custom memory monitor'
							);

							createMemoryMonitor({
								os,
								process,
								setInterval,
								configService,
								errorLogger,
								validateDependencies
							});
						}

						return retryAfter;
					}
				}
			});

			client.on('error', error => {
				errorHandler.handleError(error);
			});

			await client.connect();
			logger.info('Connected to Redis');

			redisClient = client;
		}

		return redisClient;
	} catch (serviceError) {
		const redisServiceError =
			new errorHandler.ErrorClasses.ServiceUnavailableError(
				20,
				`Failed to connect to Redis instance at ${configService.getEnvVariables().redisUrl}`
			);
		errorHandler.handleError({
			...ProcessErrorStaticParameters,
			error: serviceError as unknown as AppError,
			req: blankRequest,
			details: { reason: 'Failed to connect to Redis' }
		});
		return null;
	}
}

export async function getRedisClient({
	createRedisClient,
	createMemoryMonitor,
	configService,
	errorHandler
}: GetRedisClientInterface): Promise<RedisClientType | null> {
	const appLogger = configService.getAppLogger();
	const errorLogger = configService.getErrorLogger();

	if (redisClient) {
		errorLogger.logInfo('Redis client is already connected', {});
	} else {
		errorLogger.logWarn(
			'Redis client is not connected. Calling connectRedis()',
			{}
		);
		await connectRedis({
			createMemoryMonitor,
			createRedisClient,
			configService,
			blankRequest,
			validateDependencies,
			errorHandler
		});
	}
	return redisClient;
}

export async function flushRedisMemoryCache({
	createMemoryMonitor,
	configService,
	errorHandler,
	createRedisClient,
	blankRequest
}: FlushRedisMemoryCacheInterface): Promise<void> {
	const logger = configService.getAppLogger();

	logger.info('Flushing in-memory cache');
	const redisClient = await getRedisClient({
		createRedisClient,
		createMemoryMonitor,
		configService,
		errorHandler
	});

	if (configService.getFeatureFlags().enableRedis) {
		if (redisClient) {
			try {
				await redisClient.flushAll();
				logger.info('In-memory cache flushed');
			} catch (utilError) {
				const utility: string = 'flushInMemoryCache()';
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
				errorHandler.handleError(
					`${utilityError instanceof Error ? utilityError.message : utilityError}`,

				);
			}
		} else {
			configService
				.getErrorLogger()
				.logWarn('Redis client is not available for cache flush\n', {});
		}
	} else {
		configService
			.getErrorLogger()
			.logInfo('No cache to flush, as Redis is disabled\n', {});
	}
}
