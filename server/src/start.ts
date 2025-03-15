// File: server/src/start.ts

import Fastify from 'fastify';
import fs from 'fs';
import path from 'path';
import { env } from './config/env.js';
import { registerAuth } from './config/auth.js';
import { registerGlobalErrorHandler } from './services/errorHandler.js';
import { registerRoutes } from './routes/index.js';
import { registerSecurityMiddleware } from './config/security.js';
import { startCronJobs } from './services/scheduler.js';

fs.mkdirSync(env.LOG_DIR, { recursive: true });

const logFilePath = path.join(env.LOG_DIR, 'shoutshack.log');

export const fastify = Fastify({
	logger: {
		level: env.LOG_LEVEL || 'info',
		transport: {
			targets: [
				{
					target: 'pino/file',
					options: { destination: logFilePath, mkdir: true }
				},
				{
					target: 'pino-pretty',
					options: { colorize: true, translateTime: 'SYS:standard' }
				}
			]
		}
	}
});

// override console methods to use Fastify's logger
console.log = (...args) => fastify.log.info(args.join(' '));
console.warn = (...args) => fastify.log.warn(args.join(' '));
console.error = (...args) => fastify.log.error(args.join(' '));
console.debug = (...args) => fastify.log.debug(args.join(' '));

const start = async () => {
	try {
		registerSecurityMiddleware(fastify);
		registerAuth(fastify);
		registerRoutes(fastify);
		registerGlobalErrorHandler(fastify);

		await fastify.listen({ port: env.SERVER_PORT, host: env.SERVER_HOST });

		console.log(`Server running at http://${env.SERVER_HOST}:${env.SERVER_PORT}/`);

		import('./tasks/index.js').then(({ registerTasks }) => {
			registerTasks();
			startCronJobs();
		});
	} catch (err) {
		console.error('Server startup failed:', err);

		process.exit(1);
	}
};

start();
