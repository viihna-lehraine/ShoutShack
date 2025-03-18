// File: frontend/tests/unit/pages/browse.test.ts

import { describe, it, expect, beforeEach } from 'vitest';
import { initBrowsePage } from '../../../src/scripts/pages/browse.js';

beforeEach(() => {
	document.body.innerHTML = `
        <select id="view-mode">
            <option value="grid">Grid View</option>
            <option value="list">List View</option>
        </select>
        <div id="shoutbooks-container" class="browse-list"></div>
    `;

	initBrowsePage();
});

describe('initBrowsePage()', () => {
	it('should set view to grid mode when selected', () => {
		const viewMode = document.getElementById('view-mode') as HTMLSelectElement;
		const container = document.getElementById('shoutbooks-container') as HTMLElement;

		viewMode.value = 'grid';
		viewMode.dispatchEvent(new Event('change'));

		expect(container.classList.contains('browse-grid')).toBe(true);
		expect(container.classList.contains('browse-list')).toBe(false);
	});

	it('should set view to list mode when selected', () => {
		const viewMode = document.getElementById('view-mode') as HTMLSelectElement;
		const container = document.getElementById('shoutbooks-container') as HTMLElement;

		viewMode.value = 'list';
		viewMode.dispatchEvent(new Event('change'));

		expect(container.classList.contains('browse-list')).toBe(true);
		expect(container.classList.contains('browse-grid')).toBe(false);
	});
});
