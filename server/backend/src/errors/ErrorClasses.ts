import { ERROR_CODES } from '../config/errorCodes';

export interface ErrorDetails {
	retryAfter?: number | undefined;
	exposeToClient?: boolean;
	[key: string]: unknown;
}

export const ErrorSeverity = {
	FATAL: 'fatal',
	RECOVERABLE: 'recoverable',
	WARNING: 'warning',
	INFO: 'info'
} as const;

export type ErrorSeverityType =
	(typeof ErrorSeverity)[keyof typeof ErrorSeverity];

export class RootError extends Error {
	public readonly statusCode: number;
	public readonly errorCode?: string | undefined;
	public readonly details?: ErrorDetails | undefined;
	public readonly severity: ErrorSeverityType;

	constructor(
		errorMessage: string,
		statusCode: number = 500,
		severity: ErrorSeverityType = ErrorSeverity.RECOVERABLE,
		errorCode?: string,
		details: ErrorDetails = {}
	) {
		super(errorMessage);

		this.statusCode = statusCode;
		this.severity = severity;
		this.errorCode = errorCode;
		this.details = setDefaultDetails(details);

		Error.captureStackTrace(this, this.constructor);
	}
}

export class AppError extends RootError {
	constructor(
		errorMessage: string,
		statusCode: number = 500,
		severity: ErrorSeverityType = ErrorSeverity.FATAL,
		errorCode: string = ERROR_CODES.APP_ERROR,
		details: ErrorDetails = {}
	) {
		super(
			errorMessage,
			statusCode,
			severity,
			errorCode,
			setDefaultDetails(details)
		);
		this.name = 'AppError';
	}
}

export class ClientError extends RootError {
	constructor(
		errorMessage: string,
		statusCode: number = 400,
		severity: ErrorSeverityType = ErrorSeverity.RECOVERABLE,
		errorCode: string = ERROR_CODES.CLIENT_ERROR,
		details: ErrorDetails = {}
	) {
		super(
			errorMessage,
			statusCode,
			severity,
			errorCode,
			setDefaultDetails(details)
		);
		this.name = 'ClientError';
	}
}

export const defaultRetryAfter = 60;

export function setDefaultDetails(details?: ErrorDetails): ErrorDetails {
	return {
		...details,
		exposeToClient: details?.exposeToClient ?? false
	};
}

export function createRetryMessage(retryAfter?: number): string {
	return retryAfter
		? ` Please try again after ${retryAfter} seconds.`
		: 'Please try again later';
}

export function createQuotaExceededMessage(
	quotaName?: string,
	limit?: number,
	retryAfter?: number
): string {
	const message: string = quotaName ? `${quotaName} limit` : 'Limit';
	const limitMessage: string = limit ? `of ${limit}` : '';
	const retryMessage = createRetryMessage(retryAfter);

	return `${message}${limitMessage}${retryMessage}`;
}

export class AppAuthenticationError extends AppError {
	constructor(
		errorMessage: string = 'Server-side authentication error',
		details: ErrorDetails = {}
	) {
		super(
			errorMessage,
			401,
			ErrorSeverity.RECOVERABLE,
			ERROR_CODES.APP_AUTH_ERROR,
			details
		);
		this.name = 'AppAuthenticationError';
	}
}

export class AuthControllerError extends AppError {
	constructor(
		errorMessage: string = 'Authentication controller error',
		details: ErrorDetails = {}
	) {
		super(
			errorMessage,
			500,
			ErrorSeverity.RECOVERABLE,
			ERROR_CODES.AUTH_CONTROLLER_ERROR,
			details
		);
		this.name = 'AuthControllerError';
	}
}

export class CacheServiceError extends AppError {
	constructor(
		errorMessage: string = 'Cache service-level error',
		details: ErrorDetails = {}
	) {
		super(
			errorMessage,
			500,
			ErrorSeverity.RECOVERABLE,
			ERROR_CODES.CACHE_SERVICE_ERROR,
			details
		);
		this.name = 'CacheServiceError';
	}
}

export class ConfigurationError extends AppError {
	constructor(
		errorMessage: string = 'Internal server error',
		details: ErrorDetails = {}
	) {
		super(
			errorMessage,
			500,
			ErrorSeverity.RECOVERABLE,
			ERROR_CODES.CONFIG_ERROR,
			details
		);
		this.name = 'ConfigurationError';
	}
}

