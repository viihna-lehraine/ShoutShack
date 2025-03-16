// File: server/src/routes/api/main.ts

import { FastifyInstance } from 'fastify';
import { AuthController } from '../../controllers/AuthController.js';

export const registerApiRoutes = (fastify: FastifyInstance) => {
	console.log('Registering API routes...');

	fastify.register(
		async instance => {
			instance.get('/health', async (_, reply) => {
				reply.send({ status: 'ok' });
			});

			instance.post('/signup', AuthController.signup);
			instance.post('/login', AuthController.login);
			instance.get('/verify', AuthController.verify);

			if (instance.hasDecorator('authenticate')) {
				instance.get(
					'/profile',
					{ preHandler: instance.authenticate },
					AuthController.getProfile
				);
			} else {
				instance.get('/profile', AuthController.getProfile);
			}
		},
		{ prefix: String('/api') }
	);

	console.log('Finished registering API routes');
};
