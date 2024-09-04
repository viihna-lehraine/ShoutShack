import { NextFunction, Request, Response } from 'express';
import { FeatureFlags } from '../config/environmentConfig';
import { Logger } from '../config/logger';
import {
	validateDependencies,
	handleGeneralError
} from '../middleware/errorHandler';

interface JwtAuthMiddlewareDependencies {
	logger: Logger;
	featureFlags: FeatureFlags;
	verifyJwToken: (token: string) => Promise<string | object | null>;
}

export const createJwtAuthMiddleWare = ({
	logger,
	featureFlags,
	verifyJwToken
}: JwtAuthMiddlewareDependencies) => {
	validateDependencies(
		[
			{ name: 'logger', instance: logger },
			{ name: 'featureFlags', instance: featureFlags },
			{ name: 'verifyJwToken', instance: verifyJwToken }
		],
		logger || console
	);

	return async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<void> => {
		try {
			if (featureFlags.enableJwtAuthFlag) {
				logger.info('JWT Auth is enabled');
				const authHeader = req.headers.authorization;
				const token = authHeader?.split(' ')[1];

				if (!token) {
					logger.warn(
						'No JWT token found in the authorization header'
					);
					res.sendStatus(403);
					return;
				}

				try {
					const user = await verifyJwToken(token);

					if (!user) {
						logger.warn('Invalid JWT token');
						res.sendStatus(403);
						return;
					}

					req.user = user;
					next();
				} catch (err) {
					handleGeneralError(err, logger || console, req);
					res.sendStatus(500);
				}
			} else {
				logger.info('JWT Auth is disabled');
				next();
			}
		} catch (error) {
			handleGeneralError(error, logger || console, req);
			next(error);
		}
	};
};
