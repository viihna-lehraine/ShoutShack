// File: backend/tests/unit/db/main.test.ts

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Kysely, PostgresDialect } from 'kysely';
import pg from 'pg';
import { db } from '../../../src/db/main.js';
import { env } from '../../../src/config/env.js';

vi.mock('pg', () => {
	return {
		Pool: vi.fn().mockImplementation(() => ({
			connect: vi.fn(),
			end: vi.fn(),
			query: vi.fn().mockResolvedValue({ rows: [] })
		}))
	};
});

vi.mock('kysely', () => {
	return {
		Kysely: vi.fn().mockImplementation(() => ({
			destroy: vi.fn()
		})),
		PostgresDialect: vi.fn()
	};
});

describe('Database Connection (db/main.ts)', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		db.destroy(); // Close mock DB connection
	});

	it('should initialize Kysely with PostgresDialect', () => {
		expect(Kysely).toHaveBeenCalledWith(
			expect.objectContaining({
				dialect: expect.any(PostgresDialect)
			})
		);
	});

	it('should pass correct environment variables to Postgres Pool', () => {
		expect(pg.Pool).toHaveBeenCalledWith({
			user: env.POSTGRES_USER,
			host: env.POSTGRES_HOST,
			database: env.POSTGRES_DB,
			password: env.POSTGRES_PASSWORD,
			port: env.POSTGRES_PORT
		});
	});
});
