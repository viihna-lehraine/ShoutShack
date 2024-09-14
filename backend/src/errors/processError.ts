import { NextFunction, Request, Response } from 'express';
import { FeatureFlags } from '../config/environmentConfig'
import { validateDependencies } from '../utils/validateDependencies';
import { isLogger, Logger } from './logger';
import {
	AppError,
	errorClasses,
	ErrorSeverity,
	ErrorSeverityType
} from './errorClasses';
import { environmentVariables } from '../config/environmentConfig';

interface ExpressErrorHandlerDependencies {
	logger: Logger;
	featureFlags: FeatureFlags;
}

export function handleCriticalError(
	error: AppError | unknown,
	logger: Logger | Console,
	req?: Request,
	details: Record<string, unknown> = {}
): void {
	const effectiveLogger = isLogger(logger) ? logger : console;

	const errorMessage = error instanceof Error ? error.message : String(error);
	const errorStack = error instanceof Error ? error.stack : undefined;

	const logDetails = {
		method: req?.method ?? 'Unknown method',
		url: req?.url ?? 'Unknown URL',
		ip: req?.ip ?? 'Unknown IP',
		...details
	};

	try {
		effectiveLogger.error(`Critical error: ${errorMessage}`, {
			stack: errorStack,
			...logDetails
		});
	} catch (loggingError) {
		effectiveLogger.error('Failed to log the original error', {
			originalError: error,
			loggingError:
				loggingError instanceof Error
					? loggingError.stack
					: String(loggingError)
		});
	} finally {
		if (environmentVariables.nodeEnv === 'production') {
			process.exit(1);
		}
	}
}

export function processError(
	error: unknown,
	logger: Logger | Console,
	req?: Request,
	fallbackLogger: Console = console
): void {
	const effectiveLogger = isLogger(logger) ? logger : fallbackLogger;

	try {
		validateDependencies(
			[
				{ name: 'error', instance: error },
				{ name: 'logger', instance: logger },
				{ name: req ? 'req' : 'undefined', instance: req },
				{ name: 'fallbackLogger', instance: fallbackLogger }
			],
			effectiveLogger
		);

		// convert generic/unknown errors to AppError
		let appError: AppError;
		if (error instanceof AppError) {
			appError = error;
		} else if (error instanceof Error) {
			appError = new AppError(error.message);
		} else {
			appError = new AppError(`Unknown error: ${String(error)}`)
		}

		ErrorLogger.logErrorDetails(appError, effectiveLogger);

		if (appError.severity === ErrorSeverity.FATAL) {
			handleCriticalError(appError, effectiveLogger, req, { stack: appError.stack})
		}
	} catch (loggingError) {
		fallbackLogger.error('Failed to log the original error', {
			originalError: error,
			loggingError:
				loggingError instanceof Error
					? loggingError.stack
					: String(loggingError)
		});
	}
}

export function sendClientErrorResponse(
	error: AppError,
	res: Response,
	logger: Logger
): void {
	logger.error('Error caught in handleErrorResponse error', error);

	const statusCode = error.statusCode || 500;
	const clientResponse = {
		message: error.message,
		...(error.details?.exposeToClient ? { details: error.details } : {})
	};

	res.status(statusCode).json(clientResponse);
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
						code: err.errorCode ?? 'ERR_GENERIC',
						...(err.details && { details: err.details })
					};

					if (err.details?.retryAfter) {
						res.set('Retry-After', String(err.details.retryAfter));
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
