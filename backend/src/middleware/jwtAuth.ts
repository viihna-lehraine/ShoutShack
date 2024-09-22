import { NextFunction, Request, Response } from 'express';
import { ConfigService } from 'src/config/configService';
import { errorClasses, ErrorSeverity } from '../errors/errorClasses';
import { expressErrorHandler } from '../errors/processError';
import { validateDependencies } from '../utils/helpers';

interface JwtAuthMiddlewareDependencies {
	verifyJwt: (token: string) => Promise<string | object | null>;
}

export async function initializeJwtAuthMiddleware({
	verifyJwt
}: JwtAuthMiddlewareDependencies) {
	const appLogger = ConfigService.getInstance().getLogger();

	validateDependencies(
		[{ name: 'verifyJwt', instance: verifyJwt }],
		appLogger || console
	);

	return async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<void> => {
		try {
			const authHeader = req.headers.authorization;
			const token = authHeader?.split(' ')[1];

			if (!token) {
				appLogger.warn(
					'No JWT token found in the authorization header'
				);
				res.sendStatus(403);
				return;
			}

			const user = await verifyJwt(token);
			if (!user) {
				appLogger.warn('Invalid JWT token');
				res.sendStatus(403);
				return;
			}

			req.user = user;
			next();
		} catch (expressError) {
			const middleware: string = 'initializeJwtAuthMiddleware()';
			const expressMiddlewareError = new errorClasses.ExpressError(
				`Error occurred when attempting to use JWT authentication via middleware ${middleware}: ${expressError instanceof Error ? expressError.message : String(expressError)}`,
				{
					severity: ErrorSeverity.FATAL,
					exposeToClient: false
				}
			);
			expressErrorHandler()(expressMiddlewareError, req, res, next);
			res.sendStatus(500);
		}
	};
}
