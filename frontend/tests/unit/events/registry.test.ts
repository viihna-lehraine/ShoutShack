// File: frontend/tests/unit/events/registry.test.ts

import { describe, it, expect, vi } from 'vitest';
import { registerListeners } from '../../../src/scripts/events/registry';
import { addFormListeners } from '../../../src/scripts/events/forms';
import { addModalListeners } from '../../../src/scripts/events/modals';
import { addNoScriptListener } from '../../../src/scripts/events/noScript';

vi.mock('./forms', () => ({ addFormListeners: vi.fn() }));
vi.mock('./modals', () => ({ addModalListeners: vi.fn(() => Promise.resolve()) }));
vi.mock('./noScript', () => ({ addNoScriptListener: vi.fn(() => Promise.resolve()) }));

describe('registerListeners()', () => {
	it('should call all event listener functions', async () => {
		await registerListeners();

		expect(addFormListeners).toHaveBeenCalled();
		expect(addModalListeners).toHaveBeenCalled();
		expect(addNoScriptListener).toHaveBeenCalled();
	});

	it('should log an error if an exception occurs', async () => {
		console.error = vi.fn();

		vi.mocked(addModalListeners).mockRejectedValue(new Error('Test Error'));

		await registerListeners();

		expect(console.error).toHaveBeenCalledWith(
			'Error registering event listeners:',
			expect.any(Error)
		);
	});
});
