import {
	CsrfMiddlewareInterface,
	InitCsrfInterface
} from '../index/middlewareInterfaces';

export function initCsrf({
	csrf,
	appLogger,
	errorClasses,
	errorLogger,
	ErrorSeverity,
	expressErrorHandler
}: InitCsrfInterface) {
	const csrfProtection = new csrf();

	return function csrfMiddleware({
		req,
		res,
		next
	}: CsrfMiddlewareInterface): void {
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
			const expressMiddlewareError = new errorClasses.ExpressError(
				`Error occurred when initializing 'CSRF Middleware'\n${expressError instanceof Error ? expressError.message : String(expressError)}`,
				{
					originalError: expressError,
					statusCode: 500,
					severity: ErrorSeverity.FATAL,
					exposeToClient: false
				}
			);
			errorLogger.logError(
				expressMiddlewareError,
				{},
				appLogger,
				ErrorSeverity.FATAL
			);
			expressErrorHandler();
			next(expressError);
		}
	};
}
