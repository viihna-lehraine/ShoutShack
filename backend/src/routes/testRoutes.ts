import { Request, Response, NextFunction, Router } from 'express';
import { TestRoutesInterface } from '../index/interfaces';
import { ServiceFactory } from '../index/factory';

export function initializeTestRoutes({ app }: TestRoutesInterface): Router {
	const router = Router();
	const logger = ServiceFactory.getLoggerService();
	const errorLogger = ServiceFactory.getErrorLoggerService();
	const errorHandler = ServiceFactory.getErrorHandlerService();
	const nodeEnv = ServiceFactory.getConfigService().getEnvVariable('nodeEnv');

	try {
		if (nodeEnv === 'production') {
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
							new errorHandler.ErrorClasses.ExpressRouteError(
								`Error occurred when accessing test route: ${error instanceof Error ? error.message : String(error)}`,
								{ exposeToClient: false }
							);
						errorLogger.logError(expressRouteError.message);
						errorHandler.expressErrorHandler()(
							expressRouteError,
							req,
							res,
							next
						);
						next(new Error('Internal server error on test route'));
					}
				}
			);
		}

		router.use(
			(
				error: unknown,
				req: Request,
				res: Response,
				next: NextFunction
			) => {
				if (error instanceof Error) {
					logger.error('Unexpected error on test route');
					errorHandler.expressErrorHandler()(error, req, res, next);
				} else {
					logger.error(
						'Unexpected non-error thrown on test route',
						error
					);
					errorHandler.handleError({
						error: error as string,
						req
					});
				}
				res.status(500).json({
					error: 'Internal routing error'
				});
				errorHandler.handleError({
					error: 'Internal server error on test route',
					req
				});
			}
		);

		app.use('/test', router);
		logger.info('Test routes loaded successfully.');
		return router;
	} catch (error) {
		errorHandler.handleError({ error: error as Error });
		throw new Error(
			`Failed to initialize test routes: ${error instanceof Error ? error.message : String(error)}`
		);
	}
}
