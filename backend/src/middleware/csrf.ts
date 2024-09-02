import csrf from 'csrf';
import { Request, Response, NextFunction } from 'express';
import {
	environmentVariables,
	FeatureFlags
} from '../config/environmentConfig';
import { Logger } from '../config/logger';

interface CsrfDependencies {
	featureFlags: FeatureFlags;
	logger: Logger;
	csrfProtection: csrf;
}

export function createCsrfMiddleware({
	featureFlags,
	logger,
	csrfProtection
}: CsrfDependencies) {
	return function csrfMiddleware(
		req: Request,
		res: Response,
		next: NextFunction
	): void {
		if (
			environmentVariables.featureEnableCsrf &&
			featureFlags.enableCsrfFlag
		) {
			logger.info('CSRF middleware enabled');
			try {
				// generate and set a CSRF token in the response locals
				const sessionID = req.sessionID || '';
				const csrfToken = csrfProtection.create(sessionID);
				res.locals.csrfToken = csrfToken;

				// if the request method is not GET, validate the CSRF token
				if (req.method !== 'GET') {
					const token =
						req.body.csrfToken ||
						(req.headers['x-xsrf-token'] as string);
					if (!token) {
						logger.warn('No CSRF token provided');
						res.status(403).send('No CSRF token provided');
						return;
					}
					if (!csrfProtection.verify(sessionID, token)) {
						logger.warn(
							`Invalid CSRF token for session ID: ${sessionID}`
						);
						res.status(403).send('Invalid CSRF token');
						return;
					}
					logger.info('CSRF token validated successfully');
				}
				next(); // If validation passes, proceed to the next middleware
			} catch (err) {
				if (err instanceof Error) {
					logger.error(`CSRF validation error: ${err.message}`, {
						stack: err.stack
					});
				} else {
					logger.error(`CSRF validation error: ${String(err)}`);
				}
				next(err); // pass any errors to the error handling middleware
			}
		} else {
			logger.info('CSRF middleware disabled');
			next(); // proceed to the next middleware
		}
	};
}
