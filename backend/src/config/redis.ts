import { createClient, RedisClientType } from 'redis';
import setupLogger from './logger';
import { getFeatureFlags } from './featureFlags';

const logger = setupLogger();
const REDIS_FLAG = getFeatureFlags().enableRedisFlag;

let redisClient: RedisClientType | null = null;

export async function connectRedis(): Promise<RedisClientType | null> {
	if (!REDIS_FLAG || REDIS_FLAG !== true) {
		logger.info('Redis is disabled based on REDIS_FLAG');
		return null; // return null if REDIS_FLAG is false
	}

	try {
		const client: RedisClientType = createClient({
			url: 'redis://localhost:6379',
			socket: {
				reconnectStrategy: retries => {
					logger.warn(`Redis retry attempt: ${retries}`);
					if (retries >= 10) {
						logger.error(
							'Max retries reached. Could not connect to Redis.'
						);
						return new Error('Max retries reached');
					}
					return Math.min(retries * 100, 3000); // reconnect after increasing intervals up to 3 seconds
				}
			}
		});

		client.on('error', err => {
			logger.error('Redis client error:', err);
		});

		await client.connect();
		logger.info('Connected to Redis');

		redisClient = client;
		return client;
	} catch (err) {
		logger.error('Failed to connect to Redis:', err);
		return null; // Ensure no further Redis operations are attempted
	}
}

export function getRedisClient(): RedisClientType | null {
	return redisClient;
}
