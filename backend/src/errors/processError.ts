import { NextFunction, Request, Response } from 'express';
import { AppError, ClientError, ErrorSeverity } from './errorClasses';
import { AppLogger } from '../services/appLogger';
import { blankRequest } from '../utils/helpers';

export function processCriticalError(
	appLogger: AppLogger,
	ConfigService: typeof import('../services/configService').ConfigService,
	fallbackLogger: Console,
	isAppLogger: typeof import('../services/appLogger').isAppLogger,
	error: AppError | ClientError | Error | unknown,
	req?: Request,
	details: Record<string, unknown> = {}
): void {
	const errorMessage = error instanceof Error ? error.message : String(error);
	const errorStack = error instanceof Error ? error.stack : undefined;
	const effectiveLogger = isAppLogger(appLogger) ? appLogger : fallbackLogger;

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
		if (
			ConfigService.getInstance().getEnvVariables().nodeEnv ===
			'production'
		) {
			process.exit(1);
		}
	}
}

export function processError(
	appLogger: AppLogger,
	ConfigService: typeof import('../services/configService').ConfigService,
	errorLogger: typeof import('../services/errorLogger').errorLogger,
	errorLoggerDetails: typeof import('../utils/helpers').errorLoggerDetails,
	fallbackLogger: Console,
	isAppLogger: typeof import('../services/appLogger').isAppLogger,
	error: AppError | ClientError | Error | unknown
): void {
	try {
		let appError: AppError;
		if (error instanceof AppError) {
			appError = error;
		} else if (error instanceof Error) {
			appError = new AppError(error.message);
		} else {
			appError = new AppError(`Unknown error: ${String(error)}`);
		}

		errorLogger.logError(
			appError as AppError,
			errorLoggerDetails(
				() => 'processError',
				blankRequest,
				'PROCESS_ERROR'
			),
			appLogger,
			ErrorSeverity.FATAL
		);

		if (appError.severity === ErrorSeverity.FATAL) {
			processCriticalError(
				appLogger,
				ConfigService,
				fallbackLogger,
				isAppLogger,
				{ stack: appError.stack },
				blankRequest
			);
		}
	} catch (loggingError) {
		const effectiveLogger = isAppLogger(appLogger)
			? appLogger
			: fallbackLogger;

		effectiveLogger.error('Failed to log the original error', {
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
	res.status(statusCode).json(message);
}

export function expressErrorHandler() {
	return function errorHandler(
		expressError: AppError | ClientError | Error,
		req: Request,
		res: Response,
		next: NextFunction,
		appLogger: AppLogger,
		ConfigService: typeof import('../services/configService').ConfigService,
		errorLogger: typeof import('../services/errorLogger').errorLogger,
		errorLoggerDetails: typeof import('../utils/helpers').errorLoggerDetails,
		fallbackLogger: Console,
		isAppLogger: typeof import('../services/appLogger').isAppLogger,
		errorResponse?: string
	): void {
		try {
			processError(
				appLogger,
				ConfigService,
				errorLogger,
				errorLoggerDetails,
				fallbackLogger,
				isAppLogger,
				expressError
			);

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

			next();
		} catch (error) {
			const expressError =
				error instanceof Error ? error : new Error(String(error));
			processError(
				appLogger,
				ConfigService,
				errorLogger,
				errorLoggerDetails,
				fallbackLogger,
				isAppLogger,
				expressError
			);
			res.status(500).json({
				status: 'error',
				message: 'Internal server error: expressErrorHandler() failed'
			});
		}
	};
}
