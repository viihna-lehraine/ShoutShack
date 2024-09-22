import { NextFunction, Request, Response } from 'express';
import { AuthenticateOptions, PassportStatic } from 'passport';
import { ConfigService } from '../services/configService';
import { errorClasses, ErrorSeverity } from '../errors/errorClasses';
import { ErrorLogger } from '../services/errorLogger';
import { expressErrorHandler } from '../errors/processError';
import { validateDependencies } from '../utils/helpers';

interface PassportAuthMiddlewareDependencies {
	passport: PassportStatic;
	authenticateOptions: AuthenticateOptions;
}

export const initializePassportAuthMiddleware = ({
	passport,
	authenticateOptions
}: PassportAuthMiddlewareDependencies) => {
	const appLogger = ConfigService.getInstance().getLogger();

	validateDependencies(
		[
			{ name: 'passport', instance: passport },
			{ name: 'authenticateOptions', instance: authenticateOptions }
		],
		appLogger || console
	);

	return (req: Request, res: Response, next: NextFunction): void => {
		try {
			passport.authenticate(
				'jwt',
				authenticateOptions,
				(err: Error | null, user: Express.User | false) => {
					if (err) {
						appLogger.error(
							`Passport authentication error: ${err.message}`
						);
						res.status(500).json({
							error: 'Internal Server Error'
						});
						return;
					}
					if (!user) {
						appLogger.warn('Unauthorized access attempt');
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
				`Fatal error: Execution of ${middleware} failed\nShutting down...\n${expressError instanceof Error ? expressError.message : 'Unknown error'} ;`,
				{
					utility: middleware,
					originalError: expressError,
					statusCode: 500,
					severity: ErrorSeverity.FATAL,
					exposeToClient: false
				}
			);
			ErrorLogger.logError(expressMiddlewareError);
			expressErrorHandler()(
				expressMiddlewareError,
				req,
				res,
				next,
				errorResponse
			);
			res.status(500).json({ error: 'Internal Server Error' });
			process.exit(1);
		}
	};
};
