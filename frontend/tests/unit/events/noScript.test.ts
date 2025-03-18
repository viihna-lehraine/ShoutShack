// File: frontend/tests/unit/events/noScript.test.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { addNoScriptListener } from '../../../src/scripts/events/noScript.js';

beforeEach(() => {
	document.body.innerHTML = `
        <div id="no-js-warning">JavaScript is required!</div>
        <button id="dismiss-js-warning">Dismiss</button>
    `;
	localStorage.clear();
	vi.restoreAllMocks();
});

describe('addNoScriptListener()', () => {
	it('should remove the warning box if previously dismissed', async () => {
		localStorage.setItem('js-warning-dismissed', 'true');

		await addNoScriptListener();

		expect(document.getElementById('no-js-warning')).toBeNull();
	});

	it('should NOT remove the warning box if not previously dismissed', async () => {
		await addNoScriptListener();

		expect(document.getElementById('no-js-warning')).not.toBeNull();
	});

	it('should remove the warning box and set localStorage when dismissed', async () => {
		await addNoScriptListener();

		const warningBox = document.getElementById('no-js-warning')!;
		const dismissBtn = document.getElementById('dismiss-js-warning')!;

		expect(warningBox).not.toBeNull();
		expect(localStorage.getItem('js-warning-dismissed')).toBeNull();

		dismissBtn.click();

		expect(document.getElementById('no-js-warning')).toBeNull();
		expect(localStorage.getItem('js-warning-dismissed')).toBe('true');
	});

	it('should log an error if something goes wrong', async () => {
		console.error = vi.fn();

		document.body.innerHTML = '';

		await addNoScriptListener();

		expect(console.error).toHaveBeenCalledWith(
			expect.stringMatching(/Error adding no-script event listeners:/),
			expect.any(Error)
		);
	});
});