export class ConfigurationErrorFatal extends AppError {
	constructor(
		errorMessage: string = 'Internal server error',
		details: ErrorDetails = {}
	) {
		super(
			errorMessage,
			500,
			ErrorSeverity.FATAL,
			ERROR_CODES.CONFIG_ERROR_FATAL,
			details
		);
		this.name = 'ConfigurationErrorFatal';
	}
}

export class ConcurrencyError extends AppError {
	constructor(resource?: string, details: ErrorDetails = {}) {
		const errorMessage: string = resource
			? `Concurrency error on resource: ${resource}`
			: 'Concurrency error';
		const customDetails = resource ? { resource, ...details } : details;

		super(
			errorMessage,
			409,
			ErrorSeverity.RECOVERABLE,
			ERROR_CODES.CONCURRENCY_ERROR,
			customDetails
		);
		this.name = 'ConcurrencyError';
	}
}

export class ConflictError extends AppError {
	constructor(resource?: string, details: ErrorDetails = {}) {
		const errorMessage: string = resource
			? `Conflict: ${resource} already exists`
			: 'Conflict: resource already exists';

		const customDetails = resource ? { resource, ...details } : details;

		super(
			errorMessage,
			409,
			ErrorSeverity.RECOVERABLE,
			ERROR_CODES.CONFLICT_ERROR,
			customDetails
		);
		this.name = 'ConflictError';
	}
}

export class DatabaseErrorFatal extends AppError {
	constructor(
		errorMessage: string = 'Internal server error',
		details: ErrorDetails = {}
	) {
		super(
			errorMessage,
			500,
			ErrorSeverity.FATAL,
			ERROR_CODES.DB_ERROR_FATAL,
			details
		);
		this.name = 'DatabaseError';
	}
}

export class DatabaseErrorRecoverable extends AppError {
	constructor(
		errorMessage: string = 'Internal server error. Please try again later.',
		details: ErrorDetails = {}
	) {
		super(
			errorMessage,
			503,
			ErrorSeverity.RECOVERABLE,
			ERROR_CODES.DB_ERROR_RECOVERABLE,
			details
		);
		this.name = 'DatabaseErrorRecoverable';
	}
}

export class DataIntegrityError extends AppError {
	constructor(
		errorMessage: string = 'Internal server error',
		details: ErrorDetails = {}
	) {
		super(
			errorMessage,
			500,
			ErrorSeverity.FATAL,
			ERROR_CODES.DATA_INTEGRITY_ERROR,
			details
		);
		this.name = 'DataIntegrityError';
	}
}

export class DependencyErrorFatal extends AppError {
	constructor(
		errorMessage: string = 'Internal server error',
		details: ErrorDetails = {},
		dependencyName?: string
	) {
		const customDetails = dependencyName
			? { dependencyName, ...details }
			: details;

		super(
			errorMessage,
			500,
			ErrorSeverity.FATAL,
			ERROR_CODES.DEPENDENCY_ERROR_FATAL,
			customDetails
		);
		this.name = 'DependencyError';
	}
}

export class DependencyErrorRecoverable extends AppError {
	constructor(
		errorMessage: string = 'Internal server error',
		details: ErrorDetails = {},
		dependencyName?: string
	) {
		const customDetails = dependencyName
			? { dependencyName, ...details }
			: details;

		super(
			errorMessage,
			500,
			ErrorSeverity.RECOVERABLE,
			ERROR_CODES.DEPENDENCY_ERROR_RECOVERABLE,
			customDetails
		);
	}
}

export class ExpressError extends AppError {
	constructor(
		errorMessage: string = 'Internal server error',
		details: ErrorDetails = {}
	) {
		super(
			errorMessage,
			500,
			ErrorSeverity.RECOVERABLE ||
				ErrorSeverity.WARNING ||
				ErrorSeverity.FATAL,
			ERROR_CODES.EXPRESS_ERROR,
			details
		);
		this.name = 'ExpressError';
	}
}

