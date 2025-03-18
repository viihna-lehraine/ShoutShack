// File: backend/src/controllers/AuthController.ts

import { FastifyReply, FastifyRequest } from 'fastify';
import { sendVerificationEmail } from '../services/mailer.js';
import argon2 from 'argon2';
import { loginSchema, signupSchema } from '../config/index.js';
import { UserRepository } from '../db/repositories/UserRepository.js';
import z from 'zod';

export class AuthController {
	static async signup(request: FastifyRequest, reply: FastifyReply) {
		try {
			const { email, password } = signupSchema.parse(request.body);
			const existingUser = await UserRepository.findUserByEmail(email);

			if (existingUser) {
				return reply.status(400).send({ error: 'Email already in use' });
			}

			const hashedPassword = await argon2.hash(password, { type: argon2.argon2id });
			const token = await UserRepository.createUser(email, hashedPassword);

			await sendVerificationEmail(email, token);

			return reply.send({ message: 'User registered! Check your email for verification.' });
		} catch (error) {
			if (error instanceof z.ZodError) {
				return reply.status(400).send({ error: 'Invalid input', details: error.errors });
			}
			console.error('Signup Error:', error);
			return reply.status(500).send({ error: 'Internal server error' });
		}
	}

	static async verify(request: FastifyRequest, reply: FastifyReply) {
		try {
			const { token } = request.query as { token: string };

			if (!token) {
				return reply.status(400).send({ error: 'Missing verification token' });
			}

			const user = await UserRepository.verifyUser(token);
			if (!user) {
				return reply.status(400).send({ error: 'Invalid or expired token' });
			}

			return reply.send({ message: 'Email verified successfully! You can now log in.' });
		} catch (error) {
			console.error('Verification Error:', error);
			return reply.status(500).send({ error: 'Internal server error' });
		}
	}

	static async login(request: FastifyRequest, reply: FastifyReply) {
		try {
			const { email, password } = loginSchema.parse(request.body);
			const user = await UserRepository.findUserByEmail(email);

			if (!user) {
				return reply.status(401).send({ error: 'Invalid email or password' });
			}

			const isValid = await argon2.verify(user.password, password);

			if (!isValid) {
				return reply.status(401).send({ error: 'Invalid email or password' });
			}
			if (!user.id) {
				return reply.status(401).send({ error: 'Unauthorized' });
			}

			request.session.user = { id: user.id, email: user.email };

			return reply.send({ message: 'Login successful' });
		} catch (error) {
			if (error instanceof z.ZodError) {
				return reply.status(400).send({ error: 'Invalid input', details: error.errors });
			}

			console.error('Login Error:', error);
			return reply.status(500).send({ error: 'Internal server error' });
		}
	}

	static async getProfile(request: FastifyRequest, reply: FastifyReply) {
		try {
			const userId = request.session.user?.id;

			if (!userId) {
				return reply.status(401).send({ error: 'Unauthorized' });
			}

			const user = await UserRepository.getUserProfile(userId);
			if (!user) {
				return reply.status(404).send({ error: 'User not found' });
			}

			return reply.send(user);
		} catch (error) {
			console.error('Profile Error:', error);
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
