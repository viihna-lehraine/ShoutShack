// File: server/src/controllers/AuthController.ts

import { FastifyReply, FastifyRequest } from 'fastify';
import { sendVerificationEmail } from '../services/mailer.js';
import argon2 from 'argon2';
import { UserRepo } from '../db/repositories/UserRepo.js';

export class AuthController {
	static async signup(request: FastifyRequest, reply: FastifyReply) {
		const { email, password } = request.body as { email: string; password: string };
		const hashedPassword = await argon2.hash(password, { type: argon2.argon2id });
		const token = await UserRepo.createUser(email, hashedPassword);

		await sendVerificationEmail(email, token);

		return reply.send({ message: 'User registered! Check your email for verification.' });
	}

	static async verify(request: FastifyRequest, reply: FastifyReply) {
		const { token } = request.query as { token: string };
		const user = await UserRepo.verifyUser(token);

		if (!user) {
			return reply.code(400).send({ error: 'Invalid or expired token' });
		}

		return reply.send({ message: 'Email verified successfully! You can now log in.' });
	}

	static async login(request: FastifyRequest, reply: FastifyReply) {
		const { email, password } = request.body as { email: string; password: string };
		const user = await UserRepo.findUserByEmail(email);

		if (!user) {
			return reply.status(401).send({ error: 'Invalid email or password' });
		}

		const isValid = await argon2.verify(user.password, password);

		if (!isValid) {
			return reply.status(401).send({ error: 'Invalid email or password' });
		}

		const token = request.server.jwt.sign({ userId: user.id });
		return reply.send({ message: 'Login successful', token });
	}

	static async getProfile(request: FastifyRequest, reply: FastifyReply) {
		const userId = request.user.userId;

		const user = await UserRepo.getUserProfile(userId);
		if (!user) {
			return reply.status(404).send({ error: 'User not found' });
		}

		return reply.send(user);
	}
}
