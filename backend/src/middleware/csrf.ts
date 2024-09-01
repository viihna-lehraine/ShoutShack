import csrf from 'csrf';
import { Request, Response, NextFunction } from 'express';

interface CsrfDependencies {
	featureFlags: ReturnType<
		typeof import('../utils/featureFlags').getFeatureFlags
	>;
	logger: ReturnType<typeof import('../config/logger').default>;
	csrfProtection: csrf;
}

export function createCsrfMiddleware({
	featureFlags,
	logger,
	csrfProtection
}: CsrfDependencies) {
	const CSRF_ENABLED = featureFlags.enableCsrfFlag;

	return function csrfMiddleware(
		req: Request,
		res: Response,
		next: NextFunction
	): void {
		if (CSRF_ENABLED) {
			logger.info('CSRF middleware enabled');
			try {
				// generate and set a CSRF token in the response locals
				res.locals.csrfToken = csrfProtection.create(
					req.sessionID || ''
				);

				// if the request method is not GET, validate the CSRF token
				if (req.method !== 'GET') {
					const token =
						req.body.csrfToken ||
						(req.headers['x-xsrf-token'] as string);
					if (
						!token ||
						!csrfProtection.verify(req.sessionID || '', token)
					) {
						res.status(403).send('Invalid CSRF token');
						return;
					}
				}
				next(); // if validation passes, proceed to the next middleware
			} catch (err) {
				next(err); // pass any errors to the error handling middleware
			}
		} else {
			logger.info('CSRF middleware disabled');
			next(); // proceed to the next middleware
		}
	};
}
