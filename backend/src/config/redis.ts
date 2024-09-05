import { createClient, RedisClientType } from 'redis';
import { validateDependencies } from '../utils/validateDependencies';
import { processError } from '../utils/processError';
import { FeatureFlags } from './environmentConfig';
import { Logger } from './logger';

interface RedisDependencies {
  logger: Logger;
  featureFlags: FeatureFlags;
  createRedisClient: typeof createClient;
  redisUrl: string;
}

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
            logger.warn(`Redis retry attempt: ${retries}`);
            if (retries >= 10) {
              logger.error('Max retries reached. Could not connect to Redis.');
              return new Error('Max retries reached');
            }
            return Math.min(retries * 100, 3000);
          },
        },
      });

      client.on('error', (err) => {
        processError(err, logger || console);
      });

      await client.connect();
      logger.info('Connected to Redis');

      redisClient = client;
    }

    return redisClient;
  } catch (err) {
    processError(err, logger || console);
    return null;
  }
}

export async function getRedisClient(): Promise<RedisClientType | null> {
  if (!redisClient) {
    throw new Error('Redis client is not connected. Call connectRedis first.');
  }
  return redisClient;
}
