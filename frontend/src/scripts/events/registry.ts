// File: frontend/src/scripts/events/registry.ts

import { addFormListeners } from './forms.js';
import { addModalListeners } from './modals.js';
import { addNoScriptListener } from './noScript.js';

export async function registerListeners(): Promise<void> {
	try {
		addFormListeners();
		await addModalListeners();
		await addNoScriptListener();
	} catch (error) {
		console.error('Error registering event listeners:', error);
	}
}
