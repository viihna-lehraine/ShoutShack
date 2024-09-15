import csrf from 'csrf';
import { NextFunction, Request, Response } from 'express';
import { FeatureFlags, getFeatureFlags } from '../config/envConfig';
import { errorClasses, ErrorSeverity } from '../errors/errorClasses';
import { ErrorLogger } from '../errors/errorLogger';
import { expressErrorHandler } from '../errors/processError';
import { Logger } from '../utils/logger';
import { validateDependencies } from '../utils/validateDependencies';

interface CsrfDependencies {
	logger: Logger;
	csrfProtection: csrf;
}

export function initializeCsrfMiddleware({
	logger,
	csrfProtection
}: CsrfDependencies) {
	validateDependencies(
		[
			{ name: 'logger', instance: logger },
			{ name: 'csrfProtection', instance: csrfProtection }
		],
		logger || console
	);

	const featureFlags: FeatureFlags = getFeatureFlags(logger);

	return function csrfMiddleware(
		req: Request,
		res: Response,
		next: NextFunction
	): void {
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
			const middleware: string = 'CSRF Middleware';
			const expressMiddlewareError = new errorClasses.ExpressError(
				`Error occurred when initializing ${middleware}: ${expressError instanceof Error ? expressError.message : String(expressError)}`,
				{ exposeToClient: false, ErrorSeverity.FATAL }
			);
			ErrorLogger.logError(expressMiddlewareError, logger);
			expressErrorHandler({ logger, featureFlags });
			next(expressError);
		}
	};
}
