import { createClient, RedisClientType } from 'redis';
import { validateDependencies, handleGeneralError } from '../middleware/errorHandler';
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
			handleGeneralError(err, logger || console);
		});

		await client.connect();
		logger.info('Connected to Redis');

		redisClient = client;
		return client;
	} catch (err) {
		handleGeneralError(err, logger || console);
		return null;
	}
}

export function getRedisClient(): RedisClientType | null {
	return redisClient;
}
