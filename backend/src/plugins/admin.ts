// File: backend/src/plugins/admin.ts

import { FastifyReply, FastifyRequest } from 'fastify';
import fs from 'fs';
import argon2 from 'argon2';

export async function verifyAdminPassword(password: string): Promise<boolean> {
	try {
		const storedData = fs.readFileSync('/etc/shoutshack/admin.pw', 'utf-8').trim();
		const [salt, storedHash] = storedData.split(':');

		return await argon2.verify(storedHash, password + salt);
	} catch (error) {
		console.error('Admin password verification error:', error);
		return false;
	}
}

export async function adminAuthMiddleware(request: FastifyRequest, reply: FastifyReply) {
	const session = request.session as unknown as { isAdmin?: boolean }; // Temporary cast

	if (!session.isAdmin) {
		return reply.status(401).send({ error: 'Unauthorized' });
	}
}
