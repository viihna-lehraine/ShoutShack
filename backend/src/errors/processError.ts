import { NextFunction, Request, Response } from 'express';
import { AppError, ClientError, ErrorSeverity } from './errorClasses';
import { ErrorLogger } from './errorLogger';
import { envVariables, FeatureFlags } from '../config/envConfig';
import { isLogger, Logger } from '../utils/logger';
import { validateDependencies } from '../utils/validateDependencies';

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
		if (envVariables.nodeEnv === 'production') {
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
			appError = new AppError(`Unknown error: ${String(error)}`);
		}

		ErrorLogger.logError(appError, effectiveLogger);

		if (appError.severity === ErrorSeverity.FATAL) {
			handleCriticalError(appError, effectiveLogger, req, {
				stack: appError.stack
			});
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

export async function sendClientErrorResponse(
	error: ClientError,
	res: Response
): Promise<void> {
	const statusCode = error.statusCode || 400;
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
		expressError: AppError | ClientError | Error,
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
				processError(expressError, logger, req);

				if (expressError instanceof AppError) {
					const responsePayload: Record<string, unknown> = {
						status: 'error',
						message: expressError.message ?? 'An error occurred',
						code: expressError.errorCode ?? 'ERR_GENERIC',
						...(expressError.details && {
							details: expressError.details
						})
					};

					if (expressError.details?.retryAfter) {
						res.set(
							'Retry-After',
							String(expressError.details.retryAfter)
						);
					}

					res.status(expressError.statusCode ?? 500).json(
						responsePayload
					);
				} else {
					res.status(500).json({
						status: 'error',
						message: expressError.message ?? 'Internal server error'
					});
				}
			} else {
				logger.info('Error handler middleware disabled');
				_next(expressError);
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
