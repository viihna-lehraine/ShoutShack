// File: server/src/types/main.d.ts

import { FastifyInstance } from 'fastify';

declare module 'fastify' {
	interface FastifyInstance {
		authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void>;
		hashPassword(password: string): Promise<string>;
		verifyPassword(password: string, hash: string): Promise<boolean>;
	}
}

declare module '@fastify/jwt' {
	interface FastifyJWT {
		user: {
			userId: number;
		};
	}
}
