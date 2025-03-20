// File: backend/src/controllers/AdminController.ts

import { FastifyReply, FastifyRequest } from 'fastify';
import argon2 from 'argon2';
import dotenv from 'dotenv';

dotenv.config();

export class AdminController {
	static async login(request: FastifyRequest, reply: FastifyReply) {
		try {
			const { password } = request.body as { password: string };

			if (!password) {
				return reply.status(400).send({ error: 'Password required' });
			}

			const storedHash = process.env.ADMIN_PASSWORD_HASH;
			if (!storedHash) {
				return reply.status(500).send({ error: 'Admin authentication is misconfigured' });
			}

			const isValid = await argon2.verify(storedHash, password);
			if (!isValid) {
				return reply.status(401).send({ error: 'Invalid password' });
			}

			(request.session as { isAdmin?: boolean }).isAdmin = true;
			return reply.send({ message: 'Admin login successful' });
		} catch (error) {
			console.error('Admin Login Error:', error);
			return reply.status(500).send({ error: 'Internal server error' });
		}
	}

	static async logout(request: FastifyRequest, reply: FastifyReply) {
		try {
			request.session.destroy();
			return reply.send({ message: 'Logged out successfully' });
		} catch (error) {
			console.error('Logout Error:', error);
			return reply.status(500).send({ error: 'Internal server error' });
		}
	}
}
