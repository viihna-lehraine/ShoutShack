// File: server/config/auth.ts

import argon2 from 'argon2';
import { env } from './env.js';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

export const registerAuth = (app: FastifyInstance) => {
	app.register(import('@fastify/jwt'), {
		secret: process.env.JWT_SECRET!
	});

	app.decorate('hashPassword', async (password: string) => {
		return await argon2.hash(password + env.PEPPER, {
			type: argon2.argon2id,
			memoryCost: env.A2_MEMCOST,
			timeCost: env.A2_TIMECOST,
			parallelism: env.A2_PARALLELISM
		});
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
