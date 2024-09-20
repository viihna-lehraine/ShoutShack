import { Application, Request, Response, NextFunction, Router } from 'express';
import { ConfigService } from '../config/configService';
import { errorClasses, ErrorSeverity } from '../errors/errorClasses';
import { ErrorLogger } from '../errors/errorLogger';
import { processError } from '../errors/processError';

interface TestRouteDependencies {
	app: Application;
}

export function initializeTestRoutes({ app }: TestRouteDependencies): Router {
	const router = Router();
	const configService = ConfigService.getInstance();
	const appLogger = configService.getLogger();
	const envVariables = configService.getEnvVariables();

	try {
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
						appLogger.info('Test route accessed.');
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
						ErrorLogger.logError(expressRouteError, appLogger);
						processError(expressRouteError, appLogger, req);
						next(new Error('Internal server error on test route'));
					}
				}
			);
		}

		router.use((error: unknown, req: Request, res: Response) => {
			if (error instanceof Error) {
				appLogger.error(
					`Unexpected error on test route: ${error.stack}`
				);
				processError(error, appLogger, req);
			} else {
				appLogger.error(
					'Unexpected non-error thrown on test route',
					error
				);
				processError(
					new Error('Unexpected test route error'),
					appLogger,
					req
				);
			}
			res.status(500).json({
				error: 'Internal server error on test route'
			});
			processError(
				new Error('Unexpected test route error'),
				appLogger,
				req
			);
		});

		app.use('/test', router);
		appLogger.info('Test routes loaded successfully.');
		return router;
	} catch (error) {
		processError(error as Error, appLogger);
		throw new Error(
			`Failed to initialize test routes: ${error instanceof Error ? error.message : String(error)}`
		);
	}
}
