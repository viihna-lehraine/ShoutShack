import { NextFunction, Request, Response } from 'express';
import { processError } from '../errors/processError';
import { Logger } from '../utils/logger';
import { validateDependencies } from '../utils/validateDependencies';

interface JwtAuthMiddlewareDependencies {
	logger: Logger;
	verifyJwt: (token: string) => Promise<string | object | null>;
}

export async function initializeJwtAuthMiddleware({
	logger,
	verifyJwt
}: JwtAuthMiddlewareDependencies) {
	validateDependencies(
		[
			{ name: 'logger', instance: logger },
			{ name: 'verifyJwt', instance: verifyJwt }
		],
		logger || console
	);

	return async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<void> => {
		try {
			logger.info('JWT Auth is enabled');
			const authHeader = req.headers.authorization;
			const token = authHeader?.split(' ')[1];

			if (!token) {
				logger.warn('No JWT token found in the authorization header');
				res.sendStatus(403);
				return;
			}

			const user = await verifyJwt(token);
			if (!user) {
				logger.warn('Invalid JWT token');
				res.sendStatus(403);
				return;
			}

			req.user = user;
			next();
		} catch (error) {
			processError(error, logger || console, req);
			res.sendStatus(500);
		}
	};
}
