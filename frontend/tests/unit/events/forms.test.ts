// File: frontend/tests/unit/scripts/dom/main.test.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { addFormListeners } from '../../../src/scripts/events/forms.js';
import { validate } from '../../../src/scripts/utils/validation.ts';

vi.mock('../utils/validation.ts', () => ({
	validate: {
		username: vi.fn(input => /^[a-zA-Z0-9_]{3,16}$/.test(input)),
		email: vi.fn(input => /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(input)),
		password: vi.fn(input => input.length >= 8 && /\d/.test(input) && /[a-zA-Z]/.test(input)),
		sanitizeInput: vi.fn(input => input.trim().replace(/<[^>]*>/g, ''))
	}
}));

beforeEach(() => {
	document.body.innerHTML = `
        <form id="signup-form">
            <input id="signup-email" value="test@example.com">
            <input id="signup-password" value="Password123">
            <input id="signup-username" value="validUser">
            <button type="submit">Sign Up</button>
        </form>
        <form id="login-form">
            <input id="login-email" value="test@example.com">
            <input id="login-password" value="Password123">
            <button type="submit">Login</button>
        </form>
    `;
	vi.restoreAllMocks();
});

describe('addFormListeners()', () => {
	it('should add submit event listeners to signup and login forms', () => {
		const signupSpy = vi.spyOn(document.getElementById('signup-form')!, 'addEventListener');
		const loginSpy = vi.spyOn(document.getElementById('login-form')!, 'addEventListener');

		addFormListeners();

		expect(signupSpy).toHaveBeenCalledWith('submit', expect.any(Function));
		expect(loginSpy).toHaveBeenCalledWith('submit', expect.any(Function));
	});
});

describe('handleSignup()', () => {
	it('should validate and send sanitized signup form data', async () => {
		global.fetch = vi.fn().mockResolvedValue({
			json: vi.fn().mockResolvedValue({ message: 'Signup successful' })
		});

		addFormListeners();
		document.getElementById('signup-form')!.dispatchEvent(new Event('submit'));

		expect(validate.sanitizeInput).toHaveBeenCalledWith('test@example.com');
		expect(validate.sanitizeInput).toHaveBeenCalledWith('Password123');
		expect(validate.sanitizeInput).toHaveBeenCalledWith('validUser');

		expect(validate.username).toHaveBeenCalledWith('validUser');
		expect(validate.email).toHaveBeenCalledWith('test@example.com');
		expect(validate.password).toHaveBeenCalledWith('Password123');

		expect(global.fetch).toHaveBeenCalledWith(
			'/api/signup',
			expect.objectContaining({
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					username: 'validUser',
					email: 'test@example.com',
					password: 'Password123'
				})
			})
		);

		vi.restoreAllMocks();
	});

	it('should prevent form submission if username is invalid', () => {
		vi.spyOn(window, 'alert').mockImplementation(() => {});

		(document.getElementById('signup-username') as HTMLInputElement).value = 'x';

		addFormListeners();
		document.getElementById('signup-form')!.dispatchEvent(new Event('submit'));

		expect(validate.username).toHaveBeenCalledWith('x');
		expect(window.alert).toHaveBeenCalledWith(
			'Invalid username: Must be 3-16 characters long (letters, numbers, underscore).'
		);

		expect(global.fetch).not.toHaveBeenCalled();
	});

	it('should prevent form submission if email is invalid', () => {
		vi.spyOn(window, 'alert').mockImplementation(() => {});

		(document.getElementById('signup-email') as HTMLInputElement).value = 'invalid-email';

		addFormListeners();
		document.getElementById('signup-form')!.dispatchEvent(new Event('submit'));

		expect(validate.email).toHaveBeenCalledWith('invalid-email');
		expect(window.alert).toHaveBeenCalledWith('Invalid email format.');
		expect(global.fetch).not.toHaveBeenCalled();
	});

	it('should prevent form submission if password is invalid', () => {
		vi.spyOn(window, 'alert').mockImplementation(() => {});

		(document.getElementById('signup-password') as HTMLInputElement).value = 'short';

		addFormListeners();
		document.getElementById('signup-form')!.dispatchEvent(new Event('submit'));

		expect(validate.password).toHaveBeenCalledWith('short');
		expect(window.alert).toHaveBeenCalledWith(
			'Password must be at least 8 characters long, with letters and numbers.'
		);
		expect(global.fetch).not.toHaveBeenCalled();
	});
});

describe('handleLogin()', () => {
	it('should validate and send sanitized login form data', async () => {
		global.fetch = vi.fn().mockResolvedValue({
			json: vi.fn().mockResolvedValue({ message: 'Login successful' })
		});

		addFormListeners();
		document.getElementById('login-form')!.dispatchEvent(new Event('submit'));

		expect(validate.sanitizeInput).toHaveBeenCalledWith('test@example.com');
		expect(validate.sanitizeInput).toHaveBeenCalledWith('Password123');

		expect(validate.email).toHaveBeenCalledWith('test@example.com');
		expect(validate.password).toHaveBeenCalledWith('Password123');

		expect(global.fetch).toHaveBeenCalledWith(
			'/api/login',
			expect.objectContaining({
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					email: 'test@example.com',
					password: 'Password123'
				})
			})
		);

		vi.restoreAllMocks();
	});

	it('should prevent form submission if email is invalid', () => {
		vi.spyOn(window, 'alert').mockImplementation(() => {});

		(document.getElementById('login-email') as HTMLInputElement).value = 'invalid-email';

		addFormListeners();
		document.getElementById('login-form')!.dispatchEvent(new Event('submit'));

		expect(validate.email).toHaveBeenCalledWith('invalid-email');
		expect(window.alert).toHaveBeenCalledWith('Invalid email format.');
		expect(global.fetch).not.toHaveBeenCalled();
	});

	it('should prevent form submission if password is invalid', () => {
		vi.spyOn(window, 'alert').mockImplementation(() => {});

		(document.getElementById('login-password') as HTMLInputElement).value = 'short';

		addFormListeners();
		document.getElementById('login-form')!.dispatchEvent(new Event('submit'));

		expect(validate.password).toHaveBeenCalledWith('short');
		expect(window.alert).toHaveBeenCalledWith(
			'Password must be at least 8 characters long, with letters and numbers.'
		);
		expect(global.fetch).not.toHaveBeenCalled();
	});
});
