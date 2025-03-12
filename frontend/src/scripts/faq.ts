export function initFaqPage() {
	document.addEventListener('DOMContentLoaded', () => {
		console.log('ShoutShack is alive!');

		// FAQ Toggle Logic
		const faqItems = document.querySelectorAll('.faq-item');

		faqItems.forEach(item => {
			const question = item.querySelector('.faq-question') as HTMLElement;
			const answer = item.querySelector('.faq-answer') as HTMLElement;

			if (question && answer) {
				question.addEventListener('click', () => {
					item.classList.toggle('open');
					console.log(`Toggled FAQ: ${question.innerText}`);
				});
			}
		});
	});
}
