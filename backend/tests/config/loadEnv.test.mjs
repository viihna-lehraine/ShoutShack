import { describe, it, expect, vi, beforeEach } from 'vitest';
import { config } from 'dotenv';
import loadEnv from '../../dist/config/loadEnv.mjs';
import path from 'path';

vi.mock('dotenv', () => ({
	config: vi.fn()
}));

describe('loadEnv', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should load environment variables from the correct path', () => {
		loadEnv();

		// verify that dotenv.config was called with the correct path
		expect(config).toHaveBeenCalledWith({
			path: path.join(process.cwd(), 'backend.dev.env')
		});
	});

	it('should handle dotenv.config errors gracefully', () => {
		config.mockImplementation(() => {
			throw new Error('Failed to load .env file');
		});

		expect(() => loadEnv()).toThrow('Failed to load .env file');
	});
});
