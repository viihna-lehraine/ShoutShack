import { NextFunction, Request, Response } from 'express';
import { PassportAuthMiddlewareDependencies } from '../index/interfaces';
import { ServiceFactory } from '../index/factory';

export const initializePassportAuthMiddleware = ({
	passport,
	authenticateOptions,
	validateDependencies
}: PassportAuthMiddlewareDependencies) => {
	const logger = ServiceFactory.getLoggerService();
	const errorLogger = ServiceFactory.getErrorLoggerService();
	const errorHandler = ServiceFactory.getErrorHandlerService();

	validateDependencies(
		[
			{ name: 'passport', instance: passport },
			{ name: 'authenticateOptions', instance: authenticateOptions }
		],
		logger
	);

	return (req: Request, res: Response, next: NextFunction): void => {
		try {
			passport.authenticate(
				'jwt',
				authenticateOptions,
				(err: Error | null, user: Express.User | false) => {
					if (err) {
						logger.error(
							`Passport authentication error: ${err.message}`
						);
						res.status(500).json({
							error: 'Internal Server Error'
						});
						return;
					}
					if (!user) {
						logger.warn('Unauthorized access attempt');
						res.status(401).json({ error: 'Unauthorized' });
						return;
					}
					req.user = user;
					return next();
				}
			)(req, res, next);
		} catch (expressError) {
			const middleware: string = 'initializePassportAuthMiddleware()';
			const expressMiddlewareError =
				new errorHandler.ErrorClasses.ExpressError(
					`Fatal error: Execution of ${middleware} failed\nShutting down...\n${expressError instanceof Error ? expressError.message : 'Unknown error'} ;`,
					{
						utility: middleware,
						originalError: expressError
					}
				);
			errorLogger.logError(expressMiddlewareError.message);
			errorHandler.expressErrorHandler()(
				expressMiddlewareError,
				req,
				res,
				next
			);
			res.status(500).json({ error: 'Internal Server Error' });
			process.exit(1);
		}
	};
};
