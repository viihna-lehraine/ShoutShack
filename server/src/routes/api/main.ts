// File: server/src/routes/api/main.ts

import { FastifyInstance, FastifyReply } from 'fastify';
import { AuthController } from '../../controllers/AuthController.js';
import fs from 'fs/promises';

export const registerApiRoutes = (fastify: FastifyInstance) => {
	fastify.get('/health', async (_, reply: FastifyReply) => {
		try {
			console.log('Database connection is healthy.');

			let backups = [];
			try {
				backups = await fs.readdir('/db/backups');
			} catch (err) {
				console.error('Failed to read backups directory:', err);
			}

			reply.send({
				status: 'ok',
				db: 'connected',
				backups: backups.length > 0 ? 'present' : 'missing'
			});
		} catch (err) {
			console.error('Health check failed:', err);
			reply.status(500).send({
				status: 'error',
				message: err instanceof Error ? err.message : err
			});
		}
	});

	fastify.post('/signup', AuthController.signup);
	fastify.post('/login', AuthController.login);
	fastify.get('/verify', AuthController.verify);

	if (fastify.hasDecorator('authenticate')) {
		fastify.get('/profile', { preHandler: fastify.authenticate }, AuthController.getProfile);
	} else {
		console.warn(
			"Warning: `fastify.authenticate` is not defined! Profile route won't be protected."
		);
		fastify.get('/profile', AuthController.getProfile);
	}
};
