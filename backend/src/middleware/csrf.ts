import csrf from 'csrf';
import { Request, Response, NextFunction } from 'express';
import { Logger } from '../config/logger';
import { validateDependencies } from '../utils/validateDependencies';
import { processError } from '../utils/processError';

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

	return function csrfMiddleware(
		req: Request,
		res: Response,
		next: NextFunction
	): void {
		try {
			logger.info('CSRF middleware enabled');
			try {
				// generate and set a CSRF token in the response locals
				const sessionID = req.sessionID || '';
				const csrfToken = csrfProtection.create(sessionID);
				res.locals.csrfToken = csrfToken;

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
				next();
			} catch (err) {
				processError(err, logger || console, req);
				next(err);
			}
		} catch (error) {
			processError(error, logger || console, req);
			next(error);
		}
	};
}
