// File: server/config/auth.ts

import bcrypt from 'bcrypt';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

const SALT_ROUNDS = 30;

export const registerAuth = (app: FastifyInstance) => {
	app.register(import('@fastify/jwt'), {
		secret: process.env.JWT_SECRET || 'supersecret'
	});

	app.decorate('hashPassword', async (password: string) => {
		return await bcrypt.hash(password, SALT_ROUNDS);
	});

	app.decorate('verifyPassword', async (password: string, hash: string) => {
		return await bcrypt.compare(password, hash);
	});

	app.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
		try {
			await request.jwtVerify();
		} catch (err) {
			reply.code(401).send({ error: 'Unauthorized' });
		}
	});

	console.log('Authentication middleware registered');
};
