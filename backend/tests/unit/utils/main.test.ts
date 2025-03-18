// File: backend/tests/unit/utils/main.test.ts

import { describe, it, expect } from 'vitest';
import { utils } from '../../../src/utils/main.js';

describe('utils', () => {
	describe('parseBoolean', () => {
		it('should parse truthy values correctly', () => {
			const truthy = ['true', '1', 'yes', 'y', 'on', 'TRUE', '  yes  ', 'T', 'On'];
			for (const val of truthy) {
				expect(utils.parseBoolean(val)).toBe(true);
			}
		});

		it('should parse falsey values correctly', () => {
			const falsey = ['false', '0', 'no', 'f', 'off', 'n', '  no  ', 'N', 'Off', 'FALSE'];
			for (const val of falsey) {
				expect(utils.parseBoolean(val)).toBe(false);
			}
		});

		it('should throw an error if boolean value is invalid', () => {
			expect(() => utils.parseBoolean('maybe')).toThrow(
				'Invalid boolean for environment variable TEST_VAR: "maybe"'
			);
		});

		it('should throw an error if boolean value is missing', () => {
			expect(() => utils.parseBoolean(undefined)).toThrow(
				'Missing required boolean environment variable: TEST_VAR'
			);
		});
	});

	describe('parseNumber', () => {
		it('should parse valid integer strings correctly', () => {
			expect(utils.parseNumber('42')).toBe(42);
			expect(utils.parseNumber('100')).toBe(100);
		});

		it('should parse floating point numbers correctly', () => {
			expect(utils.parseNumber('3.14')).toBeCloseTo(3.14);
		});

		it('should throw an error on invalid number values', () => {
			expect(() => utils.parseNumber('NaN')).toThrow(
				'Invalid number for environment variable TEST_NUM: "3.14ePie"'
			);
		});

		it('should throw an error if number value is missing', () => {
			expect(() => utils.parseNumber(undefined)).toThrow(
				'Missing required number environment variable: TEST_NUM'
			);
		});
	});

	describe('parseString', () => {
		it('should return trimmed string', () => {
			expect(utils.parseString(' test ', 'TEST_STR')).toBe('test');
		});

		it('should throw error if string value is missing', () => {
			expect(() => utils.parseString(undefined, 'TEST_STRING')).toThrow(
				'Missing required string environment variable: TEST_STRING'
			);
		});
	});
});
