export function initializePasswordReset(): void {
	document.addEventListener('DOMContentLoaded', function (): void {
		document
			.getElementById('password-reset-form')!
			.addEventListener('submit', async (e) => {
				e.preventDefault();
			});
	});
}
