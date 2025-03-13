// File: frontend/src/scripts/pages/index.ts

import { initBrowsePage } from './browse.ts';
import { initFaqPage } from './faq.ts';

const pageHandlers: Record<string, () => void> = {
	browse: initBrowsePage,
	faq: initFaqPage
};

export function runPageHandler() {
	const page = document.body.dataset.page ?? '';

	if (page && page in pageHandlers) {
		console.log(`Running init script for '${page}' page...`);
		pageHandlers[page]();
	} else {
		console.log(`No init script found for page: '${page}'`);
	}
}
