// File: backend/tests/tasks/logRotation.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { rotateLogs } from '../../../src/tasks/logRotation.js';
import fs from 'fs-extra';
import { env } from '../../../src/env/load.js';

vi.mock('fs-extra', () => ({
	ensureDirSync: vi.fn(),
	readdir: vi.fn(),
	stat: vi.fn(),
	move: vi.fn()
}));

// Mock path.join
vi.mock('path', () => ({
	join: vi.fn((...args) => args.join('/'))
}));

describe('rotateLogs', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		env.LOG_DIR = '/mock/logs';
		env.LOG_ARCHIVE_DIR = '/mock/logs/archive';
		env.LOG_RETENTION_DAYS = 30;
	});

	it('should log rotation task start message', async () => {
		const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

		await rotateLogs();

		expect(consoleSpy).toHaveBeenCalledWith('Running Log Rotation Task...');
		consoleSpy.mockRestore();
	});

	it('should move files older than the retention period to the archive', async () => {
		const files = ['log1.txt', 'log2.txt'];
		const oldTimestamp = Date.now() - 31 * 24 * 60 * 60 * 1000;

		(fs.readdir as any).mockResolvedValue(files);
		(fs.stat as any).mockResolvedValue({ mtimeMs: oldTimestamp });

		await rotateLogs();

		// Ensure move is called for both files
		expect(fs.move).toHaveBeenCalledTimes(2);
		expect(fs.move).toHaveBeenCalledWith('/mock/logs/log1.txt', '/mock/logs/archive/log1.txt');
		expect(fs.move).toHaveBeenCalledWith('/mock/logs/log2.txt', '/mock/logs/archive/log2.txt');
	});

	it('should not move files that are not older than the retention period', async () => {
		const files = ['recent-log.txt'];
		const recentTime = Date.now() - 29 * 24 * 60 * 60 * 1000;

		(fs.readdir as any).mockResolvedValue(files);
		(fs.stat as any).mockResolvedValue({ mtimeMs: recentTime });

		await rotateLogs();

		expect(fs.move).toHaveBeenCalledTimes(0); // No files should be moved
	});

	it('should log an error if an exception occurs', async () => {
		const error = new Error('Mocked error');
		(fs.readdir as any).mockRejectedValue(error);
		const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

		await rotateLogs();

		expect(consoleSpy).toHaveBeenCalledWith('Error during log rotation:', error);
		consoleSpy.mockRestore();
	});
});
