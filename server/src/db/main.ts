// File: server/src/db/main.ts

import { env } from '../config/env.js';
import pkg from 'pg';

const { Client } = pkg;

const connectDB = async () => {
	const client = new Client({
		user: env.POSTGRES_USER,
		host: env.POSTGRES_HOST,
		database: env.POSTGRES_DB,
		password: env.POSTGRES_PASSWORD,
		port: env.POSTGRES_PORT
	});

	for (let i = 0; i < 10; i++) {
		try {
			console.log(`Connecting to database... Attempt ${i + 1} out of 10`);
			await client.connect();
			console.log('Database connected successfully.');

			return client;
		} catch (err) {
			console.error('Database connection failed:', err);
			await new Promise(res => setTimeout(res, 3000));
		}
	}

	throw new Error('Could not connect to Postgres after 10 attempts.');
};

// export promise instead of awaiting it
export const dbClientPromise: Promise<pkg.Client> = connectDB();
