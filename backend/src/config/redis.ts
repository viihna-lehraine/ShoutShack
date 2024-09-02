import { createClient, RedisClientType } from 'redis';
import { Logger } from './logger';

interface RedisDependencies {
	logger: Logger;
	getFeatureFlags: () => { enableRedisFlag: boolean };
	createRedisClient: typeof createClient;
	redisUrl: string;
}

let redisClient: RedisClientType | null = null;

export async function connectRedis({
	logger,
	getFeatureFlags,
	createRedisClient,
	redisUrl
}: RedisDependencies): Promise<RedisClientType | null> {
	const REDIS_FLAG = getFeatureFlags().enableRedisFlag;

	if (!REDIS_FLAG) {
		logger.info(`Redis is disabled based on REDIS_FLAG`);
		return null;
	}

	try {
		const client: RedisClientType = createRedisClient({
			url: redisUrl,
			socket: {
				reconnectStrategy: (retries) => {
					logger.warn(`Redis retry attempt: ${retries}`);
					if (retries >= 10) {
						logger.error('Max retries reached. Could not connect to Redis.');
						return new Error('Max retries reached');
					}
					return Math.min(retries * 100, 3000); // reconnect after increasing intervals up to 3 seconds
				},
			},
		});

		client.on('error', (err) => {
			if (err instanceof Error) {
				logger.error(`Redis client error: ${err.message}`);
			} else {
				logger.error(`Redis client error: ${String(err)}`);
			}
		});

		await client.connect();
		logger.info('Connected to Redis');

		redisClient = client;
		return client;
	} catch (err) {
		if (err instanceof Error) {
			logger.error(`Failed to connect to Redis: ${err.message}`);
		} else {
			logger.error(`Failed to connect to Redis: ${String(err)}`);
		}
		return null; // ensure no further Redis operations are attempted
	}
}

export function getRedisClient(): RedisClientType | null {
	return redisClient;
}
