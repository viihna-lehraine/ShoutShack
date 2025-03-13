// File: frontend/src/scripts/pages/faq.ts

export function initFaqPage() {
	document.addEventListener('DOMContentLoaded', () => {
		console.log('ShoutShack is alive!');

		addFaqListeners();
	});
}

export function addFaqListeners(): void {
	const faqItems = document.querySelectorAll('.faq-item');

	faqItems.forEach(item => {
		item.addEventListener('click', () => {
			faqItems.forEach(i => i.classList.remove('active'));

			item.classList.toggle('active');
		});
	});
}