export class ExpressRouteError extends AppError {
	constructor(
		errorMessage: string = 'Internal server error',
		details: ErrorDetails = {}
	) {
		super(
			errorMessage,
			500,
			ErrorSeverity.RECOVERABLE,
			ERROR_CODES.EXPRESS_ROUTE_ERROR,
			details
		);

		this.name = 'ExpressRouteError';
	}
}

export class ExternalServiceErrorFatal extends AppError {
	constructor(
		errorMessage = 'Service unavailable',
		details: ErrorDetails = {}
	) {
		super(
			errorMessage,
			503,
			ErrorSeverity.FATAL,
			ERROR_CODES.EXTERNAL_SERVICE_ERROR_FATAL,
			details
		);
		this.name = 'ExternalServiceErrorFatal';
	}
}

export class FallbackSuccessInfo extends AppError {
	constructor(service?: string, details: ErrorDetails = {}) {
		const errorMessage: string = service
			? `Successfully fell back to ${service}`
			: 'Successfully fell back to another service';
		const customDetails = service ? { service, ...details } : details;

		super(
			errorMessage,
			200,
			ErrorSeverity.INFO,
			ERROR_CODES.FALLBACK_SUCCESS,
			customDetails
		);

		this.name = 'FallbackSuccessInfo';
	}
}

export class HealthCheckError extends AppError {
	constructor(
		errorMessage: string = 'Health check error',
		details: ErrorDetails = {}
	) {
		super(
			errorMessage,
			500,
			ErrorSeverity.RECOVERABLE,
			ERROR_CODES.HEALTH_CHECK_ERROR,
			details
		);

		this.name = 'HealthCheckError';
	}
}

export class HTTPSClientErrorFatal extends AppError {
	constructor(
		errorMessage: string = 'HTTPS Client Error (fatal)',
		details: ErrorDetails = {}
	) {
		super(
			errorMessage,
			500,
			ErrorSeverity.FATAL,
			ERROR_CODES.HTTPS_CLIENT_ERROR_FAL,
			details
		);

		this.name = 'HTTPSClientErrorFatal';
	}
}

export class HTTPSServerErrorRecoverable extends AppError {
	constructor(
		errorMessage: string = 'HTTPS Server Error (recoverable)',
		details: ErrorDetails = {}
	) {
		super(
			errorMessage,
			500,
			ErrorSeverity.RECOVERABLE,
			ERROR_CODES.HTTPS_SERVER_ERROR_RECOVERABLE,
			details
		);

		this.name = 'HTTPSServerErrorRecoverable';
	}
}

export class InsufficientStorageError extends AppError {
	constructor(
		requiredSpace?: number,
		availableSpace?: number,
		details: ErrorDetails = {}
	) {
		const errorMessage = [
			'Insufficient storage.',
			requiredSpace ? `Required: ${requiredSpace}MB` : null,
			availableSpace ? `Available: ${availableSpace}MB` : null
		]
			.filter(Boolean)
			.join(', ');

		const errorDetails: ErrorDetails = {
			...(requiredSpace !== undefined ? { requiredSpace } : {}),
			...(availableSpace !== undefined ? { availableSpace } : {}),
			...details
		};

		super(
			errorMessage,
			507,
			ErrorSeverity.FATAL,
			ERROR_CODES.INSUFFICIENT_STORAGE,
			errorDetails
		);

		this.name = 'InsufficientStorageError';
	}
}

export class InvalidConfigurationError extends AppError {
	constructor(configKey?: string, details: ErrorDetails = {}) {
		const errorMessage: string = configKey
			? `Invalid or missing configuration for ${configKey}`
			: 'Invalid or missing configuration';

		const customDetails = configKey ? { configKey, ...details } : details;

		super(
			errorMessage,
			500,
			ErrorSeverity.FATAL,
			ERROR_CODES.INVALID_CONFIG,
			customDetails
		);

		this.name = 'InvalidConfigurationError';
	}
}

export class MiddlewareServiceError extends AppError {
	constructor(
		errorMessage: string = 'Middleware Service error',
		details: ErrorDetails = {}
	) {
		super(
			errorMessage,
			500,
			ErrorSeverity.RECOVERABLE,
			ERROR_CODES.MIDDLEWARE_SERVICE_ERROR,
			details
		);

		this.name = 'CacheServiceError';
	}
}

