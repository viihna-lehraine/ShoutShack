import { NextFunction, Request, Response } from 'express';
import { InitJwtAuthInterface } from '../index/interfaces';
import { HandleErrorStaticParameters } from '../index/parameters';

export async function initJwtAuth(InitJwtAuthParameters: InitJwtAuthInterface) {
	const params: InitJwtAuthInterface = InitJwtAuthParameters;

	params.validateDependencies(
		[{ name: 'verifyJwt', instance: params.verifyJwt }],
		params.logger
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
				params.logger.warn(
					'No JWT token found in the authorization header'
				);
				res.sendStatus(403);
				return;
			}

			const user = await params.verifyJwt(token);
			if (!user) {
				params.logger.warn('Invalid JWT token');
				res.sendStatus(403);
				return;
			}

			req.user = user;
			next();
		} catch (expressError) {
			const expressMiddlewareError =
				new params.errorHandler.ErrorClasses.ExpressError(
					`Error occurred when attempting to use JWT authentication via middleware 'initJwtAuth()'\n${expressError instanceof Error ? expressError.message : String(expressError)}`,
					{
						middleware: 'initJwtAuth()',
						originalError: expressError
					}
				);
			params.errorLogger.logError(expressMiddlewareError.message);

			if (expressError instanceof Error) {
				params.errorHandler.expressErrorHandler()(
					expressError,
					req,
					res,
					next
				);
			} else {
				params.errorHandler.handleError({
					...HandleErrorStaticParameters,
					error: expressMiddlewareError
				});
			}
			res.sendStatus(500);
		}
	};
}
