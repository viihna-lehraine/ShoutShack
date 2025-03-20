// File: backend/tests/tasks/index.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registerTasks } from '../../../src/tasks/index.js';
import { registerCronJob } from '../../../src/common/services/scheduler.js';
import { rotateLogs } from '../../../src/tasks/logRotation.js';

vi.mock('../../../src/services/scheduler.js', () => ({
	registerCronJob: vi.fn()
}));

vi.mock('../../../src/tasks/logRotation.js', () => ({
	rotateLogs: vi.fn()
}));

describe('registerTasks', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should log that tasks are registering', () => {
		const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

		registerTasks();

		expect(consoleSpy).toHaveBeenCalledWith('Registering scheduled tasks...');
		consoleSpy.mockRestore();
	});

	it('should register the log rotation cron job', () => {
		registerTasks();
		expect(registerCronJob).toHaveBeenCalledWith('0 0 * * *', rotateLogs);
	});
});
