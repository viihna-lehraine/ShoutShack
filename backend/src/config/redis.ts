import os from 'os';
import { createClient, RedisClientType } from 'redis';
import { ConfigService } from '../config/configService';
import { featureFlags } from '../environment/envVars';
import { errorClasses } from '../errors/errorClasses';
import { ErrorLogger } from '../errors/errorLogger';
import { processError } from '../errors/processError';
import { createMemoryMonitor } from '../middleware/memoryMonitor';
import { validateDependencies } from '../utils/validateDependencies';

interface RedisDependencies {
  createRedisClient: typeof createClient;
  redisUrl: string;
}

let redisClient: RedisClientType | null = null;

export async function connectRedis({
  createRedisClient,
  redisUrl
}: RedisDependencies): Promise<RedisClientType | null> {
	const configService = ConfigService.getInstance();
	const appLogger = configService.getLogger();
	const featureFlags = configService.getFeatureFlags();

  try {
    validateDependencies(
			[
        { name: 'createRedisClient', instance: createRedisClient },
        { name: 'redisUrl', instance: redisUrl },
      ],
      appLogger || console
    );

    if (!featureFlags.enableRedis) {
      appLogger.info(`Redis is disabled based on REDIS_FLAG`);
      return null;
    }

    if (!redisClient) {
      const client: RedisClientType = createRedisClient({
        url: redisUrl,
        socket: {
          reconnectStrategy: (retries) => {
			const retryAfter = Math.min(retries * 100, 3000);
            ErrorLogger.logWarning(`Redis retry attempt: ${retries}`, appLogger, { retries, redisUrl});
            if (retries >= 10) {
							const serviceError = new errorClasses.ServiceUnavailableError(
								retryAfter,
								'Redis Service',
								{
									retries,
									redisUrl,
									exposeToClient: false
								}
							)
              ErrorLogger.logError(serviceError, appLogger, {
								retries,
								redisUrl });
							processError(serviceError, appLogger);
              appLogger.error('Max retries reached when trying to initialize Redis. Falling back to custom memory monitor');

							createMemoryMonitor({ appLogger, os, process, setInterval });
            }

						return retryAfter;
          },
        },
      });

      client.on('error', (error) => {
        processError(error, appLogger || console);
      });

      await client.connect();
      appLogger.info('Connected to Redis');

      redisClient = client;
    }

    return redisClient;
  } catch (serviceError) {
    processError(serviceError, appLogger || console);
    return null;
  }
}

export async function getRedisClient(createRedisClient: typeof createClient): Promise<RedisClientType | null> {
	const configService = ConfigService.getInstance();
	const appLogger = configService.getLogger();
	const envVariables = configService.getEnvVariables();

	const redisUrl = envVariables.redisUrl;

	if (redisClient) {
		ErrorLogger.logInfo('Redis client is already connected', appLogger);
	}
	else {
    ErrorLogger.logWarning('Redis client is not connected. Calling connectRedis()', appLogger);
		await connectRedis({ createRedisClient, redisUrl });
	}
	return redisClient;
}

export async function flushInMemoryCache(): Promise<void> {
	const configService = ConfigService.getInstance();
	const appLogger = configService.getLogger();
	const featureFlags = configService.getFeatureFlags();

	appLogger.info('Flushing in-memory cache');
	const redisClient = await getRedisClient(createClient);

	if (featureFlags.enableRedis) {
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
				ErrorLogger.logError(utilityError, appLogger || console);
				processError(utilityError, appLogger || console);
			}
		} else {
			ErrorLogger.logWarning(
				'Redis client is not available for cache flush\n',
				appLogger
			);
		}
	} else {
		ErrorLogger.logInfo(
			'No cache to flush, as Redis is disabled\n',
			appLogger
		);
	}
}
