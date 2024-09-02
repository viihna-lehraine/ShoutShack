import express, { Application } from 'express';
import { Logger } from '../../config/logger';

interface LoadTestRoutesDependencies {
	app: Application;
	testRoutes: express.Router;
	logger: Logger;
	featureFlag: string | undefined;
}

export function loadTestRoutes({
	app,
	testRoutes,
	logger,
	featureFlag
}: LoadTestRoutesDependencies): void {
	if (featureFlag) {
		app.use('/test', testRoutes);
		logger.info('Test routes loaded');
	} else {
		logger.info('Test routes not loaded; feature flag is set to FALSE');
	}
}

export default loadTestRoutes;
