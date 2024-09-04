import { Request, Response, NextFunction } from 'express';
import { FeatureFlags } from '../config/environmentConfig';
import { Logger } from '../config/logger';
import { AppError } from '../config/errorClasses';

interface ErrorHandlerDependencies {
	logger: Logger;
	featureFlags: FeatureFlags;
}

interface Dependency {
	name: string;
	instance: unknown;
}

function isLogger(logger: Logger | Console | undefined): logger is Logger {
	return (
		logger !== undefined &&
		logger !== null &&
		typeof logger.error === 'function' &&
		typeof logger.warn === 'function' &&
		typeof logger.debug === 'function' &&
		typeof logger.info === 'function'
	);
}

export function validateDependencies(
	dependencies: Dependency[],
	logger: Logger | Console = console
): void {
	const logInfo = isLogger(logger) ? logger.info : console.info;
	const logWarn = isLogger(logger) ? logger.warn : console.warn;
	const logError = isLogger(logger) ? logger.error : console.error;

	if (!dependencies || dependencies.length === 0) {
		logWarn('No dependencies provided for validation');
		throw new Error('No dependencies provided for validation');
	}

	try {
		const missingDependencies = dependencies.filter(
			({ instance }) => instance === undefined || instance === null
		);

		if (missingDependencies.length > 0) {
			const missingNames = missingDependencies
				.map(({ name }) => name)
				.join(', ');
			logError(`Missing dependencies: ${missingNames}`);
			throw new Error(`Missing dependencies: ${missingNames}`);
		}

		logInfo(
			`All dependencies are valid: ${dependencies
				.map(({ name }) => name)
				.join(', ')}`
		);
	} catch (error) {
		if (isLogger(logger)) {
			logger.error('An error occurred during dependency validation', {
				stack: error instanceof Error ? error.stack : undefined,
				message: error instanceof Error ? error.message : String(error)
			});
		} else {
			console.error('An error occurred during dependency validation', {
				stack: error instanceof Error ? error.stack : undefined,
				message: error instanceof Error ? error.message : String
			});
		}
		throw error;
	}
}

export function handleGeneralError(
	error: unknown,
	logger: Logger | Console,
	req?: Request,
	fallbackLogger: Console = console
): void {
	try {
		validateDependencies(
			[
				{ name: 'error', instance: error },
				{ name: 'logger', instance: logger },
				{ name: req ? 'req' : 'undefined', instance: req },
				{ name: 'fallbackLogger', instance: fallbackLogger }
			],
			logger
		);

		if (error instanceof Error || error instanceof AppError) {
			if (isLogger(logger)) {
				logger.error(`Error occurred: ${error.message}`, {
					stack: error.stack,
					method: req?.method,
					url: req?.url,
					ip: req?.ip
				});
			} else {
				fallbackLogger.error('Error occurred:', error);
			}
		} else {
			if (isLogger(logger)) {
				logger.error('An unknown error occurred', {
					error: String(error),
					method: req?.method,
					url: req?.url,
					ip: req?.ip
				});
			} else {
				fallbackLogger.error('An unknown error occurred:', error);
			}
		}
	} catch (loggingError) {
		fallbackLogger.error('Failed to log the original error', {
			originalError: error,
			loggingError:
				loggingError instanceof Error
					? loggingError.stack
					: loggingError
		});
	}
}

export function expressErrorHandler({
	logger,
	featureFlags
}: ErrorHandlerDependencies) {
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
				handleGeneralError(err, logger, req);

				if (err instanceof AppError) {
					const responsePayload: Record<string, unknown> = {
						status: 'error',
						message: err.message,
						code: err.errorCode || 'ERR_GENERIC'
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

					res.status(err.statusCode).json(responsePayload);
				} else {
					res.status(500).json({
						status: 'error',
						message: 'Internal server error'
					});
				}
			} else {
				logger.info('Error handler middleware disabled');
				_next(err);
			}
		} catch (error) {
			handleGeneralError(error, logger, req);
			res.status(500).json({
				status: 'error',
				message: 'Internal server error: error handler failed'
			});
		}
	};
}
