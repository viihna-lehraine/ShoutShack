import { Request, Response, NextFunction } from 'express';
import AppError from '../errors/AppError';
import { FeatureFlags } from '../config/environmentConfig';
import { Logger } from '../config/logger';

interface ErrorHandlerDependencies {
	logger: Logger;
	featureFlags: FeatureFlags;
}

interface Dependency {
	name: string;
	instance: unknown;
}

// Dependency validation function
export function validateDependencies(
	dependencies: Dependency[],
	logger: Logger | Console
): void {
	if (!dependencies || !logger) {
		(logger.error || console.error)(
			'Unable to validate dependencies as the validateDependencies function was called without the required arguments'
		);
		throw new Error(
			'Unable to validate dependencies as the validateDependencies function was called without the required arguments'
		);
	}

	try {
		const missingDependencies = dependencies.filter(
			({ instance }) => instance === undefined || instance === null
		);

		if (missingDependencies.length > 0) {
			const missingNames = missingDependencies
				.map(({ name }) => name)
				.join(', ');
			(logger.error || console.error)(
				`Missing dependencies: ${missingNames}`
			);
			throw new Error(`Missing dependencies: ${missingNames}`);
		}

		(logger.info || console.log)(
			`All dependencies are valid: ${dependencies
				.map(({ name }) => name)
				.join(', ')}`
		);
	} catch (error) {
		(logger.error || console.error)(
			'An error occurred during dependency validation',
			{
				stack: error instanceof Error ? error.stack : undefined,
				message: error instanceof Error ? error.message : String(error)
			}
		);
		throw error;
	}
}

// Core error handling function
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
			logger.error(`Error occurred: ${error.message}`, {
				stack: error.stack,
				method: req?.method,
				url: req?.url,
				ip: req?.ip
			});
		} else {
			logger.error('An unknown error occurred', {
				error: String(error),
				method: req?.method,
				url: req?.url,
				ip: req?.ip
			});
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

// Express-specific error handler middleware
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
