// File: server/backend/src/index.ts

import Fastify from 'fastify';

const fastify = Fastify({ logger: true });

fastify.get('/', async () => {
	return { message: 'ShoutShack API is running!' };
});

fastify.get('/api/', async () => {
	return { message: 'ShoutShack API via Nginx!' };
});

const start = async () => {
	try {
		await fastify.listen({ port: 3000, host: '0.0.0.0' });
		console.log('Fastify server running at http://localhost:3000/');
	} catch (err) {
		console.error(err);
		process.exit(1);
	}
};

start();