export class MissingResourceError extends AppError {
	constructor(resource?: string, details: ErrorDetails = {}) {
		const errorMessage: string = resource
			? `${resource} not found`
			: 'Resource not found';

		const customDetails = resource ? { resource, ...details } : details;

		super(
			errorMessage,
			404,
			ErrorSeverity.RECOVERABLE,
			ERROR_CODES.MISSING_RESOURCE,
			customDetails
		);

		this.name = 'MissingResourceError';
	}
}

export class PassportAuthServiceError extends AppError {
	constructor(
		errorMessage: string = 'Passport Auth Service error',
		details: ErrorDetails = {}
	) {
		super(
			errorMessage,
			500,
			ErrorSeverity.RECOVERABLE,
			ERROR_CODES.PASSPORT_AUTH_SERVICE_ERROR,
			details
		);

		this.name = 'PassportAuthServiceError';
	}
}

export class PartialServiceFailureWarning extends AppError {
	constructor(serviceName?: string, details: ErrorDetails = {}) {
		const errorMessage: string = serviceName
			? `${serviceName} is currently experiencing issues. Please try again later.`
			: 'Service is currently experiencing issues. Please try again later.';

		const customDetails = serviceName
			? { serviceName, ...details }
			: details;
		super(
			errorMessage,
			503,
			ErrorSeverity.WARNING,
			ERROR_CODES.PARTIAL_SERVICE_FAILURE,
			customDetails
		);

		this.name = 'PartialServiceFailureWarning';
	}
}

export class QuotaExceededErrorFatal extends AppError {
	constructor(
		retryAfter: number = defaultRetryAfter,
		quotaName?: string,
		limit?: number,
		details: ErrorDetails = {}
	) {
		const errorMessage: string = createQuotaExceededMessage(
			quotaName,
			limit,
			retryAfter
		);

		const errorDetails: ErrorDetails = {
			...(quotaName ? { quotaName } : {}),
			...(limit !== undefined ? { limit } : {}),
			...(retryAfter ? { retryAfter } : {}),
			...details
		};

		super(
			errorMessage,
			500,
			ErrorSeverity.FATAL,
			ERROR_CODES.QUOTA_EXCEEDED_FATAL,
			errorDetails
		);

		this.name = 'QuotaExceededError';
	}
}

export class RateLimitErrorFatal extends AppError {
	constructor(
		retryAfter: number = defaultRetryAfter,
		details: ErrorDetails = {}
	) {
		const message: string = 'Rate limit exceeded (fatal exception).';
		const retryMessage: string = createRetryMessage(retryAfter);
		const errorMessage = `${message}${retryMessage}`.trim();

		const customDetails = retryAfter ? { retryAfter, ...details } : details;

		super(
			errorMessage,
			429,
			ErrorSeverity.FATAL,
			ERROR_CODES.RATE_LIMIT_EXCEEDED_FATAL,
			customDetails
		);

		this.name = 'RateLimitErrorFatal';
	}
}

export class RedisServiceError extends AppError {
	constructor(
		errorMessage: string = 'Redis Service error',
		details: ErrorDetails = {}
	) {
		super(
			errorMessage,
			500,
			ErrorSeverity.RECOVERABLE,
			ERROR_CODES.REDIS_SERVICE_ERROR,
			details
		);

		this.name = 'CacheServiceError';
	}
}

export class ResourceManagerError extends AppError {
	constructor(
		errorMessage: string = 'Resource Manager error',
		details: ErrorDetails = {}
	) {
		super(
			errorMessage,
			500,
			ErrorSeverity.RECOVERABLE,
			ERROR_CODES.REDIS_SERVICE_ERROR,
			details
		);

		this.name = 'CacheServiceError';
	}
}

export class RootMiddlewareError extends AppError {
	constructor(
		errorMessage: string = 'Root middleware error',
		details: ErrorDetails = {}
	) {
		super(
			errorMessage,
			500,
			ErrorSeverity.WARNING || ErrorSeverity.FATAL,
			ERROR_CODES.ROOT_MIDDLEWARE_ERROR,
			details
		);

		this.name = 'RootMiddlewareError';
	}
}

