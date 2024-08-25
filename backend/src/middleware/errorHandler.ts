import { Request, Response, NextFunction } from 'express';
import AppError from '../errors/AppError';
import setupLogger from '../config/logger';

const logger = setupLogger();

function errorHandler(
	err: AppError | Error,
	req: Request,
	res: Response,
	next: NextFunction
): void {
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
}

export default errorHandler;
