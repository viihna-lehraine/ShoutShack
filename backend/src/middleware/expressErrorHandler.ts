import { Request, Response, NextFunction } from 'express';
import { FeatureFlags } from '../config/environmentConfig';
import { Logger } from '../config/logger';
import { AppError } from '../config/errorClasses';
import { validateDependencies } from '../utils/validateDependencies';
import { processError } from '../utils/processError';

interface ExpressErrorHandlerDependencies {
	logger: Logger;
	featureFlags: FeatureFlags;
}

export function expressErrorHandler({
	logger,
	featureFlags
}: ExpressErrorHandlerDependencies) {
	return function errorHandler(
		err: AppError | Error,
		req: Request,
		res: Response,
		_next: NextFunction
	): void {
		try {
			validateDependencies(
				[
					{ name: 'logger', instance: logger },
					{ name: 'featureFlags', instance: featureFlags }
				],
				logger
			);

			if (featureFlags.enableErrorHandlerFlag) {
				logger.info('Error handler middleware enabled');
				processError(err, logger, req);

				if (err instanceof AppError) {
					const responsePayload: Record<string, unknown> = {
						status: 'error',
						message: err.message ?? 'An error occurred',
						code: err.errorCode ?? 'ERR_GENERIC'
					};

					if (err.details) {
						responsePayload.details = err.details;
						if (err.details.retryAfter) {
							res.set(
								'Retry-After',
								String(err.details.retryAfter)
							);
						}
					}

					res.status(err.statusCode ?? 500).json(responsePayload);
				} else {
					res.status(500).json({
						status: 'error',
						message: err.message ?? 'Internal server error'
					});
				}
			} else {
				logger.info('Error handler middleware disabled');
				_next(err);
			}
		} catch (error) {
			processError(error, logger, req);
			res.status(500).json({
				status: 'error',
				message: 'Internal server error: error handler failed'
			});
		}
	};
}
