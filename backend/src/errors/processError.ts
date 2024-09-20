import { NextFunction, Request, Response } from 'express';
import { AppError, ClientError, ErrorSeverity } from './errorClasses';
import { ErrorLogger } from './errorLogger';
import { envVariables } from '../environment/envVars';
import { configService } from '../config/configService';
import { isAppLogger } from '../utils/appLogger';
import { validateDependencies } from '../utils/validateDependencies';

export function processCriticalError(
	error: AppError | unknown,
	req?: Request,
	details: Record<string, unknown> = {}
): void {
	const appLogger = configService.getLogger() || console;
	const effectiveLogger = isAppLogger(appLogger) ? appLogger : console;
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

export function processError(error: unknown, req?: Request): void {
	const appLogger = configService.getLogger();
	const fallbackLogger = console;
	const effectiveLogger = isAppLogger(appLogger) ? appLogger : fallbackLogger;

	try {
		validateDependencies(
			[
				{ name: 'error', instance: error },
				{ name: req ? 'req' : 'undefined', instance: req },
				{ name: 'fallbackLogger', instance: fallbackLogger }
			],
			effectiveLogger
		);

		let appError: AppError;
		if (error instanceof AppError) {
			appError = error;
		} else if (error instanceof Error) {
			appError = new AppError(error.message);
		} else {
			appError = new AppError(`Unknown error: ${String(error)}`);
		}

		ErrorLogger.logError(appError);

		if (appError.severity === ErrorSeverity.FATAL) {
			processCriticalError(error, req, { stack: appError.stack });
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
	message: string,
	statusCode: number = 400,
	res: Response
): Promise<void> {
	const clientResponse = message;

	res.status(statusCode).json(clientResponse);
}

export function expressErrorHandler() {
	return function errorHandler(
		expressError: AppError | ClientError | Error,
		req: Request,
		res: Response,
		next: NextFunction,
		errorResponse?: string
	): void {
		try {
			processError(expressError, req);

			const customResponse: string =
				errorResponse ||
				expressError.message ||
				'An unexpected error occurred';

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
					message: customResponse
				});
			}
		} catch (error) {
			processError(error, req);
			res.status(500).json({
				status: 'error',
				message: 'Internal server error: expressErrorHandler() failed'
			});
		}
	};
}
