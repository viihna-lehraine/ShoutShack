import { NextFunction, Request, Response } from 'express';
import { InitJwtAuthInterface } from '../index/middlewareInterfaces';
import { ProcessErrorStaticParameters } from '../parameters/errorParameters';

export async function initJwtAuth(InitJwtAuthParameters: InitJwtAuthInterface) {
	const params: InitJwtAuthInterface = InitJwtAuthParameters;

	params.validateDependencies(
		[{ name: 'verifyJwt', instance: params.verifyJwt }],
		params.appLogger
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
				params.appLogger.warn(
					'No JWT token found in the authorization header'
				);
				res.sendStatus(403);
				return;
			}

			const user = await params.verifyJwt(token);
			if (!user) {
				params.appLogger.warn('Invalid JWT token');
				res.sendStatus(403);
				return;
			}

			req.user = user;
			next();
		} catch (expressError) {
			const expressMiddlewareError = new params.errorClasses.ExpressError(
				`Error occurred when attempting to use JWT authentication via middleware 'initJwtAuth()'\n${expressError instanceof Error ? expressError.message : String(expressError)}`,
				{
					middleware: 'initJwtAuth()',
					originalError: expressError,
					statusCode: 500,
					severity: params.ErrorSeverity.FATAL,
					exposeToClient: false
				}
			);
			params.errorLogger.logError(
				expressMiddlewareError,
				params.errorLoggerDetails(
					params.getCallerInfo,
					'INIT_JWT_AUTH_MIDDLEWEARE'
				),
				params.appLogger,
				params.ErrorSeverity.FATAL
			);

			if (expressError instanceof Error) {
				params.expressErrorHandler()({ expressError, req, res, next });
			} else {
				params.processError({
					...ProcessErrorStaticParameters,
					error: expressMiddlewareError
				});
			}
			res.sendStatus(500);
		}
	};
}
