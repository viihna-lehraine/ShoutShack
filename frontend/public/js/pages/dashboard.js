export function initializeDashboard() {
	document.addEventListener('DOMContentLoaded', function () {
		document
			.getElementById('dashboard-form')
			.addEventListener('submit', async (e) => {
				e.preventDefault();
			});
	});
}
