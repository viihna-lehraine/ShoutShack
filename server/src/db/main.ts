// File: server/src/db/main.ts

import { env } from '../config/env.js';
import pkg from 'pg';

const { Client } = pkg;

export const client = new Client({
	user: env.POSTGRES_USER,
	host: env.POSTGRES_HOST,
	database: env.POSTGRES_DB,
	password: env.POSTGRES_PASSWORD,
	port: env.POSTGRES_PORT
});

export const connectDB = async () => {
	try {
		await client.connect();
		console.log('Database connected successfully.');
	} catch (err) {
		console.error('Database connection error:', err);
		process.exit(1);
	}
};
