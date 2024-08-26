import { describe, it, expect, vi } from 'vitest';
import { parseBoolean } from '../../dist/config/featureFlags.mjs';
import setupLogger from '../../dist/config/logger.mjs';

vi.mock('../../dist/config/logger.mjs', () => {
	const mockLogger = {
		warn: vi.fn(),
		info: vi.fn()
	};

	return {
		default: () => mockLogger
	};
});

let logger;

beforeEach(() => {
	logger = setupLogger();
	vi.clearAllMocks();
});

describe('parseBoolean', () => {
	it('should return true for valid "true" string', () => {
		const result = parseBoolean('true');
		expect(result).toBe(true);
	});

	it('should return false for valid "false" string', () => {
		const result = parseBoolean('false');
		expect(result).toBe(false);
	});

	it('should return true for boolean true', () => {
		const result = parseBoolean(true);
		expect(result).toBe(true);
	});

	it('should return false for boolean false', () => {
		const result = parseBoolean(false);
		expect(result).toBe(false);
	});

	it('should log a warning and return false for unexpected values', () => {
		const logger = setupLogger();
		const result = parseBoolean('unexpected_value');

		expect(result).toBe(false);
		expect(logger.warn).toHaveBeenCalled();
		expect(logger.warn).toHaveBeenCalledWith(
			'parseBoolean received an unexpected value: "unexpected_value". Defaulting to false.'
		);
	});

	it('should handle undefined by returning false without logging', () => {
		const logger = setupLogger();
		const result = parseBoolean(undefined);

		expect(result).toBe(false);
		expect(logger.warn).not.toHaveBeenCalled();
	});
});
