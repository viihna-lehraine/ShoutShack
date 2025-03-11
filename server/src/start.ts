// File: server/src/start.ts

import { env } from './config/env.js';
import Fastify from 'fastify';

export const fastify = Fastify({
	logger: {
		transport: {
			level: 'debug',
			options: {
				colorize: true,
				translateTime: 'SYS:standard'
			},
			target: 'pino-pretty'
		}
	}
});

const start = async () => {
	try {
		await fastify.listen({ port: env.SERVER_PORT, host: env.SERVER_HOST });

		console.log(`Fastify server running at http://${env.SERVER_HOST}:${env.SERVER_PORT}/`);
	} catch (err) {
		console.error('Server startup failed:', err);

		process.exit(1);
	}
};

start();
