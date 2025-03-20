// File: backend/src/start.ts

import Fastify from 'fastify';
import fs from 'fs';
import path from 'path';
import { env } from './env/load.js';
import { authPlugin } from './plugins/auth.js';
import { registerGlobalErrorHandler } from './common/services/errorHandler.js';
import { registerRoutes } from './routes/index.js';
import { securityPlugin } from './plugins/security.js';
import { startCronJobs } from './common/services/scheduler.js';

fs.mkdirSync(env.LOG_DIR, { recursive: true });

const logFilePath = path.join(env.LOG_DIR, 'shoutshack.log');

export const app = Fastify({
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
console.log = (...args) => app.log.info(args.join(' '));
console.warn = (...args) => app.log.warn(args.join(' '));
console.error = (...args) => app.log.error(args.join(' '));
console.debug = (...args) => app.log.debug(args.join(' '));

const start = async () => {
	try {
		securityPlugin(app);

		authPlugin(app);

		registerRoutes(app);

		registerGlobalErrorHandler(app);

		await app.listen({ port: env.SERVER_PORT, host: env.SERVER_HOST });

		console.log(`Server running at http://${env.SERVER_HOST}:${env.SERVER_PORT}/`);
		console.log('Printing routes');
		console.log(app.printRoutes({ commonPrefix: false }));

		console.log('Importing and registering server tasks');
		import('./tasks/index.js').then(({ registerTasks }) => {
			registerTasks();
			startCronJobs();
		});
		console.log('Task registration complete');
	} catch (err) {
		console.error('Server startup failed:', err);
		process.exit(1);
	}
};

start();
