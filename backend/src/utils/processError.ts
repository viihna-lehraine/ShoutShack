import { validateDependencies } from './validateDependencies';
import { isLogger, Logger } from '../config/logger';
import { Request } from 'express';
import {
	AppError,
	errorClasses,
	ErrorSeverity,
	ErrorSeverityType
} from '../config/errorClasses';

const {
	AuthenticationError,
	AutoCorrectedInputWarning,
	ConfigurationError,
	ConcurrencyError,
	ConflictError,
	CriticalServiceUnavailableError,
	DatabaseError,
	DataIntegrityError,
	DependencyError,
	DeprecatedApiWarning,
	ExternalServiceError,
	FallbackSuccessInfo,
	FileProcessingError,
	ForbiddenError,
	InsufficientStorageError,
	InvalidCredentialsError,
	InvalidInputError,
	InvalidConfigurationError,
	InvalidTokenError,
	MissingResourceError,
	PartialServiceFailureWarning,
	PasswordValidationError,
	PermissionDeniedError,
	QuotaExceededError,
	RateLimitError,
	ServiceDegradedError,
	SessionExpiredError,
	SlowApiWarning,
	TimeoutError,
	UserActionInfo,
	ValidationError
} = errorClasses;

export function processError(
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
			logger || console
		);

		let message: string;
		let stack: string | undefined;
		let severity: ErrorSeverityType = ErrorSeverity.RECOVERABLE;

		const isErrorInstance = error instanceof AppError;

		if (isErrorInstance) {
			const appError = error as AppError;
			message = appError.message;
			stack = appError.stack;
			severity = appError.severity;
		} else if (error instanceof Error) {
			message = error.message;
			stack = error.stack;
		} else {
			message = `An unknown error occurred: ${String(error) ?? 'Unknown error'}`;
			stack = 'No stack trace available';
		}

		const method = req?.method ?? 'Unknown method';
		const url = req?.url ?? 'Unknown URL';
		const ip = req?.ip ?? 'Unknown IP';

		// handle specific error types
		if (isErrorInstance) {
			switch (error.constructor) {
				case AuthenticationError:
					logger.warn(`Authentication error: ${message}`, {
						method,
						url,
						ip
					});
					break;
				case AutoCorrectedInputWarning:
					logger.warn(`Auto-corrected input warning: ${message}`, {
						method,
						url,
						ip
					});
					break;
				case ConfigurationError:
					logger.warn(`Configuration error: ${message}`, {
						method,
						url,
						ip
					});
					break;
				case ConcurrencyError:
					logger.warn(`Concurrency error: ${message}`, {
						method,
						url,
						ip
					});
					break;
				case ConflictError:
					logger.warn(`Conflict error: ${message}`, {
						method,
						url,
						ip
					});
					break;
				case CriticalServiceUnavailableError:
					logger.error(`Critical service unavailable: ${message}`, {
						method,
						url,
						ip
					});
					break;
				case DatabaseError:
					logger.error(`Database error: ${message}`, {
						method,
						url,
						ip
					});
					break;
				case DataIntegrityError:
					logger.error(`Data integrity error: ${message}`, {
						method,
						url,
						ip
					});
					break;
				case DependencyError:
					logger.error(`Dependency error: ${message}`, {
						method,
						url,
						ip
					});
					break;
				case DeprecatedApiWarning:
					logger.info(`Deprecated API warning: ${message}`, {
						method,
						url,
						ip
					});
					break;
				case ExternalServiceError:
					logger.warn(`External service error: ${message}`, {
						method,
						url,
						ip
					});
					break;
				case FallbackSuccessInfo:
					logger.info(`Fallback success: ${message}`, {
						method,
						url,
						ip
					});
					break;
				case FileProcessingError:
					logger.warn(`File processing error: ${message}`, {
						method,
						url,
						ip
					});
					break;
				case ForbiddenError:
					logger.warn(`Forbidden error: ${message}`, {
						method,
						url,
						ip
					});
					break;
				case InsufficientStorageError:
					logger.error(`Insufficient storage error: ${message}`, {
						method,
						url,
						ip
					});
					break;
				case InvalidCredentialsError:
					logger.info(`Invalid credentials error: ${message}`, {
						method,
						url,
						ip
					});
					break;
				case InvalidInputError:
					logger.warn(`Invalid input error: ${message}`, {
						method,
						url,
						ip
					});
					break;
				case InvalidConfigurationError:
					logger.error(`Invalid configuration error: ${message}`, {
						method,
						url,
						ip
					});
					break;
				case InvalidTokenError:
					logger.info(`Invalid token error: ${message}`, {
						method,
						url,
						ip
					});
					break;
				case MissingResourceError:
					logger.warn(`Missing resource error: ${message}`, {
						method,
						url,
						ip
					});
					break;
				case PartialServiceFailureWarning:
					logger.warn(`Partial service failure warning: ${message}`, {
						method,
						url,
						ip
					});
					break;
				case PasswordValidationError:
					logger.info(`Password validation error: ${message}`, {
						method,
						url,
						ip
					});
					break;
				case PermissionDeniedError:
					logger.info(`Permission denied error: ${message}`, {
						method,
						url,
						ip
					});
					break;
				case QuotaExceededError:
					logger.warn(`Quota exceeded error: ${message}`, {
						method,
						url,
						ip
					});
					break;
				case RateLimitError:
					logger.warn(`Rate limit error: ${message}`, {
						method,
						url,
						ip
					});
					break;
				case ServiceDegradedError:
					logger.warn(`Service degraded error: ${message}`, {
						method,
						url,
						ip
					});
					break;
				case SessionExpiredError:
					logger.info(`Session expired error: ${message}`, {
						method,
						url,
						ip
					});
					break;
				case SlowApiWarning:
					logger.warn(`Slow API warning: ${message}`, {
						method,
						url,
						ip
					});
					break;
				case TimeoutError:
					logger.error(`Timeout error: ${message}`, {
						method,
						url,
						ip
					});
					break;
				case UserActionInfo:
					logger.info(`User action info: ${message}`, {
						method,
						url,
						ip
					});
					break;
				case ValidationError:
					logger.info(`Validation error: ${message}`, {
						method,
						url,
						ip
					});
					break;
			}
		}

		if (isLogger(logger)) {
			switch (severity) {
				case ErrorSeverity.FATAL:
					logger.error(`FATAL: ${message}`, {
						stack,
						method,
						url,
						ip
					});
					break;
				case ErrorSeverity.RECOVERABLE:
					logger.warn(`RECOVERABLE: ${message}`, {
						stack,
						method,
						url,
						ip
					});
					break;
				case ErrorSeverity.WARNING:
					logger.warn(`WARNING: ${message}`, {
						stack,
						method,
						url,
						ip
					});
					break;
				case ErrorSeverity.INFO:
					logger.info(`INFO: ${message}`, { method, url, ip });
					break;
				default:
					logger.error(`UNKNOWN SEVERITY: ${message}`, {
						stack,
						method,
						url,
						ip
					});
					break;
			}
		} else {
			switch (severity) {
				case ErrorSeverity.FATAL:
					fallbackLogger.error(`FATAL: ${message}`, {
						stack,
						method,
						url,
						ip
					});
					break;
				case ErrorSeverity.RECOVERABLE:
					fallbackLogger.warn(`RECOVERABLE: ${message}`, {
						stack,
						method,
						url,
						ip
					});
					break;
				case ErrorSeverity.WARNING:
					fallbackLogger.warn(`WARNING: ${message}`, {
						stack,
						method,
						url,
						ip
					});
					break;
				case ErrorSeverity.INFO:
					fallbackLogger.info(`INFO: ${message}`, {
						method,
						url,
						ip
					});
					break;
				default:
					fallbackLogger.error(`UNKNOWN SEVERITY: ${message}`, {
						stack,
						method,
						url,
						ip
					});
					break;
			}
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
