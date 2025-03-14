// File: server/src/db/main.ts

import { Database } from '../types/index.js';
import { env } from '../config/env.js';
import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';

export const db = new Kysely<Database>({
	dialect: new PostgresDialect({
		pool: new Pool({
			user: env.POSTGRES_USER,
			host: env.POSTGRES_HOST,
			database: env.POSTGRES_DB,
			password: env.POSTGRES_PASSWORD,
			port: env.POSTGRES_PORT
		})
	})
});
