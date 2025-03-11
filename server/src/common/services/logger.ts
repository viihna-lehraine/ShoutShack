import { env } from '../../config/env.js';
import pino from 'pino';

export const logger = pino.default({
	transport: {
		target: 'pino-pretty',
		options: {
			colorize: true,
			translateTime: 'HH:MM:ss Z',
			ignore: 'pid,hostname'
		}
	},
	level: env.LOG_LEVEL
});
