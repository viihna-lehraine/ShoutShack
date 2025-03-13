import { query } from '../main.js';
import { randomBytes } from 'crypto';

export class UserRepo {
	static async createUser(email: string, hashedPassword: string) {
		const token = randomBytes(32).toString('hex');

		await query(
			`INSERT INTO users (email, password, verified, verification_token)
             VALUES ($1, $2, $3, $4)`,
			[email, hashedPassword, false, token]
		);

		return token;
	}

	static async findUserByEmail(email: string) {
		const users = await query(`SELECT id, password FROM users WHERE email = $1`, [email]);

		return users.length ? users[0] : null;
	}

	static async verifyUser(token: string) {
		const result = await query(
			`UPDATE users SET verified = true, verification_token = NULL
             WHERE verification_token = $1 RETURNING id, email`,
			[token]
		);

		return result.length ? result[0] : null;
	}

	static async getUserProfile(userId: number) {
		const users = await query(`SELECT email FROM users WHERE id = $1`, [userId]);
		return users.length ? users[0] : null;
	}
}
