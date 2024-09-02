import { Request, Response, NextFunction } from 'express';
import AppError from '../errors/AppError';
import { FeatureFlags } from '../config/environmentConfig';
import { Logger } from '../config/logger';

interface ErrorHandlerDependencies {
	logger: Logger;
	featureFlags: FeatureFlags;
}

export function createErrorHandler({
	logger,
	featureFlags
}: ErrorHandlerDependencies) {
	return function errorHandler(
		err: AppError | Error,
		req: Request,
		res: Response,
		_next: NextFunction
	): void {
		if (featureFlags.enableErrorHandlerFlag) {
			logger.info('Error handler middleware enabled');

			const logError = (error: Error): void => {
				logger.error(`Error occurred: ${error.message}`, {
					stack: error.stack,
					method: req.method,
					url: req.url,
					ip: req.ip
				});
			};

			if (err instanceof AppError) {
				// operational, trusted error: send a detailed message to the client
				logError(err);
				const responsePayload: Record<string, unknown> = {
					status: 'error',
					message: err.message,
					code: err.errorCode || 'ERR_GENERIC' // include error code if available
				};

				if (err.details) {
					responsePayload.details = err.details; // optionally include error details
					if (err.details.retryAfter) {
						res.set('Retry-After', String(err.details.retryAfter)); // set Retry-After header if available
					}
				}

				res.status(err.statusCode).json(responsePayload);
			} else {
				// programming or other unknown error: don't leak error details
				logError(err);
				res.status(500).json({
					status: 'error',
					message: 'Internal server error'
				});
			}
		} else {
			logger.info('Error handler middleware disabled');
			_next(err);
		}
	};
}

export default createErrorHandler;
