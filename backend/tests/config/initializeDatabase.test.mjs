import { describe, it, expect, beforeEach, vi } from 'vitest';

import { config } from 'dotenv';
config({ path: './backend.test.env' });

const mockAuthenticate = vi.fn().mockResolvedValue();

vi.mock('sequelize', () => {
	const SequelizeMock = vi.fn().mockImplementation(() => ({
		authenticate: mockAuthenticate
	}));
	return { Sequelize: SequelizeMock };
});

vi.mock('../../dist/config/logger.mjs', () => {
	const mockLogger = {
		info: vi.fn(),
		warn: vi.fn()
	};

	return {
		default: () => mockLogger
	};
});

import { initializeDatabase } from '../../dist/config/db.mjs';
import { Sequelize } from 'sequelize';

describe('initializeDatabase', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should initialize sequelize if not already initialized', async () => {
		const sequelizeInstance = await initializeDatabase();

		expect(Sequelize).toHaveBeenCalledWith(
			process.env.DB_NAME,
			process.env.DB_USER,
			process.env.DB_PASSWORD,
			expect.objectContaining({
				host: process.env.DB_HOST,
				dialect: process.env.DB_DIALECT,
				logging: expect.any(Function)
			})
		);
		expect(sequelizeInstance.authenticate).toHaveBeenCalled();
	});

	it('should not reinitialize sequelize if already initialized', async () => {
		await initializeDatabase();

		Sequelize.mockClear();

		const sequelizeInstance = await initializeDatabase();

		expect(Sequelize).not.toHaveBeenCalled();
		expect(sequelizeInstance.authenticate).not.toHaveBeenCalled();
	});

	it('should log an error and throw if authentication fails', async () => {
		Sequelize.mockImplementationOnce(() => ({
			authenticate: vi
				.fn()
				.mockRejectedValue(new Error('Connection failed'))
		}));

		await expect(initializeDatabase()).rejects.toThrow('Connection failed');
		expect(mockLogger.error).toHaveBeenCalledWith(
			'Unable to connect to the database:',
			expect.any(Error)
		);
	});
});
