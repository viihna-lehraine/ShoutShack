// File: server/src/common/services/errorHandler.ts

import { AppError } from '../../types/index.js';
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { logger } from './logger.js';

export const errorHandler = (app: FastifyInstance) => {
	app.setErrorHandler((error, _req: FastifyRequest, reply: FastifyReply) => {
		const statusCode = error instanceof AppError ? error.statusCode : 500;

		logger.error(`[ERROR] ${error.message}`, { stack: error.stack });

		reply.status(statusCode).send({
			success: false,
			message: error.message || 'Internal Server Error'
		});
	});
};
