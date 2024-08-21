import { createClient } from 'redis';

async function connectRedis() {
	let client = createClient({
		url: 'redis://localhost:6379'
	});

	client.on('error', (err) => {
		console.error('Redis client error:', err);
	});

	await client.connect();
	console.log('Connected to Redis');

	await client.set('key', 'value');
	let value = await client.get('key');
	console.log('Key value:', value);

	return client;
}

let redisClient = connectRedis();

export default redisClient;
