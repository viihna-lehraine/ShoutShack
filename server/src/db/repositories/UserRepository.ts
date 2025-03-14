// File: server/src/db/repositories/UserRepository.ts

import { db } from '../main.js';
import { randomBytes } from 'crypto';

export class UserRepository {
	static async createUser(email: string, hashedPassword: string) {
		const token = randomBytes(32).toString('hex');

		await db
			.insertInto('users')
			.values({
				email,
				password: hashedPassword,
				verified: false,
				verification_token: token
			})
			.returning(['id'])
			.executeTakeFirstOrThrow();

		return token;
	}

	static async findUserByEmail(email: string) {
		return db
			.selectFrom('users')
			.select(['id', 'password'])
			.where('email', '=', email)
			.executeTakeFirst();
	}

	static async verifyUser(token: string) {
		return db
			.updateTable('users')
			.set({ verified: true, verification_token: null })
			.where('verification_token', '=', token)
			.returning(['id', 'email'])
			.executeTakeFirst();
	}

	static async getUserProfile(userId: number) {
		return db.selectFrom('users').select(['email']).where('id', '=', userId).executeTakeFirst();
	}
}
