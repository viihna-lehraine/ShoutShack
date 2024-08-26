import { Request, Response, NextFunction } from 'express';
import AppError from '../errors/AppError';
import setupLogger from '../config/logger';
import { getFeatureFlags } from '../config/featureFlags';

const logger = setupLogger();
const featureFlags = getFeatureFlags();
const ERROR_HANDLER_ENABLED = featureFlags.enableErrorHandlerFlag;

function errorHandler(
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
			logger.error(`Unexpected error occured: ${err.message}`);
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
}

export default errorHandler;
