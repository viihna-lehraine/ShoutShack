// File: server/src/routes/api/main.ts

import { FastifyInstance, FastifyReply } from 'fastify';
import { AuthController } from '../../controllers/Auth.js';
import fs from 'fs/promises';
import { client } from '../../db/main.js';

export const registerApiRoutes = (fastify: FastifyInstance) => {
	fastify.get('/health', async (_, reply: FastifyReply) => {
		try {
			await client.query('SELECT 1');
			console.log('Database connection is healthy.');

			const backups = await fs.readdir('/db/backups');
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
	fastify.post('/signup', AuthController.login);
	fastify.get('/profile', { preHandler: fastify.authenticate }, AuthController.getProfile);
};
