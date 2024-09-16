import { NextFunction, Request, Response } from 'express';
import { AuthenticateOptions, PassportStatic } from 'passport';
import { errorClasses, ErrorSeverity } from '../errors/errorClasses';
import { ErrorLogger } from '../errors/errorLogger';
import { expressErrorHandler } from '../errors/processError';
import { Logger } from '../utils/logger';
import { validateDependencies } from '../utils/validateDependencies';

interface PassportAuthMiddlewareDependencies {
	passport: PassportStatic;
	authenticateOptions: AuthenticateOptions;
	logger: Logger;
}

export const initializePassportAuthMiddleware = ({
	passport,
	authenticateOptions,
	logger
}: PassportAuthMiddlewareDependencies) => {
	validateDependencies(
		[
			{ name: 'passport', instance: passport },
			{ name: 'authenticateOptions', instance: authenticateOptions },
			{ name: 'logger', instance: logger }
		],
		logger || console
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
			const errorResponse: string = 'Internal Server Error';
			const expressMiddlewareError = new errorClasses.ExpressError(
				`Fatal error occured when attempting to execute ${middleware}: ${expressError instanceof Error ? expressError.message : 'Unknown error'} ; Shutting down...`,
				{
					statusCode: 500,
					severity: ErrorSeverity.FATAL,
					exposeToClient: false
				}
			);
			ErrorLogger.logError(expressMiddlewareError, logger);
			expressErrorHandler({ logger })(
				expressMiddlewareError,
				req,
				res,
				errorResponse
			);
			res.status(500).json({ error: 'Internal Server Error' });
			process.exit(1);
		}
	};
};
