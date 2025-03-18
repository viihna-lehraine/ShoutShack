// File: backend/src/services/errorHandler.ts

import { AppError } from '../types/index.js';
import { FastifyError, FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

export const registerGlobalErrorHandler = (app: FastifyInstance) => {
	app.setErrorHandler((error: FastifyError, _req: FastifyRequest, reply: FastifyReply) => {
		const statusCode = error instanceof AppError ? error.statusCode : 500;

		console.error(`[ERROR] ${error.message}`, { stack: error.stack });

		reply.status(statusCode).send({
			success: false,
			error: error.name || 'InternalServerError',
			message: error.message || 'Something went wrong',
			statusCode
		});
	});

	console.log('Global error handler registered');
};
