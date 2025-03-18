// File: frontend/tests/unit/scripts/dom/main.test.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
	createModal,
	injectTemplate,
	loadComponent,
	showModal
} from '../../../src/scripts/dom/main.js';

beforeEach(() => {
	document.body.innerHTML = '';
});

const getModal = () => document.querySelector('.modal-overlay');

describe('createModal()', () => {
	it('should create and insert a modal into the DOM', () => {
		createModal();

		const modal = getModal();
		expect(modal).not.toBeNull();
		expect(modal!.classList.contains('modal-overlay')).toBe(true);
	});

	it('should remove the modal when the close button is clicked', () => {
		createModal();

		const closeButton = document.getElementById('close-modal');
		expect(closeButton).not.toBeNull();

		closeButton?.click();
		expect(getModal()).toBeNull();
	});
});

describe('injectTemplate()', () => {
	it('should inject a template modal into the DOM', () => {
		// Setup a template in the DOM
		document.body.innerHTML = `
            <template id="modal-template">
                <div class="modal-overlay">
                    <div class="modal-content">
                        <button class="modal-close-btn">Close</button>
                    </div>
                </div>
            </template>
        `;

		injectTemplate();

		const modal = getModal();
		expect(modal).not.toBeNull();
	});

	it('should log an error if the template is missing', () => {
		const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

		injectTemplate();

		expect(consoleSpy).toHaveBeenCalledWith('Template not found or invalid!');
		consoleSpy.mockRestore();
	});

	it('should remove modal when the close button is clicked', () => {
		document.body.innerHTML = `
            <template id="modal-template">
                <div class="modal-overlay">
                    <div class="modal-content">
                        <button class="modal-close-btn">Close</button>
                    </div>
                </div>
            </template>
        `;

		injectTemplate();

		const closeButton = document.querySelector('.modal-close-btn')! as HTMLButtonElement;
		expect(closeButton).not.toBeNull();

		closeButton.click();
		expect(getModal()).toBeNull();
	});
});

describe('loadComponent()', () => {
	it('should fetch and inject HTML into the target container', async () => {
		// Mock `fetch`
		global.fetch = vi.fn().mockResolvedValue({
			text: vi.fn().mockResolvedValue('<p>Loaded Component</p>')
		});

		// Add a container element
		document.body.innerHTML = `<div id="test-container"></div>`;

		await loadComponent('/fake-url', 'test-container');

		const container = document.getElementById('test-container')!;
		expect(container.innerHTML).toContain('<p>Loaded Component</p>');

		// Restore original fetch
		vi.restoreAllMocks();
	});

	it('should throw an error if the container does not exist', async () => {
		global.fetch = vi.fn().mockResolvedValue({
			text: vi.fn().mockResolvedValue('<p>Loaded Component</p>')
		});

		await expect(loadComponent('/fake-url', 'nonexistent')).rejects.toThrow();
	});
});

describe('showModal()', () => {
	it('should create and insert a modal into the DOM', () => {
		showModal();

		const modal = getModal();
		expect(modal).not.toBeNull();
		expect(modal!.classList.contains('modal-overlay')).toBe(true);
	});

	it('should remove modal when the close button is clicked', () => {
		showModal();

		const closeButton = document.getElementById('close-modal')!;
		expect(closeButton).not.toBeNull();

		closeButton.click();
		expect(getModal()).toBeNull();
	});
});
