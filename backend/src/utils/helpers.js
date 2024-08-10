import { featureFlags } from '../index.js';

// Loads Test Routes
export async function loadTestRoutes(app) {
	if (featureFlags.loadTestRoutesFlag) {
		console.log('Loading test routes...');
		const { default: testRoutes } = await import('../routes/testRoutes.js');
		app.use('/', testRoutes);
	}
}
