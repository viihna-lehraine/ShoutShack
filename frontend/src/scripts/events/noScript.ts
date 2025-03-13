// File: frontend/src/scripts/events/noScript.ts

export async function addNoScriptListener(): Promise<void> {
	try {
		document.addEventListener('DOMContentLoaded', () => {
			const warningBox = document.getElementById('no-js-warning');
			const dismissBtn = document.getElementById('dismiss-js-warning');

			if (warningBox && dismissBtn) {
				if (localStorage.getItem('js-warning-dismissed')) {
					warningBox.remove();
				} else {
					dismissBtn.addEventListener('click', () => {
						warningBox.remove();
						localStorage.setItem('js-warning-dismissed', 'true');
					});
				}
			}
		});
	} catch (error) {
		console.error('Error adding no-script event listeners:', error);
	}
}
