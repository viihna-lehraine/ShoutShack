import { NextFunction, Request, Response } from 'express';
import { verifyJwToken } from '../utils/auth/jwtUtil';
import { getFeatureFlags } from 'src/config/featureFlags';
import setupLogger from 'src/config/logger';

const featureFlags = getFeatureFlags();
const logger = setupLogger();
const JWT_AUTH_ENABLED = featureFlags.enableJwtAuthFlag;

export const authenticateJwT = async (
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
