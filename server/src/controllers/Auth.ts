// File: server/src/controllers/Auth.ts

import { FastifyReply, FastifyRequest } from 'fastify';
import { client } from '../db/main.js';

export class AuthController {
	static async signup(request: FastifyRequest, reply: FastifyReply) {
		const { username, password } = request.body as { username: string; password: string };
		const existingUser = await client.query('SELECT * FROM users WHERE username = $1', [
			username
		]);

		if (existingUser.rowCount ?? 0) {
			return reply.status(400).send({ error: 'User already exists' });
		}

		const hashedPassword = await request.server.hashPassword(password);

		await client.query('INSERT INTO users (username, password_hash) VALUES ($1, $2)', [
			username,
			hashedPassword
		]);

		reply.send({ message: 'User created successfully' });
	}

	static async login(request: FastifyRequest, reply: FastifyReply) {
		const { username, password } = request.body as { username: string; password: string };
		const user = await client.query('SELECT * FROM users WHERE username = $1', [username]);

		if (user.rowCount === 0) {
			return reply.status(401).send({ error: 'Invalid username or password' });
		}

		const isValid = await request.server.verifyPassword(password, user.rows[0].password_hash);

		if (!isValid) {
			return reply.status(401).send({ error: 'Invalid username or password' });
		}

		const token = request.server.jwt.sign({ userId: user.rows[0].id });

		reply.send({ message: 'Login successful', token });
	}

	static async getProfile(request: FastifyRequest, reply: FastifyReply) {
		const userId = request.user.userId;
		const user = await client.query('SELECT username, email FROM users WHERE id = $1', [
			userId
		]);

		if (user.rowCount === 0) {
			return reply.status(404).send({ error: 'User not found' });
		}

		reply.send(user.rows[0]);
	}
}
