// File: frontend/tests/unit/utils/validation.test.ts

import { describe, it, expect } from 'vitest';
import { validate } from '../../../src/scripts/utils/validation.js';

describe('validate.username()', () => {
	it('should return true for valid usernames', () => {
		expect(validate.username('ValidUser')).toBe(true);
		expect(validate.username('user_123')).toBe(true);
		expect(validate.username('aBc_12')).toBe(true);
	});

	it('should return false for invalid usernames', () => {
		expect(validate.username('ab')).toBe(false); // Too short
		expect(validate.username('thisisaverylongusername123')).toBe(false); // Too long
		expect(validate.username('user@name')).toBe(false); // Contains invalid characters
	});
});

describe('validate.email()', () => {
	it('should return true for valid emails', () => {
		expect(validate.email('test@example.com')).toBe(true);
		expect(validate.email('user.name@domain.co.uk')).toBe(true);
		expect(validate.email('email123@mail.io')).toBe(true);
	});

	it('should return false for invalid emails', () => {
		expect(validate.email('invalid-email')).toBe(false);
		expect(validate.email('missing@dotcom')).toBe(false);
		expect(validate.email('@missingusername.com')).toBe(false);
		expect(validate.email('user@.com')).toBe(false);
	});
});

describe('validate.password()', () => {
	it('should return true for valid passwords', () => {
		expect(validate.password('password1')).toBe(true);
		expect(validate.password('abcd1234')).toBe(true);
		expect(validate.password('1a2b3c4d')).toBe(true);
	});

	it('should return false for invalid passwords', () => {
		expect(validate.password('short1')).toBe(false);
		expect(validate.password('onlyletters')).toBe(false);
		expect(validate.password('12345678')).toBe(false);
	});
});

describe('validate.sanitizeInput()', () => {
	it('should remove potentially dangerous characters', () => {
		expect(validate.sanitizeInput('<script>alert(1)</script>')).toBe('scriptalert(1)/script');
		expect(validate.sanitizeInput('"Hello" <world>')).toBe('Hello world');
		expect(validate.sanitizeInput("O'Reilly & Associates")).toBe('OReilly & Associates');
	});
});

describe('validate.escapeHTML()', () => {
	it('should convert special characters to HTML entities', () => {
		expect(validate.escapeHTML('& < > " \' ` = /')).toBe(
			'&amp; &lt; &gt; &quot; &#39; &#96; &#61; &#47;'
		);
		expect(validate.escapeHTML('Hello <b>World</b>')).toBe('Hello &lt;b&gt;World&lt;/b&gt;');
	});
});
