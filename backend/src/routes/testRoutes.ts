import { Application, Request, Response, NextFunction, Router } from 'express';
import { Logger } from '../utils/logger';
import { FeatureFlags } from '../config/environmentConfig';
import { processError } from '../utils/processError';
import { validateDependencies } from '../utils/validateDependencies';

interface TestRouteDependencies {
	app: Application;
	logger: Logger;
	featureFlags: FeatureFlags;
	environmentVariables: typeof import('../config/environmentConfig').environmentVariables;
}

export function initializeTestRoutes({
	app,
	logger,
	featureFlags,
	environmentVariables
}: TestRouteDependencies): Router {
	const router = Router();

	try {
		validateDependencies(
			[
				{ name: 'app', instance: app },
				{ name: 'logger', instance: logger },
				{ name: 'featureFlags', instance: featureFlags },
				{ name: 'environmentVariables', instance: environmentVariables }
			],
			logger
		);

		if (!featureFlags.loadTestRoutesFlag) {
			logger.info('Test routes not loaded; feature flag is disabled.');
		}

		if (environmentVariables.nodeEnv === 'production') {
			router.use((_req: Request, res: Response) => {
				res.status(404).json({
					message: 'Test routes are not available in production.'
				});
			});
		} else {
			router.get(
				'/test',
				(req: Request, res: Response, next: NextFunction) => {
					try {
						logger.info('Test route accessed.');
						res.send('Test route is working!');
					} catch (error) {
						processError(error as Error, logger, req);
						next(new Error('Internal server error on test route'));
					}
				}
			);
		}

		router.use((error: unknown, req: Request, res: Response) => {
			if (error instanceof Error) {
				logger.error(`Unexpected error on test route: ${error.stack}`);
				processError(error, logger, req);
			} else {
				logger.error(
					'Unexpected non-error thrown on test route',
					error
				);
				processError(
					new Error('Unexpected test route error'),
					logger,
					req
				);
			}
			res.status(500).json({
				error: 'Internal server error on test route'
			});
			processError(new Error('Unexpected test route error'), logger, req);
		});

		app.use('/test', router);
		logger.info('Test routes loaded successfully.');
		return router;
	} catch (error) {
		processError(error as Error, logger);
		throw new Error(
			`Failed to initialize test routes: ${error instanceof Error ? error.message : String(error)}`
		);
	}
}
