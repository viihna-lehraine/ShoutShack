import os from 'os';
import { RedisClientType } from 'redis';
import {
	FlushRedisMemoryCacheInterface,
	GetRedisClientInterface,
	RedisServiceInterface
} from '../index/serviceInterfaces';
import { ProcessErrorStaticParameters } from '../parameters/errorParameters';
import { AppError } from '../errors/errorClasses';
import {
	errorLoggerDetails,
	getCallerInfo,
	blankRequest,
	validateDependencies
} from 'src/utils/helpers';

let redisClient: RedisClientType | null = null;

export async function connectRedis({
	createMemoryMonitor,
	appLogger,
	createRedisClient,
	configService,
	errorLogger,
	errorClasses,
	errorLoggerDetails,
	getCallerInfo,
	validateDependencies,
	processError,
	blankRequest
}: RedisServiceInterface): Promise<RedisClientType | null> {
	try {
		validateDependencies(
			[{ name: 'createRedisClient', instance: createRedisClient }],
			appLogger
		);

		if (!configService.getFeatureFlags().enableRedis) {
			appLogger.debug('Redis is disabled');
			return null;
		}

		if (!redisClient) {
			const client: RedisClientType = createRedisClient({
				url: configService.getEnvVariables().redisUrl,
				socket: {
					reconnectStrategy: retries => {
						const retryAfter = Math.min(retries * 100, 3000);
						errorLogger.logWarning(
							String(Error),
							errorLoggerDetails(getCallerInfo, blankRequest),
							appLogger,
							`reason: Error connecting to Redis instance at ${configService.getEnvVariables().redisUrl}, retrying in ${retryAfter}ms. ${retries} retries so far`
						);
						if (retries >= 10) {
							const serviceError =
								new errorClasses.ServiceUnavailableError(
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
							errorLogger.logError(
								serviceError,
								errorLoggerDetails(
									getCallerInfo,
									blankRequest,
									'REDIS_INIT'
								),
								appLogger,
								configService.getEnvVariables().redisUrl
							);
							processError({
								...ProcessErrorStaticParameters,
								error: serviceError as unknown as AppError,
								req: blankRequest,
								details: {
									reason: 'Failed to initialize Redis'
								}
							});
							appLogger.error(
								'Max retries reached when trying to initialize Redis. Falling back to custom memory monitor'
							);

							createMemoryMonitor({
								os,
								process,
								setInterval,
								appLogger,
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
				processError(error);
			});

			await client.connect();
			appLogger.info('Connected to Redis');

			redisClient = client;
		}

		return redisClient;
	} catch (serviceError) {
		processError({
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
	appLogger,
	errorClasses,
	errorLogger,
	ErrorSeverity,
	processError
}: GetRedisClientInterface): Promise<RedisClientType | null> {
	if (redisClient) {
		errorLogger.logInfo(
			'Redis client is already connected',
			{},
			appLogger,
			ErrorSeverity.INFO
		);
	} else {
		errorLogger.logWarning(
			'Redis client is not connected. Calling connectRedis()',
			{},
			appLogger,
			ErrorSeverity.WARNING
		);
		await connectRedis({
			createMemoryMonitor,
			createRedisClient,
			configService,
			errorLogger,
			errorLoggerDetails,
			getCallerInfo,
			blankRequest,
			validateDependencies,
			processError,
			appLogger,
			errorClasses,
			ErrorSeverity
		});
	}
	return redisClient;
}

export async function flushRedisMemoryCache({
	createMemoryMonitor,
	appLogger,
	configService,
	errorClasses,
	errorLogger,
	ErrorSeverity,
	processError,
	createRedisClient,
	blankRequest
}: FlushRedisMemoryCacheInterface): Promise<void> {
	appLogger.info('Flushing in-memory cache');
	const redisClient = await getRedisClient({
		createRedisClient,
		createMemoryMonitor,
		configService,
		appLogger,
		errorClasses,
		errorLogger,
		ErrorSeverity,
		processError
	});

	if (configService.getFeatureFlags().enableRedis) {
		if (redisClient) {
			try {
				await redisClient.flushAll();
				appLogger.info('In-memory cache flushed');
			} catch (utilError) {
				const utility: string = 'flushInMemoryCache()';
				const utilityError = new errorClasses.UtilityErrorRecoverable(
					'flushInMemoryCache()',
					{
						message: `Error flushing Redis cache\n${utilError instanceof Error ? utilError.message : utilError}`,
						utility,
						exposeToClient: false
					}
				);
				errorLogger.logError(
					utilityError,
					{},
					appLogger,
					ErrorSeverity.WARNING
				);
				processError({
					...ProcessErrorStaticParameters,
					error: utilityError,
					req: blankRequest,
					details: { reason: 'Failed to flush Redis cache' }
				});
			}
		} else {
			errorLogger.logWarning(
				'Redis client is not available for cache flush\n',
				{},
				appLogger,
				ErrorSeverity.WARNING
			);
		}
	} else {
		errorLogger.logInfo(
			'No cache to flush, as Redis is disabled\n',
			{},
			appLogger,
			ErrorSeverity.INFO
		);
	}
}
