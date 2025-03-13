// File: frontend/src/scripts/events/forms.ts

import { validate } from '../utils/validation.ts';

export function addFormListeners(): void {
	document.addEventListener('DOMContentLoaded', () => {
		const signupForm = document.getElementById('signup-form') as HTMLFormElement;
		const loginForm = document.getElementById('login-form') as HTMLFormElement;

		if (signupForm) {
			signupForm.addEventListener('submit', e => handleSignup(e, signupForm));
		}
		if (loginForm) {
			loginForm.addEventListener('submit', e => handleLogin(e, loginForm));
		}
	});
}

function handleSignup(_event: Event, form: HTMLFormElement): void {
	const email = validate.sanitizeInput(
		(form.querySelector('#signup-email') as HTMLInputElement).value
	);
	const password = validate.sanitizeInput(
		(form.querySelector('#signup-password') as HTMLInputElement).value
	);
	const username = validate.sanitizeInput(
		(form.querySelector('#signup-username') as HTMLInputElement).value
	);

	if (!validate.username(username)) {
		alert('Invalid username: Must be 3-16 characters long (letters, numbers, underscore).');
		return;
	}

	if (!validate.email(email)) {
		alert('Invalid email format.');
		return;
	}

	if (!validate.password(password)) {
		alert('Password must be at least 8 characters long, with letters and numbers.');
		return;
	}

	console.log('Form is valid. Sending sanitized data:', { username, email, password });

	fetch('/api/signup', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ username, email, password })
	})
		.then(res => res.json())
		.then(data => console.log('Server response:', data))
		.catch(error => console.error('Error:', error));
}

function handleLogin(event: Event, form: HTMLFormElement) {
	event.preventDefault();

	const email = validate.sanitizeInput(
		(form.querySelector('#login-email') as HTMLInputElement).value
	);
	const password = validate.sanitizeInput(
		(form.querySelector('#login-password') as HTMLInputElement).value
	);

	if (!validate.email(email)) {
		alert('Invalid email format.');
		return;
	}

	if (!validate.password(password)) {
		alert('Password must be at least 8 characters long, with letters and numbers.');
		return;
	}

	console.log('✅ Login form valid. Sending sanitized data:', { email, password });

	fetch('/api/login', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ email, password })
	})
		.then(res => res.json())
		.then(data => console.log('Server response:', data))
		.catch(error => console.error('Error:', error));
}
