import csrf from 'csrf';
import { NextFunction, Request, Response } from 'express';
import { ConfigService } from '../config/configService';
import { errorClasses, ErrorSeverity } from '../errors/errorClasses';
import { ErrorLogger } from '../errors/errorLogger';
import { expressErrorHandler } from '../errors/processError';

export function initializeCsrfMiddleware() {
	const csrfProtection = new csrf();
	const configService = ConfigService.getInstance();
	const appLogger = configService.getLogger();

	return function csrfMiddleware(
		req: Request,
		res: Response,
		next: NextFunction
	): void {
		try {
			appLogger.info('CSRF middleware enabled');

			const sessionID = req.sessionID || '';
			const csrfToken = csrfProtection.create(sessionID);
			res.locals.csrfToken = csrfToken;

			if (req.method !== 'GET') {
				const token =
					req.body.csrfToken ||
					(req.headers['x-xsrf-token'] as string);
				if (!token) {
					appLogger.debug('No CSRF token provided');
					res.status(403).send('No CSRF token provided');
					return;
				}
				if (!csrfProtection.verify(sessionID, token)) {
					appLogger.debug(
						`Invalid CSRF token for session ID: ${sessionID}`
					);
					res.status(403).send('Invalid CSRF token');
					return;
				}
				appLogger.debug('CSRF token validated successfully');
			}
			next();
		} catch (expressError) {
			const middleware: string = 'CSRF Middleware';
			const expressMiddlewareError = new errorClasses.ExpressError(
				`Error occurred when initializing ${middleware}: ${expressError instanceof Error ? expressError.message : String(expressError)}`,
				{ severity: ErrorSeverity.FATAL, exposeToClient: false }
			);
			ErrorLogger.logError(expressMiddlewareError, appLogger);
			expressErrorHandler();
			next(expressError);
		}
	};
}
