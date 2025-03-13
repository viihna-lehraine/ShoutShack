// File: frontend/src/scripts/pages/browse.ts

export function initBrowsePage() {
	const viewMode = document.getElementById('view-mode') as HTMLSelectElement;
	const shoutbooksContainer = document.getElementById('shoutbooks-container') as HTMLElement;

	viewMode.addEventListener('change', () => {
		if (viewMode.value === 'grid') {
			shoutbooksContainer.classList.remove('browse-list');
			shoutbooksContainer.classList.add('browse-grid');
		} else {
			shoutbooksContainer.classList.remove('browse-grid');
			shoutbooksContainer.classList.add('browse-list');
		}
	});
}
