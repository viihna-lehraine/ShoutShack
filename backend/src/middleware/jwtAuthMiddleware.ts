import { NextFunction, Request, Response } from 'express';
import { Logger } from '../config/logger';
import { FeatureFlags } from '../config/environmentConfig';

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
	return async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<void> => {
		if (featureFlags.enableJwtAuthFlag) {
			logger.info('JWT Auth is enabled');
			const authHeader = req.headers.authorization;
			const token = authHeader?.split(' ')[1];

			if (!token) {
				logger.warn('No JWT token found in the authorization header');
				res.sendStatus(403); // forbidden
				return;
			}

			try {
				const user = await verifyJwToken(token);

				if (!user) {
					logger.warn('Invalid JWT token');
					res.sendStatus(403); // forbidden
					return;
				}

				req.user = user;
				next();
			} catch (err) {
				if (err instanceof Error) {
					logger.error(`Error verifying JWT token: ${err.message}`, {
						stack: err.stack
					});
				} else {
					logger.error(
						`Unknown error verifying JWT token: ${String(err)}`
					);
				}
				res.sendStatus(500); // Internal Server Error
			}
		} else {
			logger.info('JWT Auth is disabled');
			next();
		}
	};
};
