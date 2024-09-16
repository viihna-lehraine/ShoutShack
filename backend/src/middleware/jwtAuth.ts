import { NextFunction, Request, Response } from 'express';
import { FeatureFlags, getFeatureFlags } from '../environment/envVars';
import { errorClasses, ErrorSeverity } from '../errors/errorClasses';
import { expressErrorHandler } from '../errors/processError';
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

	const featureFlags: FeatureFlags = getFeatureFlags(logger);

	return async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<void> => {
		try {
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
		} catch (expressError) {
			const middleware: string = 'initializeJwtAuthMiddleware()';
			const errorRespone: string = 'Internal server error';
			const expressMiddlewareError = new errorClasses.ExpressError(
				`Error occurred when attempting to use JWT authentication via middleware ${middleware}: ${expressError instanceof Error ? expressError.message : String(expressError)}`,
				{
					severity: ErrorSeverity.FATAL,
					exposeToClient: false
				}
			);
			expressErrorHandler({
				logger,
				featureFlags
			})(expressMiddlewareError, req, res, errorRespone);
			res.sendStatus(500);
		}
	};
}
