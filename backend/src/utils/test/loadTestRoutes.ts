import express, { Application } from 'express';
import { FeatureFlags } from 'src/config/environmentConfig';
import { Logger } from '../../config/logger';
import {
	validateDependencies,
	handleGeneralError
} from '../../middleware/errorHandler';

interface LoadTestRoutesDependencies {
	app: Application;
	testRoutes: express.Router;
	logger: Logger;
	featureFlag: FeatureFlags;
}

export function loadTestRoutes({
	app,
	testRoutes,
	logger,
	featureFlag
}: LoadTestRoutesDependencies): void {
	try {
		validateDependencies(
			[
				{ name: 'app', instance: app },
				{ name: 'testRoutes', instance: testRoutes },
				{ name: 'logger', instance: logger },
				{ name: 'featureFlag', instance: featureFlag }
			],
			logger
		);

		if (featureFlag.loadTestRoutesFlag) {
			app.use('/test', testRoutes);
			logger.info('Test routes loaded successfully.');
		} else {
			logger.info(
				'Test routes not loaded; feature flag is set to FALSE.'
			);
			logger.debug(
				`Feature flag value: ${featureFlag.loadTestRoutesFlag}`
			);
		}
	} catch (error) {
		handleGeneralError(error as Error, logger);
	}
}

export default loadTestRoutes;
