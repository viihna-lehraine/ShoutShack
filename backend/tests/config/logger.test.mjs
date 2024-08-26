import { describe, expect, it, vi } from 'vitest';
import setupLogger from '../../dist/config/logger.mjs';
import { transports } from 'winston';

vi.stubEnv('NODE_ENV', 'development');

describe('setupLogger', () => {
	it('should return a logger instance', () => {
		const logger = setupLogger();
		expect(logger).toHaveProperty('info');
		expect(logger).toHaveProperty('error');
		expect(logger).toHaveProperty('debug');
	});

	it('should set the log level to "debug" in development mode', () => {
		vi.stubEnv('NODE_ENV', 'development');
		const logger = setupLogger();
		expect(logger.level).toBe('debug');
	});

	it('should set the log level to "info" in production mode', () => {
		vi.stubEnv('NODE_ENV', 'production');
		const logger = setupLogger();
		expect(logger.level).toBe('info');
	});

	it('should include console transport', () => {
		const logger = setupLogger();
		const consoleTransport = logger.transports.find(
			transport => transport instanceof transports.Console
		);
		expect(consoleTransport).toBeTruthy();
	});

	it('should include DailyRotateFile transport', () => {
		const logger = setupLogger();
		const fileTransport = logger.transports.find(
			transport => transport instanceof transports.DailyRotateFile
		);
		expect(fileTransport).toBeTruthy();
		expect(fileTransport.dirname).toBe('./data/logs/server/main');
		expect(fileTransport.filename).toBe('server-%DATE%.log');
	});

	it('should apply the correct log format', () => {
		const logger = setupLogger();
		const consoleTransport = logger.transports.find(
			transport => transport instanceof transports.Console
		);
		expect(consoleTransport.format).toBeDefined();
	});
});
