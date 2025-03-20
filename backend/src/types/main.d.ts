// File: backend/src/types/main.d.ts

import '@fastify/session';
import { FastifyRequest, FastifyReply } from 'fastify';

declare module '@fastify/session' {
	interface SessionData {
		user?: {
			id: number;
			email: string;
		};
		userId?: number;
		isAdmin?: boolean;
	}
}

declare module 'fastify' {
	interface FastifyInstance {
		authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void>;
		hashPassword(password: string): Promise<string>;
		verifyPassword(password: string, hash: string): Promise<boolean>;
	}
}
