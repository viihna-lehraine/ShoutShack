import { NextFunction, Request, Response } from 'express';
import { InitJwtAuthInterface } from '../index/interfaces';
import { HandleErrorStaticParameters } from '../index/parameters';
import { ServiceFactory } from '../index/factory';

export async function initJwtAuth(InitJwtAuthParameters: InitJwtAuthInterface) {
	const params: InitJwtAuthInterface = InitJwtAuthParameters;
	const logger = ServiceFactory.getLoggerService();
	const errorLogger = ServiceFactory.getErrorLoggerService();
	const errorHandler = ServiceFactory.getErrorHandlerService();

	params.validateDependencies(
		[{ name: 'verifyJwt', instance: params.verifyJwt }],
		logger
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
				errorLogger.logWarn(
					'No JWT token found in the authorization header'
				);
				res.sendStatus(403);
				return;
			}

			const user = await params.verifyJwt(token);
			if (!user) {
				logger.warn('Invalid JWT token');
				res.sendStatus(403);
				return;
			}

			req.user = user;
			next();
		} catch (expressError) {
			const expressMiddlewareError =
				new errorHandler.ErrorClasses.ExpressError(
					`Error occurred when attempting to use JWT authentication via middleware 'initJwtAuth()'\n${expressError instanceof Error ? expressError.message : String(expressError)}`,
					{
						middleware: 'initJwtAuth()',
						originalError: expressError
					}
				);
			errorLogger.logError(expressMiddlewareError.message);

			if (expressError instanceof Error) {
				errorHandler.expressErrorHandler()(
					expressError,
					req,
					res,
					next
				);
			} else {
				errorHandler.handleError({
					...HandleErrorStaticParameters,
					error: expressMiddlewareError
				});
			}
			res.sendStatus(500);
		}
	};
}
