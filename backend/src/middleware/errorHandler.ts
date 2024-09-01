import { Request, Response, NextFunction } from 'express';
import AppError from '../errors/AppError';

interface ErrorHandlerDependencies {
	logger: ReturnType<typeof import('../config/logger').default>;
	featureFlags: ReturnType<
		typeof import('../utils/featureFlags').getFeatureFlags
	>;
}

export function createErrorHandler({
	logger,
	featureFlags
}: ErrorHandlerDependencies) {
	const ERROR_HANDLER_ENABLED = featureFlags.enableErrorHandlerFlag;

	return function errorHandler(
		err: AppError | Error,
		req: Request,
		res: Response,
		next: NextFunction
	): void {
		if (ERROR_HANDLER_ENABLED) {
			logger.info('Error handler middleware enabled');
			if (err instanceof AppError) {
				// operational, trusted error: send message to client
				logger.error(`Operational error occurred: ${err.message}`);
				res.status(err.statusCode).json({
					status: 'error',
					message: err.message
				});
				next();
			} else {
				// programming or other unknown error: don't leak error details
				logger.error(`Unexpected error occurred: ${err.message}`);
				res.status(500).json({
					status: 'error',
					message: 'Internal server error'
				});
				next();
			}
		} else {
			logger.info('Error handler middleware disabled');
			next();
		}
	};
}

export default createErrorHandler;
