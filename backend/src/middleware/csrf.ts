import csrf from 'csrf';
import { Request, Response, NextFunction } from 'express';
import {
	environmentVariables,
	FeatureFlags
} from '../config/environmentConfig';
import { Logger } from '../config/logger';
import { validateDependencies, handleGeneralError } from './errorHandler';

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
	// Validate dependencies
	validateDependencies(
		[
			{ name: 'featureFlags', instance: featureFlags },
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
					handleGeneralError(err, logger || console, req);
					next(err);
				}
			} else {
				logger.info('CSRF middleware disabled');
				next();
			}
		} catch (error) {
			handleGeneralError(error, logger || console, req);
			next(error);
		}
	};
}
