import express from 'express';
import testRoutes from '../../routes/testRoutes.js';
import setupLogger from '../../config/logger.js';

const logger = setupLogger();

export function loadTestRoutes(app: express.Application): void {
	if (process.env.FEATURE_LOAD_TEST_ROUTES) {
		app.use('/test', testRoutes);
		logger.info('Test routes loaded');
	} else {
		logger.info('Test routes not loaded; feature flag is set to FALSE');
	}
}

export default loadTestRoutes;