export class ServerNotInitializedError extends AppError {
	constructor(
		errorMessage: string = 'HTTPS Server is not initialized',
		details: ErrorDetails = {}
	) {
		super(
			errorMessage,
			500,
			ErrorSeverity.WARNING,
			ERROR_CODES.SERVER_NOT_INITIALIZED_ERROR,
			details
		);

		this.name = 'RootMiddlewareError';
	}
}

export class ServiceDegradedError extends AppError {
	constructor(service?: string, details: ErrorDetails = {}) {
		const errorMessage: string = service
			? `${service} is currently degraded`
			: 'Service is currently degraded';

		const customDetails = service ? { service, ...details } : details;

		super(
			errorMessage,
			200,
			ErrorSeverity.WARNING,
			ERROR_CODES.SERVICE_DEGRADED,
			customDetails
		);

		this.name = 'ServiceDegradedError';
	}
}

export class ServiceDegradedErrorMinor extends AppError {
	constructor(service: string, details: ErrorDetails = {}) {
		const errorMessage: string = service
			? `${service} is currently degraded (minor)`
			: 'Service is currently degraded (minor)';

		const customDetails = service ? { service, ...details } : details;

		super(
			errorMessage,
			200,
			ErrorSeverity.INFO,
			ERROR_CODES.SERVICE_DEGRADED_MINOR,
			customDetails
		);

		this.name = 'ServiceDegradedErrorMinor';
	}
}

export class ServiceUnavailableError extends AppError {
	constructor(
		retryAfter: number = defaultRetryAfter,
		service?: string,
		details: ErrorDetails = {}
	) {
		const message: string = service
			? `${service} is currently unavailable`
			: 'Service is currently unavailable';

		const retryMessage: string = retryAfter
			? ` Please try again after ${retryAfter} seconds.`
			: ' Please try again later.';

		const errorMessage = `${message} ${retryMessage}`.trim();

		const errorDetails: ErrorDetails = {
			...(retryAfter !== undefined ? { retryAfter } : {}),
			...(service !== undefined ? { service } : {}),
			...details
		};

		super(
			errorMessage,
			503,
			ErrorSeverity.RECOVERABLE,
			ERROR_CODES.SERVICE_UNAVAILABLE,
			errorDetails
		);

		this.name = 'ServiceUnavailableError';
	}
}

export class ServiceUnavailableErrorFatal extends AppError {
	constructor(service?: string, details: ErrorDetails = {}) {
		const errorMessage: string = service
			? `${service} is currently unavailable (fatal exception)`
			: 'Service is currently unavailable (fatal exception)';

		const errorDetails: ErrorDetails = {
			...(service !== undefined ? { service } : {}),
			...details
		};

		super(
			errorMessage,
			503,
			ErrorSeverity.FATAL,
			ERROR_CODES.SERVICE_UNAVAILABLE,
			errorDetails
		);

		this.name = 'ServiceUnavailableErrorFatal';
	}
}

export class SlowApiWarning extends AppError {
	constructor(
		apiName?: string,
		responseTime?: number,
		details: ErrorDetails = {}
	) {
		const errorMessage = [
			apiName
				? `${apiName} is responding slowly`
				: 'API is responding slowly.',
			responseTime ? ` Response time: ${responseTime}ms` : null
		]
			.filter(Boolean)
			.join('');

		const errorDetails: ErrorDetails = {
			...(apiName !== undefined ? { apiName } : {}),
			...(responseTime !== undefined ? { responseTime } : {}),
			...details
		};

		super(
			errorMessage,
			200,
			ErrorSeverity.WARNING,
			ERROR_CODES.SLOW_API_WARNING,
			errorDetails
		);

		this.name = 'SlowApiWarning';
	}
}

export class UserActionInfo extends AppError {
	constructor(action?: string, details: ErrorDetails = {}) {
		const errorMessage: string = action
			? `User performed action: ${action}`
			: 'User performed action';
		const customDetails = action ? { action, ...details } : details;

		super(
			errorMessage,
			200,
			ErrorSeverity.INFO,
			ERROR_CODES.USER_ACTION_INFO,
			customDetails
		);

		this.name = 'UserActionInfo';
	}
}

