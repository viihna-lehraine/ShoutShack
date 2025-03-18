// File: backend/tests/unit/start.test.ts

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { app } from '../../src/start.js';
import * as fs from 'fs';
import { PathLike } from 'fs';
import * as path from 'path';
import { registerAuthPlugin } from '../../src/plugins/auth.js';
import { registerGlobalErrorHandler } from '../../src/services/errorHandler.js';
import { registerRoutes } from '../../src/routes/index.js';
import { registerSecurityPlugin } from '../../src/plugins/security.js';

vi.mock('fs');
vi.mock('path');
vi.mock('../../src/env/load.js');
vi.mock('../../src/plugins/auth.js', () => ({
	default: vi.fn()
}));
vi.mock('../../src/services/errorHandler.js', () => ({
	default: vi.fn()
}));
vi.mock('../../src/routes/index.js', () => ({
	default: vi.fn()
}));
vi.mock('../../src/plugins/security.js', () => ({
	default: vi.fn()
}));
vi.mock('../../src/services/scheduler.js');

const mockListen = vi.fn();
app.listen = mockListen;

describe('App Startup', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(fs.mkdirSync).mockImplementation((path: PathLike, options?: any) => undefined);
		vi.mocked(path.join).mockImplementation(() => '/mock/logs/shoutshack.log');
		vi.mock('../../src/env/load.js', () => ({
			__esModule: true,
			env: {
				LOG_DIR: '/mock/logs',
				LOG_LEVEL: 'info',
				SERVER_PORT: 3000,
				SERVER_HOST: 'localhost'
			}
		}));
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('should create the log directory if it does not exist', () => {
		require('../../src/start.ts');
		expect(fs.mkdirSync).toHaveBeenCalledWith('/mock/logs', { recursive: true });
	});

	it('should call Fastify listen method with correct parameters', async () => {
		await require('../../src/start.ts');
		expect(mockListen).toHaveBeenCalledWith({ port: 3000, host: 'localhost' });
	});

	it('should register necessary plugins', async () => {
		const registerAuthPluginSpy = vi.fn(registerAuthPlugin);
		const registerSecurityPluginSpy = vi.fn(registerSecurityPlugin);
		const registerRoutesSpy = vi.fn(registerRoutes);
		const registerGlobalErrorHandlerSpy = vi.fn(registerGlobalErrorHandler);

		await require('../../src/start.ts');

		expect(registerSecurityPluginSpy).toHaveBeenCalledWith(app);
		expect(registerAuthPluginSpy).toHaveBeenCalledWith(app);
		expect(registerRoutesSpy).toHaveBeenCalledWith(app);
		expect(registerGlobalErrorHandlerSpy).toHaveBeenCalledWith(app);
	});
});

it('should log successful startup messages', async () => {
	const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

	// simulate a successful startup
	await require('../../src/start.ts');

	expect(consoleLogSpy).toHaveBeenCalledWith('Server running at http://localhost:3000/');
	expect(consoleLogSpy).toHaveBeenCalledWith('Printing routes');
	expect(consoleLogSpy).toHaveBeenCalledWith('Importing and registering server tasks');
	expect(consoleLogSpy).toHaveBeenCalledWith('Task registration complete');

	consoleLogSpy.mockRestore();
});

it('should exit with code 1 if startup fails', async () => {
	const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
	const processExitSpy = vi
		.spyOn(process, 'exit')
		.mockImplementation((code?: string | number | null) => {
			// Check that the exit code is 1
			expect(code).toBe(1);
			// Do nothing here, matching 'never' return type
		});

	vi.mocked(registerSecurityPlugin).mockImplementation(() => {
		throw new Error('Plugin registration failed');
	});

	await require('../../src/start.ts');

	expect(consoleErrorSpy).toHaveBeenCalledWith('Server startup failed:', expect.any(Error));

	expect(processExitSpy).toHaveBeenCalledWith(1);

	consoleErrorSpy.mockRestore();
	processExitSpy.mockRestore();
});
