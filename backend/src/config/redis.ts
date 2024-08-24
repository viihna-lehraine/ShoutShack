import { createClient } from 'redis';
import setupLogger from './logger';

const logger = await setupLogger();

async function connectRedis() {
	let client = createClient({
		url: 'redis://localhost:6379'
	});

	client.on('error', err => {
		logger.error('Redis client error:', err);
	});

	await client.connect();
	logger.info('Connected to Redis');

	await client.set('key', 'value');
	let value = await client.get('key');
	logger.info('Key value:', value);

	return client;
}

let redisClient = connectRedis();

export default redisClient;