export class UtilityErrorFatal extends AppError {
	constructor(utility?: string, details: ErrorDetails = {}) {
		const errorMessage: string = `Fatal error occured when calling ${utility}`;
		const customDetails = utility ? { utility, ...details } : details;

		super(
			errorMessage,
			500,
			ErrorSeverity.FATAL,
			ERROR_CODES.UTILITY_ERROR_FATAL,
			customDetails
		);

		this.name = 'UtilityErrorFatal';
	}
}

export class UtilityErrorRecoverable extends AppError {
	constructor(utility?: string, details: ErrorDetails = {}) {
		const errorMessage: string = `Utility occurred in ${utility}`;

		const customDetails = utility ? { utility, ...details } : details;

		super(
			errorMessage,
			500,
			ErrorSeverity.RECOVERABLE,
			ERROR_CODES.UTILITY_ERROR_RECOVERABLE,
			customDetails
		);
		this.name = 'UtilityErrorRecoverable';
	}
}

export class ValidationError extends AppError {
	constructor(invalidFields?: string[], details: ErrorDetails = {}) {
		const errorMessage: string = invalidFields
			? `Validation error on fields: ${invalidFields.join(', ')}`
			: 'Validation error';
		const customDetails = invalidFields
			? { invalidFields, ...details }
			: details;

		super(
			errorMessage,
			400,
			ErrorSeverity.WARNING,
			ERROR_CODES.VALIDATION_ERROR,
			customDetails
		);
		this.name = 'ValidationError';
	}
}

export class AutoCorrectedInputWarning extends ClientError {
	constructor(fieldName?: string, details: ErrorDetails = {}) {
		const errorMessage: string = fieldName
			? `${fieldName} was auto-corrected`
			: 'Input was auto-corrected';

		const customDetails = fieldName ? { fieldName, ...details } : details;

		super(
			errorMessage,
			200,
			ErrorSeverity.WARNING,
			ERROR_CODES.AUTOCORRECT_INPUT_WARNING,
			customDetails
		);
		this.name = 'AutoCorrectedInputWarning';
	}
}

export class ClientAuthenticationError extends ClientError {
	constructor(
		errorMessage: string = 'Authentication failed',
		details: ErrorDetails = {}
	) {
		super(
			errorMessage,
			401,
			ErrorSeverity.RECOVERABLE,
			ERROR_CODES.CLIENT_AUTH_ERROR,
			details
		);
		this.name = 'AuthenticationError';
	}
}

export class DeprecatedApiWarning extends ClientError {
	constructor(apiVersion?: string, details: ErrorDetails = {}) {
		const errorMessage: string = apiVersion
			? `Deprecated API version ${apiVersion} used`
			: 'Deprecated API version used';

		const customDetails = apiVersion ? { apiVersion, ...details } : details;

		super(
			errorMessage,
			200,
			ErrorSeverity.WARNING,
			ERROR_CODES.DEPRECATED_API_WARNING,
			customDetails
		);
		this.name = 'DeprecatedApiWarning';
	}
}

export class ExternalServiceError extends ClientError {
	constructor(
		errorMessage = 'Service temporarily unavailable',
		details: ErrorDetails = {}
	) {
		super(
			errorMessage,
			503,
			ErrorSeverity.RECOVERABLE,
			ERROR_CODES.EXTERNAL_SERVICE_ERROR,
			details
		);
		this.name = 'ExternalServiceError';
	}
}

export class FileProcessingError extends ClientError {
	constructor(
		retryAfter: number = defaultRetryAfter,
		details: ErrorDetails = {}
	) {
		const message: string = 'File processing failed.';
		const retryAfterMessage: string = createRetryMessage(retryAfter);
		const errorMessage: string = `${message} ${retryAfterMessage}`.trim();

		const customDetails = retryAfter ? { retryAfter, ...details } : details;

		super(
			errorMessage,
			500,
			ErrorSeverity.RECOVERABLE,
			ERROR_CODES.FILE_PROCESSING_ERROR,
			customDetails
		);
		this.name = 'FileProcessingError';
	}
}

