// File: frontend/tests/unit/app.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./pages/index', () => ({
	runPageHandler: vi.fn()
}));

vi.mock('./events/registry', () => ({
	registerListeners: vi.fn(() => Promise.resolve())
}));

beforeEach(() => {
	vi.restoreAllMocks();
	document.removeEventListener('DOMContentLoaded', vi.fn());
});

describe('start()', () => {
	it('should wait for DOMContentLoaded before running handlers', async () => {
		const mockAddEventListener = vi.spyOn(document, 'addEventListener');

		await import('../../src/scripts/app.js');

		expect(mockAddEventListener).toHaveBeenCalledWith('DOMContentLoaded', expect.any(Function));
	});

	it('should import and run `runPageHandler()`', async () => {
		const { runPageHandler } = await import('../../src/scripts/pages/index');

		document.dispatchEvent(new Event('DOMContentLoaded'));

		expect(runPageHandler).toHaveBeenCalled();
	});

	it('should import and execute `registerListeners()`', async () => {
		const { registerListeners } = await import('../../src/scripts/events/registry');

		document.dispatchEvent(new Event('DOMContentLoaded'));

		expect(registerListeners).toHaveBeenCalled();
	});

	it('should log expected messages', async () => {
		console.log = vi.fn();

		await import('../../src/scripts/app.js');

		document.dispatchEvent(new Event('DOMContentLoaded'));

		expect(console.log).toHaveBeenCalledWith('DOM fully loaded.');
		expect(console.log).toHaveBeenCalledWith('Running page handler...');
		expect(console.log).toHaveBeenCalledWith('Registering event listeners...');
	});
});
