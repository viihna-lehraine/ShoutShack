// File: backend/plugins/auth.ts

import { NodeEnv } from '../types/index.js';
import argon2 from 'argon2';
import { env } from '../env/load.js';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fastifySession from '@fastify/session';
import fastifyCookie from '@fastify/cookie';

export const authPlugin = (app: FastifyInstance) => {
	app.register(fastifyCookie);
	app.register(fastifySession, {
		secret: env.SESSION_SECRET,
		cookie: {
			httpOnly: true,
			secure: env.NODE_ENV === ('prod' as NodeEnv),
			sameSite: 'lax',
			maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
		},
		saveUninitialized: false
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
		if (!(request.session as { user?: { id: number; email: string } }).user) {
			return reply.code(401).send({ error: 'Unauthorized' });
		}
	});

	console.log('Authentication plugin registered');
};
