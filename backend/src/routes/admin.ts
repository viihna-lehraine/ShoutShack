// File: backend/src/routes/api/admin.ts

import { FastifyInstance } from 'fastify';
import { adminAuthMiddleware, verifyAdminPassword } from '../plugins/admin.js';

export const registerAdminRoutes = (fastify: FastifyInstance) => {
	console.log('Registering admin routes...');

	fastify.register(
		async instance => {
			instance.post('/login', async (request, reply) => {
				const { password } = request.body as { password: string };

				if (!password) {
					return reply.status(400).send({ error: 'Password required' });
				}

				const isValid = await verifyAdminPassword(password);

				if (!isValid) {
					return reply.status(401).send({ error: 'Invalid admin password' });
				}

				(request.session as { isAdmin?: boolean }).isAdmin = true;
				return reply.send({ message: 'Admin login successful' });
			});

			instance.post('/logout', async (request, reply) => {
				request.session.destroy();
				return reply.send({ message: 'Logged out successfully' });
			});

			instance.addHook('preHandler', adminAuthMiddleware);

			instance.get('/dashboard', async (_, reply) => {
				return reply.send({ message: 'Welcome, Admin!' });
			});
		},
		{ prefix: '/admin' }
	);

	console.log('Finished registering Admin routes');
};
