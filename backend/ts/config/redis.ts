import { createClient } from 'redis';

async function connectRedis() {
	const client = createClient({
		url: 'redis://localhost:6379'
	});

	client.on('error', (err) => {
		console.error('Redis client error:', err);
	});

	await client.connect();
	console.log('Connected to Redis');

	await client.set('key', 'value');
	const value = await client.get('key');
	console.log('Key value:', value);

	return client;
}

const redisClient = connectRedis();

export default redisClient;