export class ForbiddenError extends ClientError {
	constructor(action?: string, details: ErrorDetails = {}) {
		const errorMessage: string = action
			? `Forbidden: You are not allowed to ${action}`
			: 'Forbidden';

		const customDetails = action ? { action, ...details } : details;

		super(
			errorMessage,
			403,
			ErrorSeverity.RECOVERABLE,
			ERROR_CODES.FORBIDDEN,
			customDetails
		);
		this.name = 'ForbiddenError';
	}
}

export class InvalidCredentialsError extends ClientError {
	constructor(
		errorMessage: string = 'Invalid credentials provided',
		details: ErrorDetails = {}
	) {
		super(
			errorMessage,
			401,
			ErrorSeverity.RECOVERABLE,
			ERROR_CODES.INVALID_CREDENTIALS,
			details
		);
		this.name = 'InvalidCredentialsError';
	}
}

export class InvalidInputError extends ClientError {
	constructor(inputName?: string, details: ErrorDetails = {}) {
		const errorMessage: string = inputName
			? `Invalid input: ${inputName}`
			: 'Invalid input provided';

		const customDetails = inputName ? { inputName, ...details } : details;

		super(
			errorMessage,
			400,
			ErrorSeverity.WARNING,
			ERROR_CODES.INVALID_INPUT,
			customDetails
		);
		this.name = 'InvalidInputError';
	}
}

export class InvalidTokenError extends ClientError {
	constructor(
		errorMessage: string = 'Invalid or expired token',
		token?: string,
		details: ErrorDetails = {}
	) {
		const customDetails = token ? { token, ...details } : details;

		super(
			errorMessage,
			401,
			ErrorSeverity.RECOVERABLE,
			ERROR_CODES.INVALID_TOKEN,
			customDetails
		);
		this.name = 'InvalidTokenError';
	}
}

export class PasswordValidationError extends ClientError {
	constructor(
		errorMessage: string = 'Password validation error. Please try again',
		details: ErrorDetails = {}
	) {
		super(
			errorMessage,
			400,
			ErrorSeverity.WARNING,
			ERROR_CODES.PASSWORD_VALIDATION_ERROR,
			details
		);
		this.name = 'PasswordValidationError';
	}
}

export class PermissionDeniedError extends ClientError {
	constructor(
		errorMessage: string = 'Permission denied',
		action?: string,
		details: ErrorDetails = {}
	) {
		const customDetails = action ? { action, ...details } : details;

		super(
			errorMessage,
			403,
			ErrorSeverity.RECOVERABLE,
			ERROR_CODES.PERMISSION_DENIED,
			customDetails
		);
		this.name = 'PermissionDeniedError';
	}
}

export class QuotaExceededErrorRecoverable extends ClientError {
	constructor(
		retryAfter: number = defaultRetryAfter,
		quotaName: string,
		limit: number,
		details: ErrorDetails = {}
	) {
		const errorMessage: string = createQuotaExceededMessage(
			quotaName,
			limit,
			retryAfter
		);

		const errorDetails: ErrorDetails = {
			...(quotaName ? { quotaName } : {}),
			...(limit !== undefined ? { limit } : {}),
			...(retryAfter ? { retryAfter } : {}),
			...details
		};

		super(
			errorMessage,
			429,
			ErrorSeverity.RECOVERABLE,
			ERROR_CODES.QUOTA_EXCEEDED,
			errorDetails
		);
		this.name = 'QuotaExceededError';
	}
}

export class QuotaExceededErrorWarning extends ClientError {
	constructor(
		retryAfter: number = defaultRetryAfter,
		quotaName?: string,
		limit?: number,
		details: ErrorDetails = {}
	) {
		const errorMessage: string = createQuotaExceededMessage(
			quotaName,
			limit,
			retryAfter
		);

		const errorDetails: ErrorDetails = {
			...(quotaName ? { quotaName } : {}),
			...(limit !== undefined ? { limit } : {}),
			...(retryAfter ? { retryAfter } : {}),
			...details
		};

		super(
			errorMessage,
			429,
			ErrorSeverity.WARNING,
			ERROR_CODES.QUOTA_EXCEEDED_WARNING,
			errorDetails
		);
		this.name = 'QuotaExceededErrorWarning';
	}
}

