export function initializePasswordResetPage() {
	document.addEventListener('DOMContentLoaded', function () {
		document
			.getElementById('password-reset-form')
			.addEventListener('submit', async (e) => {
				e.preventDefault();
			});
	});
}
