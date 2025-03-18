// File: frontend/tests/unit/pages/index.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runPageHandler } from '../../../src/scripts/pages/index.js';
import { initBrowsePage } from '../../../src/scripts/pages/browse';
import { initFaqPage } from '../../../src/scripts/pages/faq';

vi.mock('./browse', () => ({ initBrowsePage: vi.fn() }));
vi.mock('./faq', () => ({ initFaqPage: vi.fn() }));

beforeEach(() => {
	document.body.dataset.page = '';
	vi.restoreAllMocks();
});

describe('runPageHandler()', () => {
	it('should call initBrowsePage when data-page="browse"', () => {
		document.body.dataset.page = 'browse';

		runPageHandler();

		expect(initBrowsePage).toHaveBeenCalled();
		expect(initFaqPage).not.toHaveBeenCalled();
	});

	it('should call initFaqPage when data-page="faq"', () => {
		document.body.dataset.page = 'faq';

		runPageHandler();

		expect(initFaqPage).toHaveBeenCalled();
		expect(initBrowsePage).not.toHaveBeenCalled();
	});

	it('should log a message when no matching page handler exists', () => {
		console.log = vi.fn();

		document.body.dataset.page = 'unknown-page';

		runPageHandler();

		expect(console.log).toHaveBeenCalledWith("No init script found for page: 'unknown-page'");
	});
});
