// File: frontend/src/scripts/app.ts

async function start(): Promise<void> {
	document.addEventListener('DOMContentLoaded', async () => {
		console.log('DOM fully loaded.');

		const { runPageHandler } = await import('./pages/index.ts');
		console.log('Running page handler...');
		runPageHandler();

		const { registerListeners } = await import('./events/registry.js');
		console.log('Registering event listeners...');
		await registerListeners();
	});
}

start();
