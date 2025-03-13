// File: frontend/src/scripts/utils/validation.ts

import { Validate } from '../types/index.js';

function validateUsername(username: string): boolean {
	const usernameRegex = /^[a-zA-Z0-9_]{3,16}$/;
	return usernameRegex.test(username);
}

function validateEmail(email: string): boolean {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
}

function validatePassword(password: string): boolean {
	return password.length >= 8 && /\d/.test(password) && /[a-zA-Z]/.test(password);
}

function sanitizeInput(input: string): string {
	return input.replace(/[<>'"/]/g, '');
}

function escapeHTML(str: string): string {
	return str.replace(
		/[&<>"'`=/]/g,
		match =>
			({
				'&': '&amp;',
				'<': '&lt;',
				'>': '&gt;',
				'"': '&quot;',
				"'": '&#39;',
				'`': '&#96;',
				'=': '&#61;',
				'/': '&#47;'
			})[match] || ''
	);
}

export const validate: Validate = {
	email: validateEmail,
	escapeHTML,
	password: validatePassword,
	username: validateUsername,
	sanitizeInput
} as const;
