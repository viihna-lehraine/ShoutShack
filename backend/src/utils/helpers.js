// Loads Test Routes
export async function loadTestRoutes(app) {
	if (process.env.NODE_ENV === 'development') {
		console.log('Loading test routes...');
		const { default: testRoutes } = await import('../routes/testRoutes.js');
		app.use('/', testRoutes);
	}
}
