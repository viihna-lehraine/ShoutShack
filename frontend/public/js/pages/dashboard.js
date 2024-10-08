export function initializeDashboardPage() {
	document.addEventListener('DOMContentLoaded', function () {
		const buttons = document.querySelectorAll('.dashboard-menu-button');
		const pages = document.querySelectorAll('.dashboard-content-page');
		// hide all dashboard pages
		function hideAllDashboardPages() {
			pages.forEach((page) => {
				page.style.display = 'none';
			});
		}
		// show the selected page
		function showDashboardPage(pageId) {
			const page = document.getElementById(pageId);
			if (page) {
				page.style.display = 'flex';
			}
		}
		// add event listeners to all page switch buttons
		buttons.forEach((button) => {
			button.addEventListener('click', function () {
				const targetPageId = button.getAttribute('data-target') || '';
				hideAllDashboardPages();
				showDashboardPage(targetPageId);
			});
		});
		// initially show the default page (Settings)
		hideAllDashboardPages();
		showDashboardPage(buttons[0].getAttribute('data-target') || '');
	});
}
