// File: backend/tests/unit/env/load.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import dotenv from 'dotenv';
import path from 'path';

vi.mock('fs');
vi.mock('dotenv', () => ({
	config: vi.fn()
}));

beforeEach(() => {
	vi.restoreAllMocks();
	process.env = {};
});

describe('Environment Configuration', () => {
	it('should load environment variables from the first available .env file', () => {
		const mockEnvPath = path.resolve(process.cwd(), 'backend/conf/.env');

		vi.spyOn(fs, 'existsSync')
			.mockReturnValueOnce(false)
			.mockReturnValueOnce(false)
			.mockReturnValueOnce(true);

		const { env } = require('./env');

		expect(dotenv.config).toHaveBeenCalledWith({ path: mockEnvPath });
		expect(env).toBeDefined();
	});

	it('should throw an error if no .env file is found', () => {
		vi.spyOn(fs, 'existsSync').mockReturnValue(false);

		expect(() => require('./env')).toThrowError(
			'The .env file could not be found in any of its expected locations!'
		);
	});

	it('should correctly parse environment variables', () => {
		process.env.NODE_ENV = 'production';
		process.env.SERVER_PORT = '3000';

		const { env } = require('./env');

		expect(env.NODE_ENV).toBe('production');
		expect(env.SERVER_PORT).toBe(3000);
	});
});
