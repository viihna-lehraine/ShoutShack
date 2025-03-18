// File: backend/src/types/main.d.ts

import '@fastify/session';

declare module 'fastify' {
	interface FastifyInstance {
		authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void>;
		hashPassword(password: string): Promise<string>;
		verifyPassword(password: string, hash: string): Promise<boolean>;
	}
}

declare module '@fastify/session' {
	interface FastifySessionObject {
		user?: {
			id: number;
			email: string;
		};
	}
}
