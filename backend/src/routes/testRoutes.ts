import { Application, Request, Response, NextFunction, Router } from 'express';
import { FeatureFlagTypes } from '../environment/envVars';
import { errorClasses, ErrorSeverity } from '../errors/errorClasses';
import { ErrorLogger } from '../errors/errorLogger';
import { expressErrorHandler, processError } from '../errors/processError';
import { Logger } from '../utils/logger';
import { validateDependencies } from '../utils/validateDependencies';

interface TestRouteDependencies {
	app: Application;
	logger: Logger;
	featureFlags: FeatureFlagTypes;
	envVariables: typeof import('../environment/envVars').envVariables;
}

export function initializeTestRoutes({
	app,
	logger,
	featureFlags,
	envVariables
}: TestRouteDependencies): Router {
	const router = Router();

	try {
		validateDependencies(
			[
				{ name: 'app', instance: app },
				{ name: 'logger', instance: logger },
				{ name: 'featureFlags', instance: featureFlags },
				{ name: 'envVariables', instance: envVariables }
			],
			logger
		);

		if (envVariables.nodeEnv === 'production') {
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
						const expressRouteError =
							new errorClasses.ExpressRouteError(
								`Error occurred when accessing test route: ${error instanceof Error ? error.message : String(error)}`,
								{
									statusCode: 500,
									exposeToClient: false,
									severity: ErrorSeverity.WARNING
								}
							);
						ErrorLogger.logError(expressRouteError, logger);
						processError(expressRouteError, logger, req);
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
