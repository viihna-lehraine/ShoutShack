export function initializeDashboardPage(): void {
	document.addEventListener('DOMContentLoaded', function (): void {
		const buttons: NodeListOf<Element> = document.querySelectorAll('.dashboard-menu-button');
		const pages: NodeListOf<Element> = document.querySelectorAll('.dashboard-content-page');
		// hide all dashboard pages
		function hideAllDashboardPages(): void {
				pages.forEach((page: Element) => {
						(page as HTMLElement).style.display = 'none'; 
				});
		}
		// show the selected page
		function showDashboardPage(pageId: string): void {
				const page: Element | null = document.getElementById(pageId);
				if (page) {
					(page as HTMLElement).style.display = 'flex'; 
				}
		}
		// add event listeners to all page switch buttons
		buttons.forEach((button: Element) => {
				button.addEventListener('click', function (): void {
						const targetPageId: string = button.getAttribute('data-target') || '';
						hideAllDashboardPages();
						showDashboardPage(targetPageId);
				});
		});

		// initially show the default page (Settings)
		hideAllDashboardPages();
		showDashboardPage(buttons[0].getAttribute('data-target') || '');
	});
}