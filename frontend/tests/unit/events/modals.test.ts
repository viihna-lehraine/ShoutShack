// File: frontend/tests/unit/events/modals.test.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { addModalListeners } from '../../../src/scripts/events/modals.js';

beforeEach(() => {
	document.body.innerHTML = `
        <div id="login-modal" class="modal"></div>
        <div id="signup-modal" class="modal"></div>
        <div id="forgot-password-modal" class="modal"></div>

        <button id="open-login-modal"></button>
        <button id="open-signup-modal"></button>
        <button id="open-forgot-password-modal"></button>

        <button id="close-login-modal"></button>
        <button id="close-signup-modal"></button>
        <button id="close-forgot-password-modal"></button>
    `;

	vi.restoreAllMocks();
});

describe('addModalListeners()', () => {
	it('should add event listeners to modal buttons', async () => {
		const loginModal = document.getElementById('login-modal')!;
		const signUpModal = document.getElementById('signup-modal')!;
		const forgotPasswordModal = document.getElementById('forgot-password-modal')!;

		await addModalListeners();

		document.getElementById('open-login-modal')!.click();
		expect(loginModal.classList.contains('show')).toBe(true);

		document.getElementById('open-signup-modal')!.click();
		expect(signUpModal.classList.contains('show')).toBe(true);

		document.getElementById('open-forgot-password-modal')!.click();
		expect(loginModal.classList.contains('show')).toBe(false);
		expect(forgotPasswordModal.classList.contains('show')).toBe(true);

		document.getElementById('close-login-modal')!.click();
		expect(loginModal.classList.contains('show')).toBe(false);

		document.getElementById('close-signup-modal')!.click();
		expect(signUpModal.classList.contains('show')).toBe(false);

		document.getElementById('close-forgot-password-modal')!.click();
		expect(forgotPasswordModal.classList.contains('show')).toBe(false);
	});

	it('should close modals when clicking outside of modal content', async () => {
		await addModalListeners();

		const loginModal = document.getElementById('login-modal')!;
		loginModal.classList.add('show');

		loginModal.click();
		expect(loginModal.classList.contains('show')).toBe(false);
	});

	it('should NOT close modal when clicking inside modal content', async () => {
		await addModalListeners();

		const loginModal = document.getElementById('login-modal')!;
		loginModal.classList.add('show');

		const modalContent = document.createElement('div');
		loginModal.appendChild(modalContent);

		modalContent.click();
		expect(loginModal.classList.contains('show')).toBe(true);
	});

	it('should close modals when Escape key is pressed', async () => {
		await addModalListeners();

		const loginModal = document.getElementById('login-modal')!;
		const signUpModal = document.getElementById('signup-modal')!;
		const forgotPasswordModal = document.getElementById('forgot-password-modal')!;

		loginModal.classList.add('show');
		signUpModal.classList.add('show');
		forgotPasswordModal.classList.add('show');

		const event = new KeyboardEvent('keydown', { key: 'Escape' });
		document.dispatchEvent(event);

		expect(loginModal.classList.contains('show')).toBe(false);
		expect(signUpModal.classList.contains('show')).toBe(false);
		expect(forgotPasswordModal.classList.contains('show')).toBe(false);
	});

	it('should log an error if modal elements are missing', async () => {
		console.error = vi.fn();

		document.body.innerHTML = `
            <button id="open-login-modal"></button>
            <button id="open-signup-modal"></button>
            <button id="open-forgot-password-modal"></button>
        `;

		await addModalListeners();

		expect(console.error).toHaveBeenCalledWith('One or more modal elements not found!');
	});
});
