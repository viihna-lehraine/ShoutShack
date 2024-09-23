import { AppError, ErrorSeverity } from './errorClasses';
import { blankRequest } from '../utils/helpers';
import {
	ErrorHandlerInterface,
	ExpressErrorHandlerInterface,
	ProcessCriticalErrorInterface,
	ProcessErrorInterface,
	SendClientErrorResponseInterface
} from '../index/errorInterfaces';
import {
	ExpressErrorHandlerStaticParameters,
	ProcessCriticalErrorStaticParameters,
	ProcessErrorStaticParameters
} from '../parameters/errorParameters';

export function processCriticalError(
	params: Partial<ProcessCriticalErrorInterface>
): void {
	const errorMessage =
		params.error instanceof Error
			? params.error.message
			: String(params.error);
	const errorStack =
		params.error instanceof Error ? params.error.stack : undefined;
	const effectiveLogger = params.appLogger
		? params.appLogger
		: params.fallbackLogger;

	const logDetails = {
		method: params.req?.method ?? 'Unknown method',
		url: params.req?.url ?? 'Unknown URL',
		ip: params.req?.ip ?? 'Unknown IP',
		...params.details
	};

	try {
		effectiveLogger!.error(`Critical error: ${errorMessage}`, {
			stack: errorStack,
			...logDetails
		});
	} catch (loggingError) {
		effectiveLogger!.error('Failed to log the original error', {
			originalError: params.error,
			loggingError:
				loggingError instanceof Error
					? loggingError.stack
					: String(loggingError)
		});
	} finally {
		if (params.configService!.getEnvVariables().nodeEnv === 'production') {
			process.exit(1);
		}
	}
}

export function processError(params: Partial<ProcessErrorInterface>): void {
	try {
		let appError: AppError;

		if (params.error instanceof AppError) {
			appError = params.error;
		} else if (params.error instanceof Error) {
			appError = new AppError(params.error.message);
		} else {
			appError = new AppError(`Unknown error: ${String(params.error)}`);
		}

		params.errorLogger!.logError(
			appError as AppError,
			params.errorLoggerDetails!(
				() => 'processError',
				'PROCESS_ERROR',
				blankRequest
			),
			params.appLogger!,
			ErrorSeverity.FATAL
		);

		const dynamicParams = {
			req: blankRequest,
			details: { stack: appError.stack }
		};
		const criticalParams: ProcessCriticalErrorInterface = {
			...ProcessCriticalErrorStaticParameters,
			...dynamicParams
		};

		if (appError.severity === ErrorSeverity.FATAL) {
			processCriticalError(criticalParams);
		}
	} catch (loggingError) {
		const effectiveLogger = params.isAppLogger!(params.appLogger)
			? params.appLogger
			: params.fallbackLogger;

		effectiveLogger!.error('Failed to log the original error', {
			originalError: params.error,
			loggingError:
				loggingError instanceof Error
					? loggingError.stack
					: String(loggingError)
		});
	}
}

export async function sendClientErrorResponse({
	message,
	statusCode = 400,
	res
}: SendClientErrorResponseInterface): Promise<void> {
	res.status(statusCode).json(message);
}

export function expressErrorHandler() {
	return function errorHandler({
		expressError,
		req,
		res,
		next
	}: ErrorHandlerInterface): void {
		const expressErrorHandlerParams: Partial<ExpressErrorHandlerInterface> =
			{
				...ExpressErrorHandlerStaticParameters,
				expressError,
				req,
				res,
				next
			};
		try {
			const processErrorParams: ProcessErrorInterface = {
				...ProcessErrorStaticParameters,
				error: expressErrorHandlerParams.expressError
			};

			processError(processErrorParams);

			const customResponse: string =
				expressErrorHandlerParams.errorResponse ||
				expressErrorHandlerParams.expressError!.message ||
				'An unexpected error occurred';

			if (expressErrorHandlerParams.expressError instanceof AppError) {
				const responsePayload: Record<string, unknown> = {
					status: 'error',
					message:
						expressErrorHandlerParams.expressError.message ??
						'An error occurred',
					code:
						expressErrorHandlerParams.expressError.errorCode ??
						'ERR_GENERIC',
					...(expressErrorHandlerParams.expressError.details && {
						details: expressErrorHandlerParams.expressError.details
					})
				};

				if (
					expressErrorHandlerParams.expressError.details?.retryAfter
				) {
					res.set(
						'Retry-After',
						String(
							expressErrorHandlerParams.expressError.details
								.retryAfter
						)
					);
				}

				res.status(
					expressErrorHandlerParams.expressError.statusCode ?? 500
				).json(responsePayload);
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
			const processErrorCatchParams: ProcessErrorInterface = {
				...ProcessErrorStaticParameters,
				error: expressError
			};
			processError(processErrorCatchParams);
			res.status(500).json({
				status: 'error',
				message: 'Internal server error: expressErrorHandler() failed'
			});
		}
	};
}
