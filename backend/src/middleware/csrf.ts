import {
	CsrfMiddlewareInterface,
	InitCsrfInterface
} from '../index/interfaces';
import { ServiceFactory } from '../index/factory';

export function initCsrf({ csrf }: InitCsrfInterface) {
	const csrfProtection = new csrf();
	const logger = ServiceFactory.getLoggerService();
	const errorLogger = ServiceFactory.getErrorLoggerService();
	const errorHandler = ServiceFactory.getErrorHandlerService();

	return function csrfMiddleware({
		req,
		res,
		next
	}: CsrfMiddlewareInterface): void {
		try {
			logger.info('CSRF middleware enabled');

			const sessionID = req.sessionID || '';
			const csrfToken = csrfProtection.create(sessionID);
			res.locals.csrfToken = csrfToken;

			if (req.method !== 'GET') {
				const token =
					req.body.csrfToken ||
					(req.headers['x-xsrf-token'] as string);
				if (!token) {
					logger.debug('No CSRF token provided');
					res.status(403).send('No CSRF token provided');
					return;
				}
				if (!csrfProtection.verify(sessionID, token)) {
					logger.debug(
						`Invalid CSRF token for session ID: ${sessionID}`
					);
					res.status(403).send('Invalid CSRF token');
					return;
				}
				logger.debug('CSRF token validated successfully');
			}
			next();
		} catch (expressError) {
			const expressMiddlewareError =
				new errorHandler.ErrorClasses.ExpressError(
					`Error occurred when initializing 'CSRF Middleware'\n${expressError instanceof Error ? expressError.message : String(expressError)}`,
					{ originalError: expressError }
				);
			errorLogger.logError(expressMiddlewareError.message);
			errorHandler.expressErrorHandler();
			next(expressError);
		}
	};
}
