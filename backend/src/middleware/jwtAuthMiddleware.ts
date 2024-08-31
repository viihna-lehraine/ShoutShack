import { NextFunction, Request, Response } from 'express';

interface JwtAuthMiddlewareDependencies {
	logger: ReturnType<typeof import('../config/logger').default>;
	featureFlags: ReturnType<
		typeof import('../config/featureFlags').getFeatureFlags
	>;
	verifyJwToken: (token: string) => Promise<string | object | null>;
}

export const createJwtAuthMiddleWare = ({
	logger,
	featureFlags,
	verifyJwToken
}: JwtAuthMiddlewareDependencies) => {
	const JWT_AUTH_ENABLED = featureFlags.enableJwtAuthFlag;

	return async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<void> => {
		if (JWT_AUTH_ENABLED) {
			logger.info('JWT Auth is enabled');
			const token = req.headers.authorization?.split(' ')[1];

			if (!token) {
				res.sendStatus(403);
				return;
			}

			const user = await verifyJwToken(token);

			if (!user) {
				res.sendStatus(403);
				return;
			}

			req.user = user;
			next();
		} else {
			logger.info('JWT Auth is disabled');
			next();
		}
	};
};