export class RateLimitErrorRecoverable extends ClientError {
	constructor(
		retryAfter: number = defaultRetryAfter,
		details: ErrorDetails = {}
	) {
		const message: string = 'Rate limit exceeded.';
		const retryMessage: string = createRetryMessage(retryAfter);
		const errorMessage = `${message}${retryMessage}`.trim();

		const customDetails = retryAfter ? { retryAfter, ...details } : details;

		super(
			errorMessage,
			429,
			ErrorSeverity.RECOVERABLE,
			ERROR_CODES.RATE_LIMIT_EXCEEDED,
			customDetails
		);
		this.name = 'RateLimitErrorRecoverable';
	}
}

export class RateLimitErrorWarning extends ClientError {
	constructor(
		retryAfter: number = defaultRetryAfter,
		details: ErrorDetails = {}
	) {
		const message: string = 'Rate limit exceeded.';
		const retryMessage: string = createRetryMessage(retryAfter);
		const errorMessage = `${message}${retryMessage}`.trim();

		const customDetails = retryAfter ? { retryAfter, ...details } : details;

		super(
			errorMessage,
			429,
			ErrorSeverity.WARNING,
			ERROR_CODES.RATE_LIMIT_EXCEEDED_WARNING,
			customDetails
		);
		this.name = 'RateLimitErrorWarning';
	}
}

export class SessionExpiredError extends ClientError {
	constructor(
		errorMessage: string = 'Your session has expired',
		details: ErrorDetails = {}
	) {
		super(
			errorMessage,
			401,
			ErrorSeverity.RECOVERABLE,
			ERROR_CODES.SESSION_EXPIRED,
			details
		);
		this.name = 'SessionExpiredError';
	}
}

export class TimeoutError extends ClientError {
	constructor(
		errorMessage: string = 'Request timed out. Please try again',
		details: ErrorDetails = {}
	) {
		super(
			errorMessage,
			504,
			ErrorSeverity.RECOVERABLE,
			ERROR_CODES.TIMEOUT_ERROR,
			details
		);
		this.name = 'TimeoutError';
	}
}

export class UserRegistrationError extends ClientError {
	constructor(
		errorMessage: string = 'Account registration failed. Please try again.',
		details: ErrorDetails = {}
	) {
		super(
			errorMessage,
			500,
			ErrorSeverity.RECOVERABLE,
			ERROR_CODES.USER_REGISTRATION_ERROR,
			details
		);
		this.name = 'UserRegistrationError';
	}
}

export const ErrorClasses = {
	AppAuthenticationError,
	AuthControllerError,
	AutoCorrectedInputWarning,
	CacheServiceError,
	ClientAuthenticationError,
	ConcurrencyError,
	ConfigurationError,
	ConfigurationErrorFatal,
	ConflictError,
	DatabaseErrorFatal,
	DatabaseErrorRecoverable,
	DataIntegrityError,
	DependencyErrorFatal,
	DependencyErrorRecoverable,
	DeprecatedApiWarning,
	ExpressError,
	ExpressRouteError,
	ExternalServiceError,
	ExternalServiceErrorFatal,
	FallbackSuccessInfo,
	FileProcessingError,
	ForbiddenError,
	HealthCheckError,
	HTTPSClientErrorFatal,
	HTTPSServerErrorRecoverable,
	InsufficientStorageError,
	InvalidCredentialsError,
	InvalidInputError,
	InvalidTokenError,
	MiddlewareServiceError,
	MissingResourceError,
	PassportAuthServiceError,
	PartialServiceFailureWarning,
	PasswordValidationError,
	PermissionDeniedError,
	QuotaExceededErrorFatal,
	QuotaExceededErrorRecoverable,
	QuotaExceededErrorWarning,
	RateLimitErrorFatal,
	RateLimitErrorRecoverable,
	RateLimitErrorWarning,
	RedisServiceError,
	ResourceManagerError,
	RootMiddlewareError,
	ServerNotInitializedError,
	ServiceDegradedError,
	ServiceDegradedErrorMinor,
	ServiceUnavailableError,
	ServiceUnavailableErrorFatal,
	SessionExpiredError,
	SlowApiWarning,
	TimeoutError,
	UserActionInfo,
	UserRegistrationError,
	UtilityErrorFatal,
	UtilityErrorRecoverable,
	ValidationError
};
