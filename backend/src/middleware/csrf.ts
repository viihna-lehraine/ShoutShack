import csrf from 'csrf';
import { Request, Response, NextFunction } from 'express';
import { getFeatureFlags } from '../config/featureFlags';
import setupLogger from '../config/logger';

const featureFlags = getFeatureFlags();
const CSRF_ENABLED = featureFlags.enableCsrfFlag;
const logger = setupLogger();
const csrfProtection = new csrf({ secretLength: 32 });

// Middleware to add CSRF token to the response and validate incoming CSRF tokens
export function csrfMiddleware(
	req: Request,
	res: Response,
	next: NextFunction
): void {
	if (CSRF_ENABLED) {
		logger.info('CSRF middleware enabled');
		try {
			// generate and set a CSRFm token in the response locals
			res.locals.csrfToken = csrfProtection.create(req.sessionID || ''); // generate CSRF token based on session ID or some unique identifier

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

		return;
	} else {
		logger.info('CSRF middleware disabled');
		next();
	}
}
