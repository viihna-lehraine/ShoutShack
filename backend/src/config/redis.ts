import os from 'os';
import { createClient, RedisClientType } from 'redis';
import { envVariables, FeatureFlags, getFeatureFlags } from './envConfig';
import { errorClasses } from '../errors/errorClasses';
import { ErrorLogger } from '../errors/errorLogger';
import { processError } from '../errors/processError';
import { createMemoryMonitor } from '../middleware/memoryMonitor';
import { logger, Logger } from '../utils/logger';
import { validateDependencies } from '../utils/validateDependencies';

interface RedisDependencies {
  logger: Logger;
  featureFlags: FeatureFlags;
  createRedisClient: typeof createClient;
  redisUrl: string;
}

const featureFlags: FeatureFlags = getFeatureFlags(logger);
const redisUrl = envVariables.redisUrl;

let redisClient: RedisClientType | null = null;

export async function connectRedis({
  logger,
  featureFlags,
  createRedisClient,
  redisUrl
}: RedisDependencies): Promise<RedisClientType | null> {
  try {
    validateDependencies(
      [
        { name: 'logger', instance: logger },
        { name: 'featureFlags', instance: 'featureFlags' },
        { name: 'createRedisClient', instance: createRedisClient },
        { name: 'redisUrl', instance: redisUrl },
      ],
      logger || console
    );

    if (!featureFlags.enableRedisFlag) {
      logger.info(`Redis is disabled based on REDIS_FLAG`);
      return null;
    }

    if (!redisClient) {
      const client: RedisClientType = createRedisClient({
        url: redisUrl,
        socket: {
          reconnectStrategy: (retries) => {
						const retryAfter = Math.min(retries * 100, 3000);
            ErrorLogger.logWarning(`Redis retry attempt: ${retries}`, logger, { retries, redisUrl});
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
              ErrorLogger.logError(serviceError, logger, {
								retries,
								redisUrl });
							processError(serviceError, logger);
              logger.error('Max retries reached when trying to initialize Redis. Falling back to custom memory monitor');

							createMemoryMonitor({ logger, os, process, setInterval });
            }

						return retryAfter;
          },
        },
      });

      client.on('error', (error) => {
        processError(error, logger || console);
      });

      await client.connect();
      logger.info('Connected to Redis');

      redisClient = client;
    }

    return redisClient;
  } catch (serviceError) {
    processError(serviceError, logger || console);
    return null;
  }
}

export async function getRedisClient(createRedisClient: typeof createClient): Promise<RedisClientType | null> {

	if (redisClient) {
		ErrorLogger.logInfo('Redis client is already connected', logger);
	}
	else {
    ErrorLogger.logWarning('Redis client is not connected. Calling connectRedis()', logger);
		await connectRedis({ logger, featureFlags, createRedisClient, redisUrl });
	}
	return redisClient;
}
