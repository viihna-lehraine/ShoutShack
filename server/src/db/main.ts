// File: server/src/db/main.ts

import { env } from '../config/env.js';
import { Pool } from 'pg';

export const dbClient = new Pool({
	user: env.POSTGRES_USER,
	host: env.POSTGRES_HOST,
	database: env.POSTGRES_DB,
	password: env.POSTGRES_PASSWORD,
	port: env.POSTGRES_PORT
});

export async function query(sql: string, params?: any[]) {
	const client = await dbClient.connect();

	try {
		const result = await client.query(sql, params);
		return result.rows;
	} catch (error) {
		console.error('Database query error:', error);
		throw error;
	} finally {
		client.release();
	}
}

(async () => {
	try {
		await dbClient.query('SELECT 1');
		console.log('Database connection successful.');
	} catch (error) {
		console.error('Database connection error:', error);
		process.exit(1);
	}
})();
