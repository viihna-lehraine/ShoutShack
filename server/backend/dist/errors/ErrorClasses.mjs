import { ERROR_CODES } from '../config/errorCodes.mjs';
export const ErrorSeverity = {
	FATAL: 'fatal',
	RECOVERABLE: 'recoverable',
	WARNING: 'warning',
	INFO: 'info'
};
export class RootError extends Error {
	statusCode;
	errorCode;
	details;
	severity;
	constructor(
		errorMessage,
		statusCode = 500,
		severity = ErrorSeverity.RECOVERABLE,
		errorCode,
		details = {}
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
		errorMessage,
		statusCode = 500,
		severity = ErrorSeverity.FATAL,
		errorCode = ERROR_CODES.APP_ERROR,
		details = {}
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
		errorMessage,
		statusCode = 400,
		severity = ErrorSeverity.RECOVERABLE,
		errorCode = ERROR_CODES.CLIENT_ERROR,
		details = {}
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
export function setDefaultDetails(details) {
	return {
		...details,
		exposeToClient: details?.exposeToClient ?? false
	};
}
export function createRetryMessage(retryAfter) {
	return retryAfter
		? ` Please try again after ${retryAfter} seconds.`
		: 'Please try again later';
}
export function createQuotaExceededMessage(quotaName, limit, retryAfter) {
	const message = quotaName ? `${quotaName} limit` : 'Limit';
	const limitMessage = limit ? `of ${limit}` : '';
	const retryMessage = createRetryMessage(retryAfter);
	return `${message}${limitMessage}${retryMessage}`;
}
export class AppAuthenticationError extends AppError {
	constructor(
		errorMessage = 'Server-side authentication error',
		details = {}
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
		errorMessage = 'Authentication controller error',
		details = {}
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
	constructor(errorMessage = 'Cache service-level error', details = {}) {
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
	constructor(errorMessage = 'Internal server error', details = {}) {
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
	constructor(errorMessage = 'Internal server error', details = {}) {
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
	constructor(resource, details = {}) {
		const errorMessage = resource
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
	constructor(resource, details = {}) {
		const errorMessage = resource
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
	constructor(errorMessage = 'Internal server error', details = {}) {
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
		errorMessage = 'Internal server error. Please try again later.',
		details = {}
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
	constructor(errorMessage = 'Internal server error', details = {}) {
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
		errorMessage = 'Internal server error',
		details = {},
		dependencyName
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
		errorMessage = 'Internal server error',
		details = {},
		dependencyName
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
	constructor(errorMessage = 'Internal server error', details = {}) {
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
	constructor(errorMessage = 'Internal server error', details = {}) {
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
	constructor(errorMessage = 'Service unavailable', details = {}) {
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
	constructor(service, details = {}) {
		const errorMessage = service
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
	constructor(errorMessage = 'Health check error', details = {}) {
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
	constructor(errorMessage = 'HTTPS Client Error (fatal)', details = {}) {
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
		errorMessage = 'HTTPS Server Error (recoverable)',
		details = {}
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
	constructor(requiredSpace, availableSpace, details = {}) {
		const errorMessage = [
			'Insufficient storage.',
			requiredSpace ? `Required: ${requiredSpace}MB` : null,
			availableSpace ? `Available: ${availableSpace}MB` : null
		]
			.filter(Boolean)
			.join(', ');
		const errorDetails = {
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
	constructor(configKey, details = {}) {
		const errorMessage = configKey
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
	constructor(errorMessage = 'Middleware Service error', details = {}) {
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
	constructor(resource, details = {}) {
		const errorMessage = resource
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
	constructor(errorMessage = 'Passport Auth Service error', details = {}) {
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
	constructor(serviceName, details = {}) {
		const errorMessage = serviceName
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
		retryAfter = defaultRetryAfter,
		quotaName,
		limit,
		details = {}
	) {
		const errorMessage = createQuotaExceededMessage(
			quotaName,
			limit,
			retryAfter
		);
		const errorDetails = {
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
	constructor(retryAfter = defaultRetryAfter, details = {}) {
		const message = 'Rate limit exceeded (fatal exception).';
		const retryMessage = createRetryMessage(retryAfter);
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
	constructor(errorMessage = 'Redis Service error', details = {}) {
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
	constructor(errorMessage = 'Resource Manager error', details = {}) {
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
	constructor(errorMessage = 'Root middleware error', details = {}) {
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
		errorMessage = 'HTTPS Server is not initialized',
		details = {}
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
	constructor(service, details = {}) {
		const errorMessage = service
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
	constructor(service, details = {}) {
		const errorMessage = service
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
	constructor(retryAfter = defaultRetryAfter, service, details = {}) {
		const message = service
			? `${service} is currently unavailable`
			: 'Service is currently unavailable';
		const retryMessage = retryAfter
			? ` Please try again after ${retryAfter} seconds.`
			: ' Please try again later.';
		const errorMessage = `${message} ${retryMessage}`.trim();
		const errorDetails = {
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
	constructor(service, details = {}) {
		const errorMessage = service
			? `${service} is currently unavailable (fatal exception)`
			: 'Service is currently unavailable (fatal exception)';
		const errorDetails = {
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
	constructor(apiName, responseTime, details = {}) {
		const errorMessage = [
			apiName
				? `${apiName} is responding slowly`
				: 'API is responding slowly.',
			responseTime ? ` Response time: ${responseTime}ms` : null
		]
			.filter(Boolean)
			.join('');
		const errorDetails = {
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
	constructor(action, details = {}) {
		const errorMessage = action
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
	constructor(utility, details = {}) {
		const errorMessage = `Fatal error occured when calling ${utility}`;
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
	constructor(utility, details = {}) {
		const errorMessage = `Utility occurred in ${utility}`;
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
	constructor(invalidFields, details = {}) {
		const errorMessage = invalidFields
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
	constructor(fieldName, details = {}) {
		const errorMessage = fieldName
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
	constructor(errorMessage = 'Authentication failed', details = {}) {
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
	constructor(apiVersion, details = {}) {
		const errorMessage = apiVersion
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
		details = {}
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
	constructor(retryAfter = defaultRetryAfter, details = {}) {
		const message = 'File processing failed.';
		const retryAfterMessage = createRetryMessage(retryAfter);
		const errorMessage = `${message} ${retryAfterMessage}`.trim();
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
	constructor(action, details = {}) {
		const errorMessage = action
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
	constructor(errorMessage = 'Invalid credentials provided', details = {}) {
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
	constructor(inputName, details = {}) {
		const errorMessage = inputName
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
		errorMessage = 'Invalid or expired token',
		token,
		details = {}
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
		errorMessage = 'Password validation error. Please try again',
		details = {}
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
	constructor(errorMessage = 'Permission denied', action, details = {}) {
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
		retryAfter = defaultRetryAfter,
		quotaName,
		limit,
		details = {}
	) {
		const errorMessage = createQuotaExceededMessage(
			quotaName,
			limit,
			retryAfter
		);
		const errorDetails = {
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
		retryAfter = defaultRetryAfter,
		quotaName,
		limit,
		details = {}
	) {
		const errorMessage = createQuotaExceededMessage(
			quotaName,
			limit,
			retryAfter
		);
		const errorDetails = {
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
	constructor(retryAfter = defaultRetryAfter, details = {}) {
		const message = 'Rate limit exceeded.';
		const retryMessage = createRetryMessage(retryAfter);
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
	constructor(retryAfter = defaultRetryAfter, details = {}) {
		const message = 'Rate limit exceeded.';
		const retryMessage = createRetryMessage(retryAfter);
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
	constructor(errorMessage = 'Your session has expired', details = {}) {
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
		errorMessage = 'Request timed out. Please try again',
		details = {}
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
		errorMessage = 'Account registration failed. Please try again.',
		details = {}
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRXJyb3JDbGFzc2VzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2Vycm9ycy9FcnJvckNsYXNzZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLFdBQVcsRUFBRSxNQUFNLHNCQUFzQixDQUFDO0FBUW5ELE1BQU0sQ0FBQyxNQUFNLGFBQWEsR0FBRztJQUM1QixLQUFLLEVBQUUsT0FBTztJQUNkLFdBQVcsRUFBRSxhQUFhO0lBQzFCLE9BQU8sRUFBRSxTQUFTO0lBQ2xCLElBQUksRUFBRSxNQUFNO0NBQ0gsQ0FBQztBQUtYLE1BQU0sT0FBTyxTQUFVLFNBQVEsS0FBSztJQUNuQixVQUFVLENBQVM7SUFDbkIsU0FBUyxDQUFzQjtJQUMvQixPQUFPLENBQTRCO0lBQ25DLFFBQVEsQ0FBb0I7SUFFNUMsWUFDQyxZQUFvQixFQUNwQixhQUFxQixHQUFHLEVBQ3hCLFdBQThCLGFBQWEsQ0FBQyxXQUFXLEVBQ3ZELFNBQWtCLEVBQ2xCLFVBQXdCLEVBQUU7UUFFMUIsS0FBSyxDQUFDLFlBQVksQ0FBQyxDQUFDO1FBRXBCLElBQUksQ0FBQyxVQUFVLEdBQUcsVUFBVSxDQUFDO1FBQzdCLElBQUksQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDO1FBQ3pCLElBQUksQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFDO1FBQzNCLElBQUksQ0FBQyxPQUFPLEdBQUcsaUJBQWlCLENBQUMsT0FBTyxDQUFDLENBQUM7UUFFMUMsS0FBSyxDQUFDLGlCQUFpQixDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7SUFDakQsQ0FBQztDQUNEO0FBRUQsTUFBTSxPQUFPLFFBQVMsU0FBUSxTQUFTO0lBQ3RDLFlBQ0MsWUFBb0IsRUFDcEIsYUFBcUIsR0FBRyxFQUN4QixXQUE4QixhQUFhLENBQUMsS0FBSyxFQUNqRCxZQUFvQixXQUFXLENBQUMsU0FBUyxFQUN6QyxVQUF3QixFQUFFO1FBRTFCLEtBQUssQ0FDSixZ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QUF5QjtJQUN6QixpQkFBaUI7SUFDakIseUJBQXlCO0lBQ3pCLGdCQUFnQjtJQUNoQixrQkFBa0I7SUFDbEIsdUJBQXVCO0lBQ3ZCLGFBQWE7SUFDYixrQkFBa0I7SUFDbEIsd0JBQXdCO0lBQ3hCLGtCQUFrQjtJQUNsQixvQkFBb0I7SUFDcEIsMEJBQTBCO0lBQzFCLG9CQUFvQjtJQUNwQixZQUFZO0lBQ1osaUJBQWlCO0lBQ2pCLG9CQUFvQjtJQUNwQix5QkFBeUI7SUFDekIsbUJBQW1CO0lBQ25CLG1CQUFtQjtJQUNuQixjQUFjO0lBQ2QsZ0JBQWdCO0lBQ2hCLHFCQUFxQjtJQUNyQiwyQkFBMkI7SUFDM0Isd0JBQXdCO0lBQ3hCLHVCQUF1QjtJQUN2QixpQkFBaUI7SUFDakIsaUJBQWlCO0lBQ2pCLHNCQUFzQjtJQUN0QixvQkFBb0I7SUFDcEIsd0JBQXdCO0lBQ3hCLDRCQUE0QjtJQUM1Qix1QkFBdUI7SUFDdkIscUJBQXFCO0lBQ3JCLHVCQUF1QjtJQUN2Qiw2QkFBNkI7SUFDN0IseUJBQXlCO0lBQ3pCLG1CQUFtQjtJQUNuQix5QkFBeUI7SUFDekIscUJBQXFCO0lBQ3JCLGlCQUFpQjtJQUNqQixvQkFBb0I7SUFDcEIsbUJBQW1CO0lBQ25CLHlCQUF5QjtJQUN6QixvQkFBb0I7SUFDcEIseUJBQXlCO0lBQ3pCLHVCQUF1QjtJQUN2Qiw0QkFBNEI7SUFDNUIsbUJBQW1CO0lBQ25CLGNBQWM7SUFDZCxZQUFZO0lBQ1osY0FBYztJQUNkLHFCQUFxQjtJQUNyQixpQkFBaUI7SUFDakIsdUJBQXVCO0lBQ3ZCLGVBQWU7Q0FDZixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgRVJST1JfQ09ERVMgfSBmcm9tICcuLi9jb25maWcvZXJyb3JDb2Rlcyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgRXJyb3JEZXRhaWxzIHtcblx0cmV0cnlBZnRlcj86IG51bWJlciB8IHVuZGVmaW5lZDtcblx0ZXhwb3NlVG9DbGllbnQ/OiBib29sZWFuO1xuXHRba2V5OiBzdHJpbmddOiB1bmtub3duO1xufVxuXG5leHBvcnQgY29uc3QgRXJyb3JTZXZlcml0eSA9IHtcblx0RkFUQUw6ICdmYXRhbCcsXG5cdFJFQ09WRVJBQkxFOiAncmVjb3ZlcmFibGUnLFxuXHRXQVJOSU5HOiAnd2FybmluZycsXG5cdElORk86ICdpbmZvJ1xufSBhcyBjb25zdDtcblxuZXhwb3J0IHR5cGUgRXJyb3JTZXZlcml0eVR5cGUgPVxuXHQodHlwZW9mIEVycm9yU2V2ZXJpdHkpW2tleW9mIHR5cGVvZiBFcnJvclNldmVyaXR5XTtcblxuZXhwb3J0IGNsYXNzIFJvb3RFcnJvciBleHRlbmRzIEVycm9yIHtcblx0cHVibGljIHJlYWRvbmx5IHN0YXR1c0NvZGU6IG51bWJlcjtcblx0cHVibGljIHJlYWRvbmx5IGVycm9yQ29kZT86IHN0cmluZyB8IHVuZGVmaW5lZDtcblx0cHVibGljIHJlYWRvbmx5IGRldGFpbHM/OiBFcnJvckRldGFpbHMgfCB1bmRlZmluZWQ7XG5cdHB1YmxpYyByZWFkb25seSBzZXZlcml0eTogRXJyb3JTZXZlcml0eVR5cGU7XG5cblx0Y29uc3RydWN0b3IoXG5cdFx0ZXJyb3JNZXNzYWdlOiBzdHJpbmcsXG5cdFx0c3RhdHVzQ29kZTogbnVtYmVyID0gNTAwLFxuXHRcdHNldmVyaXR5OiBFcnJvclNldmVyaXR5VHlwZSA9IEVycm9yU2V2ZXJpdHkuUkVDT1ZFUkFCTEUsXG5cdFx0ZXJyb3JDb2RlPzogc3RyaW5nLFxuXHRcdGRldGFpbHM6IEVycm9yRGV0YWlscyA9IHt9XG5cdCkge1xuXHRcdHN1cGVyKGVycm9yTWVzc2FnZSk7XG5cblx0XHR0aGlzLnN0YXR1c0NvZGUgPSBzdGF0dXNDb2RlO1xuXHRcdHRoaXMuc2V2ZXJpdHkgPSBzZXZlcml0eTtcblx0XHR0aGlzLmVycm9yQ29kZSA9IGVycm9yQ29kZTtcblx0XHR0aGlzLmRldGFpbHMgPSBzZXREZWZhdWx0RGV0YWlscyhkZXRhaWxzKTtcblxuXHRcdEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKHRoaXMsIHRoaXMuY29uc3RydWN0b3IpO1xuXHR9XG59XG5cbmV4cG9ydCBjbGFzcyBBcHBFcnJvciBleHRlbmRzIFJvb3RFcnJvciB7XG5cdGNvbnN0cnVjdG9yKFxuXHRcdGVycm9yTWVzc2FnZTogc3RyaW5nLFxuXHRcdHN0YXR1c0NvZGU6IG51bWJlciA9IDUwMCxcblx0XHRzZXZlcml0eTogRXJyb3JTZXZlcml0eVR5cGUgPSBFcnJvclNldmVyaXR5LkZBVEFMLFxuXHRcdGVycm9yQ29kZTogc3RyaW5nID0gRVJST1JfQ09ERVMuQVBQX0VSUk9SLFxuXHRcdGRldGFpbHM6IEVycm9yRGV0YWlscyA9IHt9XG5cdCkge1xuXHRcdHN1cGVyKFxuXHRcdFx0ZXJyb3JNZXNzYWdlLFxuXHRcdFx0c3RhdHVzQ29kZSxcblx0XHRcdHNldmVyaXR5LFxuXHRcdFx0ZXJyb3JDb2RlLFxuXHRcdFx0c2V0RGVmYXVsdERldGFpbHMoZGV0YWlscylcblx0XHQpO1xuXHRcdHRoaXMubmFtZSA9ICdBcHBFcnJvcic7XG5cdH1cbn1cblxuZXhwb3J0IGNsYXNzIENsaWVudEVycm9yIGV4dGVuZHMgUm9vdEVycm9yIHtcblx0Y29uc3RydWN0b3IoXG5cdFx0ZXJyb3JNZXNzYWdlOiBzdHJpbmcsXG5cdFx0c3RhdHVzQ29kZTogbnVtYmVyID0gNDAwLFxuXHRcdHNldmVyaXR5OiBFcnJvclNldmVyaXR5VHlwZSA9IEVycm9yU2V2ZXJpdHkuUkVDT1ZFUkFCTEUsXG5cdFx0ZXJyb3JDb2RlOiBzdHJpbmcgPSBFUlJPUl9DT0RFUy5DTElFTlRfRVJST1IsXG5cdFx0ZGV0YWlsczogRXJyb3JEZXRhaWxzID0ge31cblx0KSB7XG5cdFx0c3VwZXIoXG5cdFx0XHRlcnJvck1lc3NhZ2UsXG5cdFx0XHRzdGF0dXNDb2RlLFxuXHRcdFx0c2V2ZXJpdHksXG5cdFx0XHRlcnJvckNvZGUsXG5cdFx0XHRzZXREZWZhdWx0RGV0YWlscyhkZXRhaWxzKVxuXHRcdCk7XG5cdFx0dGhpcy5uYW1lID0gJ0NsaWVudEVycm9yJztcblx0fVxufVxuXG5leHBvcnQgY29uc3QgZGVmYXVsdFJldHJ5QWZ0ZXIgPSA2MDtcblxuZXhwb3J0IGZ1bmN0aW9uIHNldERlZmF1bHREZXRhaWxzKGRldGFpbHM/OiBFcnJvckRldGFpbHMpOiBFcnJvckRldGFpbHMge1xuXHRyZXR1cm4ge1xuXHRcdC4uLmRldGFpbHMsXG5cdFx0ZXhwb3NlVG9DbGllbnQ6IGRldGFpbHM/LmV4cG9zZVRvQ2xpZW50ID8/IGZhbHNlXG5cdH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVSZXRyeU1lc3NhZ2UocmV0cnlBZnRlcj86IG51bWJlcik6IHN0cmluZyB7XG5cdHJldHVybiByZXRyeUFmdGVyXG5cdFx0PyBgIFBsZWFzZSB0cnkgYWdhaW4gYWZ0ZXIgJHtyZXRyeUFmdGVyfSBzZWNvbmRzLmBcblx0XHQ6ICdQbGVhc2UgdHJ5IGFnYWluIGxhdGVyJztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVF1b3RhRXhjZWVkZWRNZXNzYWdlKFxuXHRxdW90YU5hbWU/OiBzdHJpbmcsXG5cdGxpbWl0PzogbnVtYmVyLFxuXHRyZXRyeUFmdGVyPzogbnVtYmVyXG4pOiBzdHJpbmcge1xuXHRjb25zdCBtZXNzYWdlOiBzdHJpbmcgPSBxdW90YU5hbWUgPyBgJHtxdW90YU5hbWV9IGxpbWl0YCA6ICdMaW1pdCc7XG5cdGNvbnN0IGxpbWl0TWVzc2FnZTogc3RyaW5nID0gbGltaXQgPyBgb2YgJHtsaW1pdH1gIDogJyc7XG5cdGNvbnN0IHJldHJ5TWVzc2FnZSA9IGNyZWF0ZVJldHJ5TWVzc2FnZShyZXRyeUFmdGVyKTtcblxuXHRyZXR1cm4gYCR7bWVzc2FnZX0ke2xpbWl0TWVzc2FnZX0ke3JldHJ5TWVzc2FnZX1gO1xufVxuXG5leHBvcnQgY2xhc3MgQXBwQXV0aGVudGljYXRpb25FcnJvciBleHRlbmRzIEFwcEVycm9yIHtcblx0Y29uc3RydWN0b3IoXG5cdFx0ZXJyb3JNZXNzYWdlOiBzdHJpbmcgPSAnU2VydmVyLXNpZGUgYXV0aGVudGljYXRpb24gZXJyb3InLFxuXHRcdGRldGFpbHM6IEVycm9yRGV0YWlscyA9IHt9XG5cdCkge1xuXHRcdHN1cGVyKFxuXHRcdFx0ZXJyb3JNZXNzYWdlLFxuXHRcdFx0NDAxLFxuXHRcdFx0RXJyb3JTZXZlcml0eS5SRUNPVkVSQUJMRSxcblx0XHRcdEVSUk9SX0NPREVTLkFQUF9BVVRIX0VSUk9SLFxuXHRcdFx0ZGV0YWlsc1xuXHRcdCk7XG5cdFx0dGhpcy5uYW1lID0gJ0FwcEF1dGhlbnRpY2F0aW9uRXJyb3InO1xuXHR9XG59XG5cbmV4cG9ydCBjbGFzcyBBdXRoQ29udHJvbGxlckVycm9yIGV4dGVuZHMgQXBwRXJyb3Ige1xuXHRjb25zdHJ1Y3Rvcihcblx0XHRlcnJvck1lc3NhZ2U6IHN0cmluZyA9ICdBdXRoZW50aWNhdGlvbiBjb250cm9sbGVyIGVycm9yJyxcblx0XHRkZXRhaWxzOiBFcnJvckRldGFpbHMgPSB7fVxuXHQpIHtcblx0XHRzdXBlcihcblx0XHRcdGVycm9yTWVzc2FnZSxcblx0XHRcdDUwMCxcblx0XHRcdEVycm9yU2V2ZXJpdHkuUkVDT1ZFUkFCTEUsXG5cdFx0XHRFUlJPUl9DT0RFUy5BVVRIX0NPTlRST0xMRVJfRVJST1IsXG5cdFx0XHRkZXRhaWxzXG5cdFx0KTtcblx0XHR0aGlzLm5hbWUgPSAnQXV0aENvbnRyb2xsZXJFcnJvcic7XG5cdH1cbn1cblxuZXhwb3J0IGNsYXNzIENhY2hlU2VydmljZUVycm9yIGV4dGVuZHMgQXBwRXJyb3Ige1xuXHRjb25zdHJ1Y3Rvcihcblx0XHRlcnJvck1lc3NhZ2U6IHN0cmluZyA9ICdDYWNoZSBzZXJ2aWNlLWxldmVsIGVycm9yJyxcblx0XHRkZXRhaWxzOiBFcnJvckRldGFpbHMgPSB7fVxuXHQpIHtcblx0XHRzdXBlcihcblx0XHRcdGVycm9yTWVzc2FnZSxcblx0XHRcdDUwMCxcblx0XHRcdEVycm9yU2V2ZXJpdHkuUkVDT1ZFUkFCTEUsXG5cdFx0XHRFUlJPUl9DT0RFUy5DQUNIRV9TRVJWSUNFX0VSUk9SLFxuXHRcdFx0ZGV0YWlsc1xuXHRcdCk7XG5cdFx0dGhpcy5uYW1lID0gJ0NhY2hlU2VydmljZUVycm9yJztcblx0fVxufVxuXG5leHBvcnQgY2xhc3MgQ29uZmlndXJhdGlvbkVycm9yIGV4dGVuZHMgQXBwRXJyb3Ige1xuXHRjb25zdHJ1Y3Rvcihcblx0XHRlcnJvck1lc3NhZ2U6IHN0cmluZyA9ICdJbnRlcm5hbCBzZXJ2ZXIgZXJyb3InLFxuXHRcdGRldGFpbHM6IEVycm9yRGV0YWlscyA9IHt9XG5cdCkge1xuXHRcdHN1cGVyKFxuXHRcdFx0ZXJyb3JNZXNzYWdlLFxuXHRcdFx0NTAwLFxuXHRcdFx0RXJyb3JTZXZlcml0eS5SRUNPVkVSQUJMRSxcblx0XHRcdEVSUk9SX0NPREVTLkNPTkZJR19FUlJPUixcblx0XHRcdGRldGFpbHNcblx0XHQpO1xuXHRcdHRoaXMubmFtZSA9ICdDb25maWd1cmF0aW9uRXJyb3InO1xuXHR9XG59XG5cbmV4cG9ydCBjbGFzcyBDb25maWd1cmF0aW9uRXJyb3JGYXRhbCBleHRlbmRzIEFwcEVycm9yIHtcblx0Y29uc3RydWN0b3IoXG5cdFx0ZXJyb3JNZXNzYWdlOiBzdHJpbmcgPSAnSW50ZXJuYWwgc2VydmVyIGVycm9yJyxcblx0XHRkZXRhaWxzOiBFcnJvckRldGFpbHMgPSB7fVxuXHQpIHtcblx0XHRzdXBlcihcblx0XHRcdGVycm9yTWVzc2FnZSxcblx0XHRcdDUwMCxcblx0XHRcdEVycm9yU2V2ZXJpdHkuRkFUQUwsXG5cdFx0XHRFUlJPUl9DT0RFUy5DT05GSUdfRVJST1JfRkFUQUwsXG5cdFx0XHRkZXRhaWxzXG5cdFx0KTtcblx0XHR0aGlzLm5hbWUgPSAnQ29uZmlndXJhdGlvbkVycm9yRmF0YWwnO1xuXHR9XG59XG5cbmV4cG9ydCBjbGFzcyBDb25jdXJyZW5jeUVycm9yIGV4dGVuZHMgQXBwRXJyb3Ige1xuXHRjb25zdHJ1Y3RvcihyZXNvdXJjZT86IHN0cmluZywgZGV0YWlsczogRXJyb3JEZXRhaWxzID0ge30pIHtcblx0XHRjb25zdCBlcnJvck1lc3NhZ2U6IHN0cmluZyA9IHJlc291cmNlXG5cdFx0XHQ/IGBDb25jdXJyZW5jeSBlcnJvciBvbiByZXNvdXJjZTogJHtyZXNvdXJjZX1gXG5cdFx0XHQ6ICdDb25jdXJyZW5jeSBlcnJvcic7XG5cdFx0Y29uc3QgY3VzdG9tRGV0YWlscyA9IHJlc291cmNlID8geyByZXNvdXJjZSwgLi4uZGV0YWlscyB9IDogZGV0YWlscztcblxuXHRcdHN1cGVyKFxuXHRcdFx0ZXJyb3JNZXNzYWdlLFxuXHRcdFx0NDA5LFxuXHRcdFx0RXJyb3JTZXZlcml0eS5SRUNPVkVSQUJMRSxcblx0XHRcdEVSUk9SX0NPREVTLkNPTkNVUlJFTkNZX0VSUk9SLFxuXHRcdFx0Y3VzdG9tRGV0YWlsc1xuXHRcdCk7XG5cdFx0dGhpcy5uYW1lID0gJ0NvbmN1cnJlbmN5RXJyb3InO1xuXHR9XG59XG5cbmV4cG9ydCBjbGFzcyBDb25mbGljdEVycm9yIGV4dGVuZHMgQXBwRXJyb3Ige1xuXHRjb25zdHJ1Y3RvcihyZXNvdXJjZT86IHN0cmluZywgZGV0YWlsczogRXJyb3JEZXRhaWxzID0ge30pIHtcblx0XHRjb25zdCBlcnJvck1lc3NhZ2U6IHN0cmluZyA9IHJlc291cmNlXG5cdFx0XHQ/IGBDb25mbGljdDogJHtyZXNvdXJjZX0gYWxyZWFkeSBleGlzdHNgXG5cdFx0XHQ6ICdDb25mbGljdDogcmVzb3VyY2UgYWxyZWFkeSBleGlzdHMnO1xuXG5cdFx0Y29uc3QgY3VzdG9tRGV0YWlscyA9IHJlc291cmNlID8geyByZXNvdXJjZSwgLi4uZGV0YWlscyB9IDogZGV0YWlscztcblxuXHRcdHN1cGVyKFxuXHRcdFx0ZXJyb3JNZXNzYWdlLFxuXHRcdFx0NDA5LFxuXHRcdFx0RXJyb3JTZXZlcml0eS5SRUNPVkVSQUJMRSxcblx0XHRcdEVSUk9SX0NPREVTLkNPTkZMSUNUX0VSUk9SLFxuXHRcdFx0Y3VzdG9tRGV0YWlsc1xuXHRcdCk7XG5cdFx0dGhpcy5uYW1lID0gJ0NvbmZsaWN0RXJyb3InO1xuXHR9XG59XG5cbmV4cG9ydCBjbGFzcyBEYXRhYmFzZUVycm9yRmF0YWwgZXh0ZW5kcyBBcHBFcnJvciB7XG5cdGNvbnN0cnVjdG9yKFxuXHRcdGVycm9yTWVzc2FnZTogc3RyaW5nID0gJ0ludGVybmFsIHNlcnZlciBlcnJvcicsXG5cdFx0ZGV0YWlsczogRXJyb3JEZXRhaWxzID0ge31cblx0KSB7XG5cdFx0c3VwZXIoXG5cdFx0XHRlcnJvck1lc3NhZ2UsXG5cdFx0XHQ1MDAsXG5cdFx0XHRFcnJvclNldmVyaXR5LkZBVEFMLFxuXHRcdFx0RVJST1JfQ09ERVMuREJfRVJST1JfRkFUQUwsXG5cdFx0XHRkZXRhaWxzXG5cdFx0KTtcblx0XHR0aGlzLm5hbWUgPSAnRGF0YWJhc2VFcnJvcic7XG5cdH1cbn1cblxuZXhwb3J0IGNsYXNzIERhdGFiYXNlRXJyb3JSZWNvdmVyYWJsZSBleHRlbmRzIEFwcEVycm9yIHtcblx0Y29uc3RydWN0b3IoXG5cdFx0ZXJyb3JNZXNzYWdlOiBzdHJpbmcgPSAnSW50ZXJuYWwgc2VydmVyIGVycm9yLiBQbGVhc2UgdHJ5IGFnYWluIGxhdGVyLicsXG5cdFx0ZGV0YWlsczogRXJyb3JEZXRhaWxzID0ge31cblx0KSB7XG5cdFx0c3VwZXIoXG5cdFx0XHRlcnJvck1lc3NhZ2UsXG5cdFx0XHQ1MDMsXG5cdFx0XHRFcnJvclNldmVyaXR5LlJFQ09WRVJBQkxFLFxuXHRcdFx0RVJST1JfQ09ERVMuREJfRVJST1JfUkVDT1ZFUkFCTEUsXG5cdFx0XHRkZXRhaWxzXG5cdFx0KTtcblx0XHR0aGlzLm5hbWUgPSAnRGF0YWJhc2VFcnJvclJlY292ZXJhYmxlJztcblx0fVxufVxuXG5leHBvcnQgY2xhc3MgRGF0YUludGVncml0eUVycm9yIGV4dGVuZHMgQXBwRXJyb3Ige1xuXHRjb25zdHJ1Y3Rvcihcblx0XHRlcnJvck1lc3NhZ2U6IHN0cmluZyA9ICdJbnRlcm5hbCBzZXJ2ZXIgZXJyb3InLFxuXHRcdGRldGFpbHM6IEVycm9yRGV0YWlscyA9IHt9XG5cdCkge1xuXHRcdHN1cGVyKFxuXHRcdFx0ZXJyb3JNZXNzYWdlLFxuXHRcdFx0NTAwLFxuXHRcdFx0RXJyb3JTZXZlcml0eS5GQVRBTCxcblx0XHRcdEVSUk9SX0NPREVTLkRBVEFfSU5URUdSSVRZX0VSUk9SLFxuXHRcdFx0ZGV0YWlsc1xuXHRcdCk7XG5cdFx0dGhpcy5uYW1lID0gJ0RhdGFJbnRlZ3JpdHlFcnJvcic7XG5cdH1cbn1cblxuZXhwb3J0IGNsYXNzIERlcGVuZGVuY3lFcnJvckZhdGFsIGV4dGVuZHMgQXBwRXJyb3Ige1xuXHRjb25zdHJ1Y3Rvcihcblx0XHRlcnJvck1lc3NhZ2U6IHN0cmluZyA9ICdJbnRlcm5hbCBzZXJ2ZXIgZXJyb3InLFxuXHRcdGRldGFpbHM6IEVycm9yRGV0YWlscyA9IHt9LFxuXHRcdGRlcGVuZGVuY3lOYW1lPzogc3RyaW5nXG5cdCkge1xuXHRcdGNvbnN0IGN1c3RvbURldGFpbHMgPSBkZXBlbmRlbmN5TmFtZVxuXHRcdFx0PyB7IGRlcGVuZGVuY3lOYW1lLCAuLi5kZXRhaWxzIH1cblx0XHRcdDogZGV0YWlscztcblxuXHRcdHN1cGVyKFxuXHRcdFx0ZXJyb3JNZXNzYWdlLFxuXHRcdFx0NTAwLFxuXHRcdFx0RXJyb3JTZXZlcml0eS5GQVRBTCxcblx0XHRcdEVSUk9SX0NPREVTLkRFUEVOREVOQ1lfRVJST1JfRkFUQUwsXG5cdFx0XHRjdXN0b21EZXRhaWxzXG5cdFx0KTtcblx0XHR0aGlzLm5hbWUgPSAnRGVwZW5kZW5jeUVycm9yJztcblx0fVxufVxuXG5leHBvcnQgY2xhc3MgRGVwZW5kZW5jeUVycm9yUmVjb3ZlcmFibGUgZXh0ZW5kcyBBcHBFcnJvciB7XG5cdGNvbnN0cnVjdG9yKFxuXHRcdGVycm9yTWVzc2FnZTogc3RyaW5nID0gJ0ludGVybmFsIHNlcnZlciBlcnJvcicsXG5cdFx0ZGV0YWlsczogRXJyb3JEZXRhaWxzID0ge30sXG5cdFx0ZGVwZW5kZW5jeU5hbWU/OiBzdHJpbmdcblx0KSB7XG5cdFx0Y29uc3QgY3VzdG9tRGV0YWlscyA9IGRlcGVuZGVuY3lOYW1lXG5cdFx0XHQ/IHsgZGVwZW5kZW5jeU5hbWUsIC4uLmRldGFpbHMgfVxuXHRcdFx0OiBkZXRhaWxzO1xuXG5cdFx0c3VwZXIoXG5cdFx0XHRlcnJvck1lc3NhZ2UsXG5cdFx0XHQ1MDAsXG5cdFx0XHRFcnJvclNldmVyaXR5LlJFQ09WRVJBQkxFLFxuXHRcdFx0RVJST1JfQ09ERVMuREVQRU5ERU5DWV9FUlJPUl9SRUNPVkVSQUJMRSxcblx0XHRcdGN1c3RvbURldGFpbHNcblx0XHQpO1xuXHR9XG59XG5cbmV4cG9ydCBjbGFzcyBFeHByZXNzRXJyb3IgZXh0ZW5kcyBBcHBFcnJvciB7XG5cdGNvbnN0cnVjdG9yKFxuXHRcdGVycm9yTWVzc2FnZTogc3RyaW5nID0gJ0ludGVybmFsIHNlcnZlciBlcnJvcicsXG5cdFx0ZGV0YWlsczogRXJyb3JEZXRhaWxzID0ge31cblx0KSB7XG5cdFx0c3VwZXIoXG5cdFx0XHRlcnJvck1lc3NhZ2UsXG5cdFx0XHQ1MDAsXG5cdFx0XHRFcnJvclNldmVyaXR5LlJFQ09WRVJBQkxFIHx8XG5cdFx0XHRcdEVycm9yU2V2ZXJpdHkuV0FSTklORyB8fFxuXHRcdFx0XHRFcnJvclNldmVyaXR5LkZBVEFMLFxuXHRcdFx0RVJST1JfQ09ERVMuRVhQUkVTU19FUlJPUixcblx0XHRcdGRldGFpbHNcblx0XHQpO1xuXHRcdHRoaXMubmFtZSA9ICdFeHByZXNzRXJyb3InO1xuXHR9XG59XG5cbmV4cG9ydCBjbGFzcyBFeHByZXNzUm91dGVFcnJvciBleHRlbmRzIEFwcEVycm9yIHtcblx0Y29uc3RydWN0b3IoXG5cdFx0ZXJyb3JNZXNzYWdlOiBzdHJpbmcgPSAnSW50ZXJuYWwgc2VydmVyIGVycm9yJyxcblx0XHRkZXRhaWxzOiBFcnJvckRldGFpbHMgPSB7fVxuXHQpIHtcblx0XHRzdXBlcihcblx0XHRcdGVycm9yTWVzc2FnZSxcblx0XHRcdDUwMCxcblx0XHRcdEVycm9yU2V2ZXJpdHkuUkVDT1ZFUkFCTEUsXG5cdFx0XHRFUlJPUl9DT0RFUy5FWFBSRVNTX1JPVVRFX0VSUk9SLFxuXHRcdFx0ZGV0YWlsc1xuXHRcdCk7XG5cblx0XHR0aGlzLm5hbWUgPSAnRXhwcmVzc1JvdXRlRXJyb3InO1xuXHR9XG59XG5cbmV4cG9ydCBjbGFzcyBFeHRlcm5hbFNlcnZpY2VFcnJvckZhdGFsIGV4dGVuZHMgQXBwRXJyb3Ige1xuXHRjb25zdHJ1Y3Rvcihcblx0XHRlcnJvck1lc3NhZ2UgPSAnU2VydmljZSB1bmF2YWlsYWJsZScsXG5cdFx0ZGV0YWlsczogRXJyb3JEZXRhaWxzID0ge31cblx0KSB7XG5cdFx0c3VwZXIoXG5cdFx0XHRlcnJvck1lc3NhZ2UsXG5cdFx0XHQ1MDMsXG5cdFx0XHRFcnJvclNldmVyaXR5LkZBVEFMLFxuXHRcdFx0RVJST1JfQ09ERVMuRVhURVJOQUxfU0VSVklDRV9FUlJPUl9GQVRBTCxcblx0XHRcdGRldGFpbHNcblx0XHQpO1xuXHRcdHRoaXMubmFtZSA9ICdFeHRlcm5hbFNlcnZpY2VFcnJvckZhdGFsJztcblx0fVxufVxuXG5leHBvcnQgY2xhc3MgRmFsbGJhY2tTdWNjZXNzSW5mbyBleHRlbmRzIEFwcEVycm9yIHtcblx0Y29uc3RydWN0b3Ioc2VydmljZT86IHN0cmluZywgZGV0YWlsczogRXJyb3JEZXRhaWxzID0ge30pIHtcblx0XHRjb25zdCBlcnJvck1lc3NhZ2U6IHN0cmluZyA9IHNlcnZpY2Vcblx0XHRcdD8gYFN1Y2Nlc3NmdWxseSBmZWxsIGJhY2sgdG8gJHtzZXJ2aWNlfWBcblx0XHRcdDogJ1N1Y2Nlc3NmdWxseSBmZWxsIGJhY2sgdG8gYW5vdGhlciBzZXJ2aWNlJztcblx0XHRjb25zdCBjdXN0b21EZXRhaWxzID0gc2VydmljZSA/IHsgc2VydmljZSwgLi4uZGV0YWlscyB9IDogZGV0YWlscztcblxuXHRcdHN1cGVyKFxuXHRcdFx0ZXJyb3JNZXNzYWdlLFxuXHRcdFx0MjAwLFxuXHRcdFx0RXJyb3JTZXZlcml0eS5JTkZPLFxuXHRcdFx0RVJST1JfQ09ERVMuRkFMTEJBQ0tfU1VDQ0VTUyxcblx0XHRcdGN1c3RvbURldGFpbHNcblx0XHQpO1xuXG5cdFx0dGhpcy5uYW1lID0gJ0ZhbGxiYWNrU3VjY2Vzc0luZm8nO1xuXHR9XG59XG5cbmV4cG9ydCBjbGFzcyBIZWFsdGhDaGVja0Vycm9yIGV4dGVuZHMgQXBwRXJyb3Ige1xuXHRjb25zdHJ1Y3Rvcihcblx0XHRlcnJvck1lc3NhZ2U6IHN0cmluZyA9ICdIZWFsdGggY2hlY2sgZXJyb3InLFxuXHRcdGRldGFpbHM6IEVycm9yRGV0YWlscyA9IHt9XG5cdCkge1xuXHRcdHN1cGVyKFxuXHRcdFx0ZXJyb3JNZXNzYWdlLFxuXHRcdFx0NTAwLFxuXHRcdFx0RXJyb3JTZXZlcml0eS5SRUNPVkVSQUJMRSxcblx0XHRcdEVSUk9SX0NPREVTLkhFQUxUSF9DSEVDS19FUlJPUixcblx0XHRcdGRldGFpbHNcblx0XHQpO1xuXG5cdFx0dGhpcy5uYW1lID0gJ0hlYWx0aENoZWNrRXJyb3InO1xuXHR9XG59XG5cbmV4cG9ydCBjbGFzcyBIVFRQU0NsaWVudEVycm9yRmF0YWwgZXh0ZW5kcyBBcHBFcnJvciB7XG5cdGNvbnN0cnVjdG9yKFxuXHRcdGVycm9yTWVzc2FnZTogc3RyaW5nID0gJ0hUVFBTIENsaWVudCBFcnJvciAoZmF0YWwpJyxcblx0XHRkZXRhaWxzOiBFcnJvckRldGFpbHMgPSB7fVxuXHQpIHtcblx0XHRzdXBlcihcblx0XHRcdGVycm9yTWVzc2FnZSxcblx0XHRcdDUwMCxcblx0XHRcdEVycm9yU2V2ZXJpdHkuRkFUQUwsXG5cdFx0XHRFUlJPUl9DT0RFUy5IVFRQU19DTElFTlRfRVJST1JfRkFMLFxuXHRcdFx0ZGV0YWlsc1xuXHRcdCk7XG5cblx0XHR0aGlzLm5hbWUgPSAnSFRUUFNDbGllbnRFcnJvckZhdGFsJztcblx0fVxufVxuXG5leHBvcnQgY2xhc3MgSFRUUFNTZXJ2ZXJFcnJvclJlY292ZXJhYmxlIGV4dGVuZHMgQXBwRXJyb3Ige1xuXHRjb25zdHJ1Y3Rvcihcblx0XHRlcnJvck1lc3NhZ2U6IHN0cmluZyA9ICdIVFRQUyBTZXJ2ZXIgRXJyb3IgKHJlY292ZXJhYmxlKScsXG5cdFx0ZGV0YWlsczogRXJyb3JEZXRhaWxzID0ge31cblx0KSB7XG5cdFx0c3VwZXIoXG5cdFx0XHRlcnJvck1lc3NhZ2UsXG5cdFx0XHQ1MDAsXG5cdFx0XHRFcnJvclNldmVyaXR5LlJFQ09WRVJBQkxFLFxuXHRcdFx0RVJST1JfQ09ERVMuSFRUUFNfU0VSVkVSX0VSUk9SX1JFQ09WRVJBQkxFLFxuXHRcdFx0ZGV0YWlsc1xuXHRcdCk7XG5cblx0XHR0aGlzLm5hbWUgPSAnSFRUUFNTZXJ2ZXJFcnJvclJlY292ZXJhYmxlJztcblx0fVxufVxuXG5leHBvcnQgY2xhc3MgSW5zdWZmaWNpZW50U3RvcmFnZUVycm9yIGV4dGVuZHMgQXBwRXJyb3Ige1xuXHRjb25zdHJ1Y3Rvcihcblx0XHRyZXF1aXJlZFNwYWNlPzogbnVtYmVyLFxuXHRcdGF2YWlsYWJsZVNwYWNlPzogbnVtYmVyLFxuXHRcdGRldGFpbHM6IEVycm9yRGV0YWlscyA9IHt9XG5cdCkge1xuXHRcdGNvbnN0IGVycm9yTWVzc2FnZSA9IFtcblx0XHRcdCdJbnN1ZmZpY2llbnQgc3RvcmFnZS4nLFxuXHRcdFx0cmVxdWlyZWRTcGFjZSA/IGBSZXF1aXJlZDogJHtyZXF1aXJlZFNwYWNlfU1CYCA6IG51bGwsXG5cdFx0XHRhdmFpbGFibGVTcGFjZSA/IGBBdmFpbGFibGU6ICR7YXZhaWxhYmxlU3BhY2V9TUJgIDogbnVsbFxuXHRcdF1cblx0XHRcdC5maWx0ZXIoQm9vbGVhbilcblx0XHRcdC5qb2luKCcsICcpO1xuXG5cdFx0Y29uc3QgZXJyb3JEZXRhaWxzOiBFcnJvckRldGFpbHMgPSB7XG5cdFx0XHQuLi4ocmVxdWlyZWRTcGFjZSAhPT0gdW5kZWZpbmVkID8geyByZXF1aXJlZFNwYWNlIH0gOiB7fSksXG5cdFx0XHQuLi4oYXZhaWxhYmxlU3BhY2UgIT09IHVuZGVmaW5lZCA/IHsgYXZhaWxhYmxlU3BhY2UgfSA6IHt9KSxcblx0XHRcdC4uLmRldGFpbHNcblx0XHR9O1xuXG5cdFx0c3VwZXIoXG5cdFx0XHRlcnJvck1lc3NhZ2UsXG5cdFx0XHQ1MDcsXG5cdFx0XHRFcnJvclNldmVyaXR5LkZBVEFMLFxuXHRcdFx0RVJST1JfQ09ERVMuSU5TVUZGSUNJRU5UX1NUT1JBR0UsXG5cdFx0XHRlcnJvckRldGFpbHNcblx0XHQpO1xuXG5cdFx0dGhpcy5uYW1lID0gJ0luc3VmZmljaWVudFN0b3JhZ2VFcnJvcic7XG5cdH1cbn1cblxuZXhwb3J0IGNsYXNzIEludmFsaWRDb25maWd1cmF0aW9uRXJyb3IgZXh0ZW5kcyBBcHBFcnJvciB7XG5cdGNvbnN0cnVjdG9yKGNvbmZpZ0tleT86IHN0cmluZywgZGV0YWlsczogRXJyb3JEZXRhaWxzID0ge30pIHtcblx0XHRjb25zdCBlcnJvck1lc3NhZ2U6IHN0cmluZyA9IGNvbmZpZ0tleVxuXHRcdFx0PyBgSW52YWxpZCBvciBtaXNzaW5nIGNvbmZpZ3VyYXRpb24gZm9yICR7Y29uZmlnS2V5fWBcblx0XHRcdDogJ0ludmFsaWQgb3IgbWlzc2luZyBjb25maWd1cmF0aW9uJztcblxuXHRcdGNvbnN0IGN1c3RvbURldGFpbHMgPSBjb25maWdLZXkgPyB7IGNvbmZpZ0tleSwgLi4uZGV0YWlscyB9IDogZGV0YWlscztcblxuXHRcdHN1cGVyKFxuXHRcdFx0ZXJyb3JNZXNzYWdlLFxuXHRcdFx0NTAwLFxuXHRcdFx0RXJyb3JTZXZlcml0eS5GQVRBTCxcblx0XHRcdEVSUk9SX0NPREVTLklOVkFMSURfQ09ORklHLFxuXHRcdFx0Y3VzdG9tRGV0YWlsc1xuXHRcdCk7XG5cblx0XHR0aGlzLm5hbWUgPSAnSW52YWxpZENvbmZpZ3VyYXRpb25FcnJvcic7XG5cdH1cbn1cblxuZXhwb3J0IGNsYXNzIE1pZGRsZXdhcmVTZXJ2aWNlRXJyb3IgZXh0ZW5kcyBBcHBFcnJvciB7XG5cdGNvbnN0cnVjdG9yKFxuXHRcdGVycm9yTWVzc2FnZTogc3RyaW5nID0gJ01pZGRsZXdhcmUgU2VydmljZSBlcnJvcicsXG5cdFx0ZGV0YWlsczogRXJyb3JEZXRhaWxzID0ge31cblx0KSB7XG5cdFx0c3VwZXIoXG5cdFx0XHRlcnJvck1lc3NhZ2UsXG5cdFx0XHQ1MDAsXG5cdFx0XHRFcnJvclNldmVyaXR5LlJFQ09WRVJBQkxFLFxuXHRcdFx0RVJST1JfQ09ERVMuTUlERExFV0FSRV9TRVJWSUNFX0VSUk9SLFxuXHRcdFx0ZGV0YWlsc1xuXHRcdCk7XG5cblx0XHR0aGlzLm5hbWUgPSAnQ2FjaGVTZXJ2aWNlRXJyb3InO1xuXHR9XG59XG5cbmV4cG9ydCBjbGFzcyBNaXNzaW5nUmVzb3VyY2VFcnJvciBleHRlbmRzIEFwcEVycm9yIHtcblx0Y29uc3RydWN0b3IocmVzb3VyY2U/OiBzdHJpbmcsIGRldGFpbHM6IEVycm9yRGV0YWlscyA9IHt9KSB7XG5cdFx0Y29uc3QgZXJyb3JNZXNzYWdlOiBzdHJpbmcgPSByZXNvdXJjZVxuXHRcdFx0PyBgJHtyZXNvdXJjZX0gbm90IGZvdW5kYFxuXHRcdFx0OiAnUmVzb3VyY2Ugbm90IGZvdW5kJztcblxuXHRcdGNvbnN0IGN1c3RvbURldGFpbHMgPSByZXNvdXJjZSA/IHsgcmVzb3VyY2UsIC4uLmRldGFpbHMgfSA6IGRldGFpbHM7XG5cblx0XHRzdXBlcihcblx0XHRcdGVycm9yTWVzc2FnZSxcblx0XHRcdDQwNCxcblx0XHRcdEVycm9yU2V2ZXJpdHkuUkVDT1ZFUkFCTEUsXG5cdFx0XHRFUlJPUl9DT0RFUy5NSVNTSU5HX1JFU09VUkNFLFxuXHRcdFx0Y3VzdG9tRGV0YWlsc1xuXHRcdCk7XG5cblx0XHR0aGlzLm5hbWUgPSAnTWlzc2luZ1Jlc291cmNlRXJyb3InO1xuXHR9XG59XG5cbmV4cG9ydCBjbGFzcyBQYXNzcG9ydEF1dGhTZXJ2aWNlRXJyb3IgZXh0ZW5kcyBBcHBFcnJvciB7XG5cdGNvbnN0cnVjdG9yKFxuXHRcdGVycm9yTWVzc2FnZTogc3RyaW5nID0gJ1Bhc3Nwb3J0IEF1dGggU2VydmljZSBlcnJvcicsXG5cdFx0ZGV0YWlsczogRXJyb3JEZXRhaWxzID0ge31cblx0KSB7XG5cdFx0c3VwZXIoXG5cdFx0XHRlcnJvck1lc3NhZ2UsXG5cdFx0XHQ1MDAsXG5cdFx0XHRFcnJvclNldmVyaXR5LlJFQ09WRVJBQkxFLFxuXHRcdFx0RVJST1JfQ09ERVMuUEFTU1BPUlRfQVVUSF9TRVJWSUNFX0VSUk9SLFxuXHRcdFx0ZGV0YWlsc1xuXHRcdCk7XG5cblx0XHR0aGlzLm5hbWUgPSAnUGFzc3BvcnRBdXRoU2VydmljZUVycm9yJztcblx0fVxufVxuXG5leHBvcnQgY2xhc3MgUGFydGlhbFNlcnZpY2VGYWlsdXJlV2FybmluZyBleHRlbmRzIEFwcEVycm9yIHtcblx0Y29uc3RydWN0b3Ioc2VydmljZU5hbWU/OiBzdHJpbmcsIGRldGFpbHM6IEVycm9yRGV0YWlscyA9IHt9KSB7XG5cdFx0Y29uc3QgZXJyb3JNZXNzYWdlOiBzdHJpbmcgPSBzZXJ2aWNlTmFtZVxuXHRcdFx0PyBgJHtzZXJ2aWNlTmFtZX0gaXMgY3VycmVudGx5IGV4cGVyaWVuY2luZyBpc3N1ZXMuIFBsZWFzZSB0cnkgYWdhaW4gbGF0ZXIuYFxuXHRcdFx0OiAnU2VydmljZSBpcyBjdXJyZW50bHkgZXhwZXJpZW5jaW5nIGlzc3Vlcy4gUGxlYXNlIHRyeSBhZ2FpbiBsYXRlci4nO1xuXG5cdFx0Y29uc3QgY3VzdG9tRGV0YWlscyA9IHNlcnZpY2VOYW1lXG5cdFx0XHQ/IHsgc2VydmljZU5hbWUsIC4uLmRldGFpbHMgfVxuXHRcdFx0OiBkZXRhaWxzO1xuXHRcdHN1cGVyKFxuXHRcdFx0ZXJyb3JNZXNzYWdlLFxuXHRcdFx0NTAzLFxuXHRcdFx0RXJyb3JTZXZlcml0eS5XQVJOSU5HLFxuXHRcdFx0RVJST1JfQ09ERVMuUEFSVElBTF9TRVJWSUNFX0ZBSUxVUkUsXG5cdFx0XHRjdXN0b21EZXRhaWxzXG5cdFx0KTtcblxuXHRcdHRoaXMubmFtZSA9ICdQYXJ0aWFsU2VydmljZUZhaWx1cmVXYXJuaW5nJztcblx0fVxufVxuXG5leHBvcnQgY2xhc3MgUXVvdGFFeGNlZWRlZEVycm9yRmF0YWwgZXh0ZW5kcyBBcHBFcnJvciB7XG5cdGNvbnN0cnVjdG9yKFxuXHRcdHJldHJ5QWZ0ZXI6IG51bWJlciA9IGRlZmF1bHRSZXRyeUFmdGVyLFxuXHRcdHF1b3RhTmFtZT86IHN0cmluZyxcblx0XHRsaW1pdD86IG51bWJlcixcblx0XHRkZXRhaWxzOiBFcnJvckRldGFpbHMgPSB7fVxuXHQpIHtcblx0XHRjb25zdCBlcnJvck1lc3NhZ2U6IHN0cmluZyA9IGNyZWF0ZVF1b3RhRXhjZWVkZWRNZXNzYWdlKFxuXHRcdFx0cXVvdGFOYW1lLFxuXHRcdFx0bGltaXQsXG5cdFx0XHRyZXRyeUFmdGVyXG5cdFx0KTtcblxuXHRcdGNvbnN0IGVycm9yRGV0YWlsczogRXJyb3JEZXRhaWxzID0ge1xuXHRcdFx0Li4uKHF1b3RhTmFtZSA/IHsgcXVvdGFOYW1lIH0gOiB7fSksXG5cdFx0XHQuLi4obGltaXQgIT09IHVuZGVmaW5lZCA/IHsgbGltaXQgfSA6IHt9KSxcblx0XHRcdC4uLihyZXRyeUFmdGVyID8geyByZXRyeUFmdGVyIH0gOiB7fSksXG5cdFx0XHQuLi5kZXRhaWxzXG5cdFx0fTtcblxuXHRcdHN1cGVyKFxuXHRcdFx0ZXJyb3JNZXNzYWdlLFxuXHRcdFx0NTAwLFxuXHRcdFx0RXJyb3JTZXZlcml0eS5GQVRBTCxcblx0XHRcdEVSUk9SX0NPREVTLlFVT1RBX0VYQ0VFREVEX0ZBVEFMLFxuXHRcdFx0ZXJyb3JEZXRhaWxzXG5cdFx0KTtcblxuXHRcdHRoaXMubmFtZSA9ICdRdW90YUV4Y2VlZGVkRXJyb3InO1xuXHR9XG59XG5cbmV4cG9ydCBjbGFzcyBSYXRlTGltaXRFcnJvckZhdGFsIGV4dGVuZHMgQXBwRXJyb3Ige1xuXHRjb25zdHJ1Y3Rvcihcblx0XHRyZXRyeUFmdGVyOiBudW1iZXIgPSBkZWZhdWx0UmV0cnlBZnRlcixcblx0XHRkZXRhaWxzOiBFcnJvckRldGFpbHMgPSB7fVxuXHQpIHtcblx0XHRjb25zdCBtZXNzYWdlOiBzdHJpbmcgPSAnUmF0ZSBsaW1pdCBleGNlZWRlZCAoZmF0YWwgZXhjZXB0aW9uKS4nO1xuXHRcdGNvbnN0IHJldHJ5TWVzc2FnZTogc3RyaW5nID0gY3JlYXRlUmV0cnlNZXNzYWdlKHJldHJ5QWZ0ZXIpO1xuXHRcdGNvbnN0IGVycm9yTWVzc2FnZSA9IGAke21lc3NhZ2V9JHtyZXRyeU1lc3NhZ2V9YC50cmltKCk7XG5cblx0XHRjb25zdCBjdXN0b21EZXRhaWxzID0gcmV0cnlBZnRlciA/IHsgcmV0cnlBZnRlciwgLi4uZGV0YWlscyB9IDogZGV0YWlscztcblxuXHRcdHN1cGVyKFxuXHRcdFx0ZXJyb3JNZXNzYWdlLFxuXHRcdFx0NDI5LFxuXHRcdFx0RXJyb3JTZXZlcml0eS5GQVRBTCxcblx0XHRcdEVSUk9SX0NPREVTLlJBVEVfTElNSVRfRVhDRUVERURfRkFUQUwsXG5cdFx0XHRjdXN0b21EZXRhaWxzXG5cdFx0KTtcblxuXHRcdHRoaXMubmFtZSA9ICdSYXRlTGltaXRFcnJvckZhdGFsJztcblx0fVxufVxuXG5leHBvcnQgY2xhc3MgUmVkaXNTZXJ2aWNlRXJyb3IgZXh0ZW5kcyBBcHBFcnJvciB7XG5cdGNvbnN0cnVjdG9yKFxuXHRcdGVycm9yTWVzc2FnZTogc3RyaW5nID0gJ1JlZGlzIFNlcnZpY2UgZXJyb3InLFxuXHRcdGRldGFpbHM6IEVycm9yRGV0YWlscyA9IHt9XG5cdCkge1xuXHRcdHN1cGVyKFxuXHRcdFx0ZXJyb3JNZXNzYWdlLFxuXHRcdFx0NTAwLFxuXHRcdFx0RXJyb3JTZXZlcml0eS5SRUNPVkVSQUJMRSxcblx0XHRcdEVSUk9SX0NPREVTLlJFRElTX1NFUlZJQ0VfRVJST1IsXG5cdFx0XHRkZXRhaWxzXG5cdFx0KTtcblxuXHRcdHRoaXMubmFtZSA9ICdDYWNoZVNlcnZpY2VFcnJvcic7XG5cdH1cbn1cblxuZXhwb3J0IGNsYXNzIFJlc291cmNlTWFuYWdlckVycm9yIGV4dGVuZHMgQXBwRXJyb3Ige1xuXHRjb25zdHJ1Y3Rvcihcblx0XHRlcnJvck1lc3NhZ2U6IHN0cmluZyA9ICdSZXNvdXJjZSBNYW5hZ2VyIGVycm9yJyxcblx0XHRkZXRhaWxzOiBFcnJvckRldGFpbHMgPSB7fVxuXHQpIHtcblx0XHRzdXBlcihcblx0XHRcdGVycm9yTWVzc2FnZSxcblx0XHRcdDUwMCxcblx0XHRcdEVycm9yU2V2ZXJpdHkuUkVDT1ZFUkFCTEUsXG5cdFx0XHRFUlJPUl9DT0RFUy5SRURJU19TRVJWSUNFX0VSUk9SLFxuXHRcdFx0ZGV0YWlsc1xuXHRcdCk7XG5cblx0XHR0aGlzLm5hbWUgPSAnQ2FjaGVTZXJ2aWNlRXJyb3InO1xuXHR9XG59XG5cbmV4cG9ydCBjbGFzcyBSb290TWlkZGxld2FyZUVycm9yIGV4dGVuZHMgQXBwRXJyb3Ige1xuXHRjb25zdHJ1Y3Rvcihcblx0XHRlcnJvck1lc3NhZ2U6IHN0cmluZyA9ICdSb290IG1pZGRsZXdhcmUgZXJyb3InLFxuXHRcdGRldGFpbHM6IEVycm9yRGV0YWlscyA9IHt9XG5cdCkge1xuXHRcdHN1cGVyKFxuXHRcdFx0ZXJyb3JNZXNzYWdlLFxuXHRcdFx0NTAwLFxuXHRcdFx0RXJyb3JTZXZlcml0eS5XQVJOSU5HIHx8IEVycm9yU2V2ZXJpdHkuRkFUQUwsXG5cdFx0XHRFUlJPUl9DT0RFUy5ST09UX01JRERMRVdBUkVfRVJST1IsXG5cdFx0XHRkZXRhaWxzXG5cdFx0KTtcblxuXHRcdHRoaXMubmFtZSA9ICdSb290TWlkZGxld2FyZUVycm9yJztcblx0fVxufVxuXG5leHBvcnQgY2xhc3MgU2VydmVyTm90SW5pdGlhbGl6ZWRFcnJvciBleHRlbmRzIEFwcEVycm9yIHtcblx0Y29uc3RydWN0b3IoXG5cdFx0ZXJyb3JNZXNzYWdlOiBzdHJpbmcgPSAnSFRUUFMgU2VydmVyIGlzIG5vdCBpbml0aWFsaXplZCcsXG5cdFx0ZGV0YWlsczogRXJyb3JEZXRhaWxzID0ge31cblx0KSB7XG5cdFx0c3VwZXIoXG5cdFx0XHRlcnJvck1lc3NhZ2UsXG5cdFx0XHQ1MDAsXG5cdFx0XHRFcnJvclNldmVyaXR5LldBUk5JTkcsXG5cdFx0XHRFUlJPUl9DT0RFUy5TRVJWRVJfTk9UX0lOSVRJQUxJWkVEX0VSUk9SLFxuXHRcdFx0ZGV0YWlsc1xuXHRcdCk7XG5cblx0XHR0aGlzLm5hbWUgPSAnUm9vdE1pZGRsZXdhcmVFcnJvcic7XG5cdH1cbn1cblxuZXhwb3J0IGNsYXNzIFNlcnZpY2VEZWdyYWRlZEVycm9yIGV4dGVuZHMgQXBwRXJyb3Ige1xuXHRjb25zdHJ1Y3RvcihzZXJ2aWNlPzogc3RyaW5nLCBkZXRhaWxzOiBFcnJvckRldGFpbHMgPSB7fSkge1xuXHRcdGNvbnN0IGVycm9yTWVzc2FnZTogc3RyaW5nID0gc2VydmljZVxuXHRcdFx0PyBgJHtzZXJ2aWNlfSBpcyBjdXJyZW50bHkgZGVncmFkZWRgXG5cdFx0XHQ6ICdTZXJ2aWNlIGlzIGN1cnJlbnRseSBkZWdyYWRlZCc7XG5cblx0XHRjb25zdCBjdXN0b21EZXRhaWxzID0gc2VydmljZSA/IHsgc2VydmljZSwgLi4uZGV0YWlscyB9IDogZGV0YWlscztcblxuXHRcdHN1cGVyKFxuXHRcdFx0ZXJyb3JNZXNzYWdlLFxuXHRcdFx0MjAwLFxuXHRcdFx0RXJyb3JTZXZlcml0eS5XQVJOSU5HLFxuXHRcdFx0RVJST1JfQ09ERVMuU0VSVklDRV9ERUdSQURFRCxcblx0XHRcdGN1c3RvbURldGFpbHNcblx0XHQpO1xuXG5cdFx0dGhpcy5uYW1lID0gJ1NlcnZpY2VEZWdyYWRlZEVycm9yJztcblx0fVxufVxuXG5leHBvcnQgY2xhc3MgU2VydmljZURlZ3JhZGVkRXJyb3JNaW5vciBleHRlbmRzIEFwcEVycm9yIHtcblx0Y29uc3RydWN0b3Ioc2VydmljZTogc3RyaW5nLCBkZXRhaWxzOiBFcnJvckRldGFpbHMgPSB7fSkge1xuXHRcdGNvbnN0IGVycm9yTWVzc2FnZTogc3RyaW5nID0gc2VydmljZVxuXHRcdFx0PyBgJHtzZXJ2aWNlfSBpcyBjdXJyZW50bHkgZGVncmFkZWQgKG1pbm9yKWBcblx0XHRcdDogJ1NlcnZpY2UgaXMgY3VycmVudGx5IGRlZ3JhZGVkIChtaW5vciknO1xuXG5cdFx0Y29uc3QgY3VzdG9tRGV0YWlscyA9IHNlcnZpY2UgPyB7IHNlcnZpY2UsIC4uLmRldGFpbHMgfSA6IGRldGFpbHM7XG5cblx0XHRzdXBlcihcblx0XHRcdGVycm9yTWVzc2FnZSxcblx0XHRcdDIwMCxcblx0XHRcdEVycm9yU2V2ZXJpdHkuSU5GTyxcblx0XHRcdEVSUk9SX0NPREVTLlNFUlZJQ0VfREVHUkFERURfTUlOT1IsXG5cdFx0XHRjdXN0b21EZXRhaWxzXG5cdFx0KTtcblxuXHRcdHRoaXMubmFtZSA9ICdTZXJ2aWNlRGVncmFkZWRFcnJvck1pbm9yJztcblx0fVxufVxuXG5leHBvcnQgY2xhc3MgU2VydmljZVVuYXZhaWxhYmxlRXJyb3IgZXh0ZW5kcyBBcHBFcnJvciB7XG5cdGNvbnN0cnVjdG9yKFxuXHRcdHJldHJ5QWZ0ZXI6IG51bWJlciA9IGRlZmF1bHRSZXRyeUFmdGVyLFxuXHRcdHNlcnZpY2U/OiBzdHJpbmcsXG5cdFx0ZGV0YWlsczogRXJyb3JEZXRhaWxzID0ge31cblx0KSB7XG5cdFx0Y29uc3QgbWVzc2FnZTogc3RyaW5nID0gc2VydmljZVxuXHRcdFx0PyBgJHtzZXJ2aWNlfSBpcyBjdXJyZW50bHkgdW5hdmFpbGFibGVgXG5cdFx0XHQ6ICdTZXJ2aWNlIGlzIGN1cnJlbnRseSB1bmF2YWlsYWJsZSc7XG5cblx0XHRjb25zdCByZXRyeU1lc3NhZ2U6IHN0cmluZyA9IHJldHJ5QWZ0ZXJcblx0XHRcdD8gYCBQbGVhc2UgdHJ5IGFnYWluIGFmdGVyICR7cmV0cnlBZnRlcn0gc2Vjb25kcy5gXG5cdFx0XHQ6ICcgUGxlYXNlIHRyeSBhZ2FpbiBsYXRlci4nO1xuXG5cdFx0Y29uc3QgZXJyb3JNZXNzYWdlID0gYCR7bWVzc2FnZX0gJHtyZXRyeU1lc3NhZ2V9YC50cmltKCk7XG5cblx0XHRjb25zdCBlcnJvckRldGFpbHM6IEVycm9yRGV0YWlscyA9IHtcblx0XHRcdC4uLihyZXRyeUFmdGVyICE9PSB1bmRlZmluZWQgPyB7IHJldHJ5QWZ0ZXIgfSA6IHt9KSxcblx0XHRcdC4uLihzZXJ2aWNlICE9PSB1bmRlZmluZWQgPyB7IHNlcnZpY2UgfSA6IHt9KSxcblx0XHRcdC4uLmRldGFpbHNcblx0XHR9O1xuXG5cdFx0c3VwZXIoXG5cdFx0XHRlcnJvck1lc3NhZ2UsXG5cdFx0XHQ1MDMsXG5cdFx0XHRFcnJvclNldmVyaXR5LlJFQ09WRVJBQkxFLFxuXHRcdFx0RVJST1JfQ09ERVMuU0VSVklDRV9VTkFWQUlMQUJMRSxcblx0XHRcdGVycm9yRGV0YWlsc1xuXHRcdCk7XG5cblx0XHR0aGlzLm5hbWUgPSAnU2VydmljZVVuYXZhaWxhYmxlRXJyb3InO1xuXHR9XG59XG5cbmV4cG9ydCBjbGFzcyBTZXJ2aWNlVW5hdmFpbGFibGVFcnJvckZhdGFsIGV4dGVuZHMgQXBwRXJyb3Ige1xuXHRjb25zdHJ1Y3RvcihzZXJ2aWNlPzogc3RyaW5nLCBkZXRhaWxzOiBFcnJvckRldGFpbHMgPSB7fSkge1xuXHRcdGNvbnN0IGVycm9yTWVzc2FnZTogc3RyaW5nID0gc2VydmljZVxuXHRcdFx0PyBgJHtzZXJ2aWNlfSBpcyBjdXJyZW50bHkgdW5hdmFpbGFibGUgKGZhdGFsIGV4Y2VwdGlvbilgXG5cdFx0XHQ6ICdTZXJ2aWNlIGlzIGN1cnJlbnRseSB1bmF2YWlsYWJsZSAoZmF0YWwgZXhjZXB0aW9uKSc7XG5cblx0XHRjb25zdCBlcnJvckRldGFpbHM6IEVycm9yRGV0YWlscyA9IHtcblx0XHRcdC4uLihzZXJ2aWNlICE9PSB1bmRlZmluZWQgPyB7IHNlcnZpY2UgfSA6IHt9KSxcblx0XHRcdC4uLmRldGFpbHNcblx0XHR9O1xuXG5cdFx0c3VwZXIoXG5cdFx0XHRlcnJvck1lc3NhZ2UsXG5cdFx0XHQ1MDMsXG5cdFx0XHRFcnJvclNldmVyaXR5LkZBVEFMLFxuXHRcdFx0RVJST1JfQ09ERVMuU0VSVklDRV9VTkFWQUlMQUJMRSxcblx0XHRcdGVycm9yRGV0YWlsc1xuXHRcdCk7XG5cblx0XHR0aGlzLm5hbWUgPSAnU2VydmljZVVuYXZhaWxhYmxlRXJyb3JGYXRhbCc7XG5cdH1cbn1cblxuZXhwb3J0IGNsYXNzIFNsb3dBcGlXYXJuaW5nIGV4dGVuZHMgQXBwRXJyb3Ige1xuXHRjb25zdHJ1Y3Rvcihcblx0XHRhcGlOYW1lPzogc3RyaW5nLFxuXHRcdHJlc3BvbnNlVGltZT86IG51bWJlcixcblx0XHRkZXRhaWxzOiBFcnJvckRldGFpbHMgPSB7fVxuXHQpIHtcblx0XHRjb25zdCBlcnJvck1lc3NhZ2UgPSBbXG5cdFx0XHRhcGlOYW1lXG5cdFx0XHRcdD8gYCR7YXBpTmFtZX0gaXMgcmVzcG9uZGluZyBzbG93bHlgXG5cdFx0XHRcdDogJ0FQSSBpcyByZXNwb25kaW5nIHNsb3dseS4nLFxuXHRcdFx0cmVzcG9uc2VUaW1lID8gYCBSZXNwb25zZSB0aW1lOiAke3Jlc3BvbnNlVGltZX1tc2AgOiBudWxsXG5cdFx0XVxuXHRcdFx0LmZpbHRlcihCb29sZWFuKVxuXHRcdFx0LmpvaW4oJycpO1xuXG5cdFx0Y29uc3QgZXJyb3JEZXRhaWxzOiBFcnJvckRldGFpbHMgPSB7XG5cdFx0XHQuLi4oYXBpTmFtZSAhPT0gdW5kZWZpbmVkID8geyBhcGlOYW1lIH0gOiB7fSksXG5cdFx0XHQuLi4ocmVzcG9uc2VUaW1lICE9PSB1bmRlZmluZWQgPyB7IHJlc3BvbnNlVGltZSB9IDoge30pLFxuXHRcdFx0Li4uZGV0YWlsc1xuXHRcdH07XG5cblx0XHRzdXBlcihcblx0XHRcdGVycm9yTWVzc2FnZSxcblx0XHRcdDIwMCxcblx0XHRcdEVycm9yU2V2ZXJpdHkuV0FSTklORyxcblx0XHRcdEVSUk9SX0NPREVTLlNMT1dfQVBJX1dBUk5JTkcsXG5cdFx0XHRlcnJvckRldGFpbHNcblx0XHQpO1xuXG5cdFx0dGhpcy5uYW1lID0gJ1Nsb3dBcGlXYXJuaW5nJztcblx0fVxufVxuXG5leHBvcnQgY2xhc3MgVXNlckFjdGlvbkluZm8gZXh0ZW5kcyBBcHBFcnJvciB7XG5cdGNvbnN0cnVjdG9yKGFjdGlvbj86IHN0cmluZywgZGV0YWlsczogRXJyb3JEZXRhaWxzID0ge30pIHtcblx0XHRjb25zdCBlcnJvck1lc3NhZ2U6IHN0cmluZyA9IGFjdGlvblxuXHRcdFx0PyBgVXNlciBwZXJmb3JtZWQgYWN0aW9uOiAke2FjdGlvbn1gXG5cdFx0XHQ6ICdVc2VyIHBlcmZvcm1lZCBhY3Rpb24nO1xuXHRcdGNvbnN0IGN1c3RvbURldGFpbHMgPSBhY3Rpb24gPyB7IGFjdGlvbiwgLi4uZGV0YWlscyB9IDogZGV0YWlscztcblxuXHRcdHN1cGVyKFxuXHRcdFx0ZXJyb3JNZXNzYWdlLFxuXHRcdFx0MjAwLFxuXHRcdFx0RXJyb3JTZXZlcml0eS5JTkZPLFxuXHRcdFx0RVJST1JfQ09ERVMuVVNFUl9BQ1RJT05fSU5GTyxcblx0XHRcdGN1c3RvbURldGFpbHNcblx0XHQpO1xuXG5cdFx0dGhpcy5uYW1lID0gJ1VzZXJBY3Rpb25JbmZvJztcblx0fVxufVxuXG5leHBvcnQgY2xhc3MgVXRpbGl0eUVycm9yRmF0YWwgZXh0ZW5kcyBBcHBFcnJvciB7XG5cdGNvbnN0cnVjdG9yKHV0aWxpdHk/OiBzdHJpbmcsIGRldGFpbHM6IEVycm9yRGV0YWlscyA9IHt9KSB7XG5cdFx0Y29uc3QgZXJyb3JNZXNzYWdlOiBzdHJpbmcgPSBgRmF0YWwgZXJyb3Igb2NjdXJlZCB3aGVuIGNhbGxpbmcgJHt1dGlsaXR5fWA7XG5cdFx0Y29uc3QgY3VzdG9tRGV0YWlscyA9IHV0aWxpdHkgPyB7IHV0aWxpdHksIC4uLmRldGFpbHMgfSA6IGRldGFpbHM7XG5cblx0XHRzdXBlcihcblx0XHRcdGVycm9yTWVzc2FnZSxcblx0XHRcdDUwMCxcblx0XHRcdEVycm9yU2V2ZXJpdHkuRkFUQUwsXG5cdFx0XHRFUlJPUl9DT0RFUy5VVElMSVRZX0VSUk9SX0ZBVEFMLFxuXHRcdFx0Y3VzdG9tRGV0YWlsc1xuXHRcdCk7XG5cblx0XHR0aGlzLm5hbWUgPSAnVXRpbGl0eUVycm9yRmF0YWwnO1xuXHR9XG59XG5cbmV4cG9ydCBjbGFzcyBVdGlsaXR5RXJyb3JSZWNvdmVyYWJsZSBleHRlbmRzIEFwcEVycm9yIHtcblx0Y29uc3RydWN0b3IodXRpbGl0eT86IHN0cmluZywgZGV0YWlsczogRXJyb3JEZXRhaWxzID0ge30pIHtcblx0XHRjb25zdCBlcnJvck1lc3NhZ2U6IHN0cmluZyA9IGBVdGlsaXR5IG9jY3VycmVkIGluICR7dXRpbGl0eX1gO1xuXG5cdFx0Y29uc3QgY3VzdG9tRGV0YWlscyA9IHV0aWxpdHkgPyB7IHV0aWxpdHksIC4uLmRldGFpbHMgfSA6IGRldGFpbHM7XG5cblx0XHRzdXBlcihcblx0XHRcdGVycm9yTWVzc2FnZSxcblx0XHRcdDUwMCxcblx0XHRcdEVycm9yU2V2ZXJpdHkuUkVDT1ZFUkFCTEUsXG5cdFx0XHRFUlJPUl9DT0RFUy5VVElMSVRZX0VSUk9SX1JFQ09WRVJBQkxFLFxuXHRcdFx0Y3VzdG9tRGV0YWlsc1xuXHRcdCk7XG5cdFx0dGhpcy5uYW1lID0gJ1V0aWxpdHlFcnJvclJlY292ZXJhYmxlJztcblx0fVxufVxuXG5leHBvcnQgY2xhc3MgVmFsaWRhdGlvbkVycm9yIGV4dGVuZHMgQXBwRXJyb3Ige1xuXHRjb25zdHJ1Y3RvcihpbnZhbGlkRmllbGRzPzogc3RyaW5nW10sIGRldGFpbHM6IEVycm9yRGV0YWlscyA9IHt9KSB7XG5cdFx0Y29uc3QgZXJyb3JNZXNzYWdlOiBzdHJpbmcgPSBpbnZhbGlkRmllbGRzXG5cdFx0XHQ/IGBWYWxpZGF0aW9uIGVycm9yIG9uIGZpZWxkczogJHtpbnZhbGlkRmllbGRzLmpvaW4oJywgJyl9YFxuXHRcdFx0OiAnVmFsaWRhdGlvbiBlcnJvcic7XG5cdFx0Y29uc3QgY3VzdG9tRGV0YWlscyA9IGludmFsaWRGaWVsZHNcblx0XHRcdD8geyBpbnZhbGlkRmllbGRzLCAuLi5kZXRhaWxzIH1cblx0XHRcdDogZGV0YWlscztcblxuXHRcdHN1cGVyKFxuXHRcdFx0ZXJyb3JNZXNzYWdlLFxuXHRcdFx0NDAwLFxuXHRcdFx0RXJyb3JTZXZlcml0eS5XQVJOSU5HLFxuXHRcdFx0RVJST1JfQ09ERVMuVkFMSURBVElPTl9FUlJPUixcblx0XHRcdGN1c3RvbURldGFpbHNcblx0XHQpO1xuXHRcdHRoaXMubmFtZSA9ICdWYWxpZGF0aW9uRXJyb3InO1xuXHR9XG59XG5cbmV4cG9ydCBjbGFzcyBBdXRvQ29ycmVjdGVkSW5wdXRXYXJuaW5nIGV4dGVuZHMgQ2xpZW50RXJyb3Ige1xuXHRjb25zdHJ1Y3RvcihmaWVsZE5hbWU/OiBzdHJpbmcsIGRldGFpbHM6IEVycm9yRGV0YWlscyA9IHt9KSB7XG5cdFx0Y29uc3QgZXJyb3JNZXNzYWdlOiBzdHJpbmcgPSBmaWVsZE5hbWVcblx0XHRcdD8gYCR7ZmllbGROYW1lfSB3YXMgYXV0by1jb3JyZWN0ZWRgXG5cdFx0XHQ6ICdJbnB1dCB3YXMgYXV0by1jb3JyZWN0ZWQnO1xuXG5cdFx0Y29uc3QgY3VzdG9tRGV0YWlscyA9IGZpZWxkTmFtZSA/IHsgZmllbGROYW1lLCAuLi5kZXRhaWxzIH0gOiBkZXRhaWxzO1xuXG5cdFx0c3VwZXIoXG5cdFx0XHRlcnJvck1lc3NhZ2UsXG5cdFx0XHQyMDAsXG5cdFx0XHRFcnJvclNldmVyaXR5LldBUk5JTkcsXG5cdFx0XHRFUlJPUl9DT0RFUy5BVVRPQ09SUkVDVF9JTlBVVF9XQVJOSU5HLFxuXHRcdFx0Y3VzdG9tRGV0YWlsc1xuXHRcdCk7XG5cdFx0dGhpcy5uYW1lID0gJ0F1dG9Db3JyZWN0ZWRJbnB1dFdhcm5pbmcnO1xuXHR9XG59XG5cbmV4cG9ydCBjbGFzcyBDbGllbnRBdXRoZW50aWNhdGlvbkVycm9yIGV4dGVuZHMgQ2xpZW50RXJyb3Ige1xuXHRjb25zdHJ1Y3Rvcihcblx0XHRlcnJvck1lc3NhZ2U6IHN0cmluZyA9ICdBdXRoZW50aWNhdGlvbiBmYWlsZWQnLFxuXHRcdGRldGFpbHM6IEVycm9yRGV0YWlscyA9IHt9XG5cdCkge1xuXHRcdHN1cGVyKFxuXHRcdFx0ZXJyb3JNZXNzYWdlLFxuXHRcdFx0NDAxLFxuXHRcdFx0RXJyb3JTZXZlcml0eS5SRUNPVkVSQUJMRSxcblx0XHRcdEVSUk9SX0NPREVTLkNMSUVOVF9BVVRIX0VSUk9SLFxuXHRcdFx0ZGV0YWlsc1xuXHRcdCk7XG5cdFx0dGhpcy5uYW1lID0gJ0F1dGhlbnRpY2F0aW9uRXJyb3InO1xuXHR9XG59XG5cbmV4cG9ydCBjbGFzcyBEZXByZWNhdGVkQXBpV2FybmluZyBleHRlbmRzIENsaWVudEVycm9yIHtcblx0Y29uc3RydWN0b3IoYXBpVmVyc2lvbj86IHN0cmluZywgZGV0YWlsczogRXJyb3JEZXRhaWxzID0ge30pIHtcblx0XHRjb25zdCBlcnJvck1lc3NhZ2U6IHN0cmluZyA9IGFwaVZlcnNpb25cblx0XHRcdD8gYERlcHJlY2F0ZWQgQVBJIHZlcnNpb24gJHthcGlWZXJzaW9ufSB1c2VkYFxuXHRcdFx0OiAnRGVwcmVjYXRlZCBBUEkgdmVyc2lvbiB1c2VkJztcblxuXHRcdGNvbnN0IGN1c3RvbURldGFpbHMgPSBhcGlWZXJzaW9uID8geyBhcGlWZXJzaW9uLCAuLi5kZXRhaWxzIH0gOiBkZXRhaWxzO1xuXG5cdFx0c3VwZXIoXG5cdFx0XHRlcnJvck1lc3NhZ2UsXG5cdFx0XHQyMDAsXG5cdFx0XHRFcnJvclNldmVyaXR5LldBUk5JTkcsXG5cdFx0XHRFUlJPUl9DT0RFUy5ERVBSRUNBVEVEX0FQSV9XQVJOSU5HLFxuXHRcdFx0Y3VzdG9tRGV0YWlsc1xuXHRcdCk7XG5cdFx0dGhpcy5uYW1lID0gJ0RlcHJlY2F0ZWRBcGlXYXJuaW5nJztcblx0fVxufVxuXG5leHBvcnQgY2xhc3MgRXh0ZXJuYWxTZXJ2aWNlRXJyb3IgZXh0ZW5kcyBDbGllbnRFcnJvciB7XG5cdGNvbnN0cnVjdG9yKFxuXHRcdGVycm9yTWVzc2FnZSA9ICdTZXJ2aWNlIHRlbXBvcmFyaWx5IHVuYXZhaWxhYmxlJyxcblx0XHRkZXRhaWxzOiBFcnJvckRldGFpbHMgPSB7fVxuXHQpIHtcblx0XHRzdXBlcihcblx0XHRcdGVycm9yTWVzc2FnZSxcblx0XHRcdDUwMyxcblx0XHRcdEVycm9yU2V2ZXJpdHkuUkVDT1ZFUkFCTEUsXG5cdFx0XHRFUlJPUl9DT0RFUy5FWFRFUk5BTF9TRVJWSUNFX0VSUk9SLFxuXHRcdFx0ZGV0YWlsc1xuXHRcdCk7XG5cdFx0dGhpcy5uYW1lID0gJ0V4dGVybmFsU2VydmljZUVycm9yJztcblx0fVxufVxuXG5leHBvcnQgY2xhc3MgRmlsZVByb2Nlc3NpbmdFcnJvciBleHRlbmRzIENsaWVudEVycm9yIHtcblx0Y29uc3RydWN0b3IoXG5cdFx0cmV0cnlBZnRlcjogbnVtYmVyID0gZGVmYXVsdFJldHJ5QWZ0ZXIsXG5cdFx0ZGV0YWlsczogRXJyb3JEZXRhaWxzID0ge31cblx0KSB7XG5cdFx0Y29uc3QgbWVzc2FnZTogc3RyaW5nID0gJ0ZpbGUgcHJvY2Vzc2luZyBmYWlsZWQuJztcblx0XHRjb25zdCByZXRyeUFmdGVyTWVzc2FnZTogc3RyaW5nID0gY3JlYXRlUmV0cnlNZXNzYWdlKHJldHJ5QWZ0ZXIpO1xuXHRcdGNvbnN0IGVycm9yTWVzc2FnZTogc3RyaW5nID0gYCR7bWVzc2FnZX0gJHtyZXRyeUFmdGVyTWVzc2FnZX1gLnRyaW0oKTtcblxuXHRcdGNvbnN0IGN1c3RvbURldGFpbHMgPSByZXRyeUFmdGVyID8geyByZXRyeUFmdGVyLCAuLi5kZXRhaWxzIH0gOiBkZXRhaWxzO1xuXG5cdFx0c3VwZXIoXG5cdFx0XHRlcnJvck1lc3NhZ2UsXG5cdFx0XHQ1MDAsXG5cdFx0XHRFcnJvclNldmVyaXR5LlJFQ09WRVJBQkxFLFxuXHRcdFx0RVJST1JfQ09ERVMuRklMRV9QUk9DRVNTSU5HX0VSUk9SLFxuXHRcdFx0Y3VzdG9tRGV0YWlsc1xuXHRcdCk7XG5cdFx0dGhpcy5uYW1lID0gJ0ZpbGVQcm9jZXNzaW5nRXJyb3InO1xuXHR9XG59XG5cbmV4cG9ydCBjbGFzcyBGb3JiaWRkZW5FcnJvciBleHRlbmRzIENsaWVudEVycm9yIHtcblx0Y29uc3RydWN0b3IoYWN0aW9uPzogc3RyaW5nLCBkZXRhaWxzOiBFcnJvckRldGFpbHMgPSB7fSkge1xuXHRcdGNvbnN0IGVycm9yTWVzc2FnZTogc3RyaW5nID0gYWN0aW9uXG5cdFx0XHQ/IGBGb3JiaWRkZW46IFlvdSBhcmUgbm90IGFsbG93ZWQgdG8gJHthY3Rpb259YFxuXHRcdFx0OiAnRm9yYmlkZGVuJztcblxuXHRcdGNvbnN0IGN1c3RvbURldGFpbHMgPSBhY3Rpb24gPyB7IGFjdGlvbiwgLi4uZGV0YWlscyB9IDogZGV0YWlscztcblxuXHRcdHN1cGVyKFxuXHRcdFx0ZXJyb3JNZXNzYWdlLFxuXHRcdFx0NDAzLFxuXHRcdFx0RXJyb3JTZXZlcml0eS5SRUNPVkVSQUJMRSxcblx0XHRcdEVSUk9SX0NPREVTLkZPUkJJRERFTixcblx0XHRcdGN1c3RvbURldGFpbHNcblx0XHQpO1xuXHRcdHRoaXMubmFtZSA9ICdGb3JiaWRkZW5FcnJvcic7XG5cdH1cbn1cblxuZXhwb3J0IGNsYXNzIEludmFsaWRDcmVkZW50aWFsc0Vycm9yIGV4dGVuZHMgQ2xpZW50RXJyb3Ige1xuXHRjb25zdHJ1Y3Rvcihcblx0XHRlcnJvck1lc3NhZ2U6IHN0cmluZyA9ICdJbnZhbGlkIGNyZWRlbnRpYWxzIHByb3ZpZGVkJyxcblx0XHRkZXRhaWxzOiBFcnJvckRldGFpbHMgPSB7fVxuXHQpIHtcblx0XHRzdXBlcihcblx0XHRcdGVycm9yTWVzc2FnZSxcblx0XHRcdDQwMSxcblx0XHRcdEVycm9yU2V2ZXJpdHkuUkVDT1ZFUkFCTEUsXG5cdFx0XHRFUlJPUl9DT0RFUy5JTlZBTElEX0NSRURFTlRJQUxTLFxuXHRcdFx0ZGV0YWlsc1xuXHRcdCk7XG5cdFx0dGhpcy5uYW1lID0gJ0ludmFsaWRDcmVkZW50aWFsc0Vycm9yJztcblx0fVxufVxuXG5leHBvcnQgY2xhc3MgSW52YWxpZElucHV0RXJyb3IgZXh0ZW5kcyBDbGllbnRFcnJvciB7XG5cdGNvbnN0cnVjdG9yKGlucHV0TmFtZT86IHN0cmluZywgZGV0YWlsczogRXJyb3JEZXRhaWxzID0ge30pIHtcblx0XHRjb25zdCBlcnJvck1lc3NhZ2U6IHN0cmluZyA9IGlucHV0TmFtZVxuXHRcdFx0PyBgSW52YWxpZCBpbnB1dDogJHtpbnB1dE5hbWV9YFxuXHRcdFx0OiAnSW52YWxpZCBpbnB1dCBwcm92aWRlZCc7XG5cblx0XHRjb25zdCBjdXN0b21EZXRhaWxzID0gaW5wdXROYW1lID8geyBpbnB1dE5hbWUsIC4uLmRldGFpbHMgfSA6IGRldGFpbHM7XG5cblx0XHRzdXBlcihcblx0XHRcdGVycm9yTWVzc2FnZSxcblx0XHRcdDQwMCxcblx0XHRcdEVycm9yU2V2ZXJpdHkuV0FSTklORyxcblx0XHRcdEVSUk9SX0NPREVTLklOVkFMSURfSU5QVVQsXG5cdFx0XHRjdXN0b21EZXRhaWxzXG5cdFx0KTtcblx0XHR0aGlzLm5hbWUgPSAnSW52YWxpZElucHV0RXJyb3InO1xuXHR9XG59XG5cbmV4cG9ydCBjbGFzcyBJbnZhbGlkVG9rZW5FcnJvciBleHRlbmRzIENsaWVudEVycm9yIHtcblx0Y29uc3RydWN0b3IoXG5cdFx0ZXJyb3JNZXNzYWdlOiBzdHJpbmcgPSAnSW52YWxpZCBvciBleHBpcmVkIHRva2VuJyxcblx0XHR0b2tlbj86IHN0cmluZyxcblx0XHRkZXRhaWxzOiBFcnJvckRldGFpbHMgPSB7fVxuXHQpIHtcblx0XHRjb25zdCBjdXN0b21EZXRhaWxzID0gdG9rZW4gPyB7IHRva2VuLCAuLi5kZXRhaWxzIH0gOiBkZXRhaWxzO1xuXG5cdFx0c3VwZXIoXG5cdFx0XHRlcnJvck1lc3NhZ2UsXG5cdFx0XHQ0MDEsXG5cdFx0XHRFcnJvclNldmVyaXR5LlJFQ09WRVJBQkxFLFxuXHRcdFx0RVJST1JfQ09ERVMuSU5WQUxJRF9UT0tFTixcblx0XHRcdGN1c3RvbURldGFpbHNcblx0XHQpO1xuXHRcdHRoaXMubmFtZSA9ICdJbnZhbGlkVG9rZW5FcnJvcic7XG5cdH1cbn1cblxuZXhwb3J0IGNsYXNzIFBhc3N3b3JkVmFsaWRhdGlvbkVycm9yIGV4dGVuZHMgQ2xpZW50RXJyb3Ige1xuXHRjb25zdHJ1Y3Rvcihcblx0XHRlcnJvck1lc3NhZ2U6IHN0cmluZyA9ICdQYXNzd29yZCB2YWxpZGF0aW9uIGVycm9yLiBQbGVhc2UgdHJ5IGFnYWluJyxcblx0XHRkZXRhaWxzOiBFcnJvckRldGFpbHMgPSB7fVxuXHQpIHtcblx0XHRzdXBlcihcblx0XHRcdGVycm9yTWVzc2FnZSxcblx0XHRcdDQwMCxcblx0XHRcdEVycm9yU2V2ZXJpdHkuV0FSTklORyxcblx0XHRcdEVSUk9SX0NPREVTLlBBU1NXT1JEX1ZBTElEQVRJT05fRVJST1IsXG5cdFx0XHRkZXRhaWxzXG5cdFx0KTtcblx0XHR0aGlzLm5hbWUgPSAnUGFzc3dvcmRWYWxpZGF0aW9uRXJyb3InO1xuXHR9XG59XG5cbmV4cG9ydCBjbGFzcyBQZXJtaXNzaW9uRGVuaWVkRXJyb3IgZXh0ZW5kcyBDbGllbnRFcnJvciB7XG5cdGNvbnN0cnVjdG9yKFxuXHRcdGVycm9yTWVzc2FnZTogc3RyaW5nID0gJ1Blcm1pc3Npb24gZGVuaWVkJyxcblx0XHRhY3Rpb24/OiBzdHJpbmcsXG5cdFx0ZGV0YWlsczogRXJyb3JEZXRhaWxzID0ge31cblx0KSB7XG5cdFx0Y29uc3QgY3VzdG9tRGV0YWlscyA9IGFjdGlvbiA/IHsgYWN0aW9uLCAuLi5kZXRhaWxzIH0gOiBkZXRhaWxzO1xuXG5cdFx0c3VwZXIoXG5cdFx0XHRlcnJvck1lc3NhZ2UsXG5cdFx0XHQ0MDMsXG5cdFx0XHRFcnJvclNldmVyaXR5LlJFQ09WRVJBQkxFLFxuXHRcdFx0RVJST1JfQ09ERVMuUEVSTUlTU0lPTl9ERU5JRUQsXG5cdFx0XHRjdXN0b21EZXRhaWxzXG5cdFx0KTtcblx0XHR0aGlzLm5hbWUgPSAnUGVybWlzc2lvbkRlbmllZEVycm9yJztcblx0fVxufVxuXG5leHBvcnQgY2xhc3MgUXVvdGFFeGNlZWRlZEVycm9yUmVjb3ZlcmFibGUgZXh0ZW5kcyBDbGllbnRFcnJvciB7XG5cdGNvbnN0cnVjdG9yKFxuXHRcdHJldHJ5QWZ0ZXI6IG51bWJlciA9IGRlZmF1bHRSZXRyeUFmdGVyLFxuXHRcdHF1b3RhTmFtZTogc3RyaW5nLFxuXHRcdGxpbWl0OiBudW1iZXIsXG5cdFx0ZGV0YWlsczogRXJyb3JEZXRhaWxzID0ge31cblx0KSB7XG5cdFx0Y29uc3QgZXJyb3JNZXNzYWdlOiBzdHJpbmcgPSBjcmVhdGVRdW90YUV4Y2VlZGVkTWVzc2FnZShcblx0XHRcdHF1b3RhTmFtZSxcblx0XHRcdGxpbWl0LFxuXHRcdFx0cmV0cnlBZnRlclxuXHRcdCk7XG5cblx0XHRjb25zdCBlcnJvckRldGFpbHM6IEVycm9yRGV0YWlscyA9IHtcblx0XHRcdC4uLihxdW90YU5hbWUgPyB7IHF1b3RhTmFtZSB9IDoge30pLFxuXHRcdFx0Li4uKGxpbWl0ICE9PSB1bmRlZmluZWQgPyB7IGxpbWl0IH0gOiB7fSksXG5cdFx0XHQuLi4ocmV0cnlBZnRlciA/IHsgcmV0cnlBZnRlciB9IDoge30pLFxuXHRcdFx0Li4uZGV0YWlsc1xuXHRcdH07XG5cblx0XHRzdXBlcihcblx0XHRcdGVycm9yTWVzc2FnZSxcblx0XHRcdDQyOSxcblx0XHRcdEVycm9yU2V2ZXJpdHkuUkVDT1ZFUkFCTEUsXG5cdFx0XHRFUlJPUl9DT0RFUy5RVU9UQV9FWENFRURFRCxcblx0XHRcdGVycm9yRGV0YWlsc1xuXHRcdCk7XG5cdFx0dGhpcy5uYW1lID0gJ1F1b3RhRXhjZWVkZWRFcnJvcic7XG5cdH1cbn1cblxuZXhwb3J0IGNsYXNzIFF1b3RhRXhjZWVkZWRFcnJvcldhcm5pbmcgZXh0ZW5kcyBDbGllbnRFcnJvciB7XG5cdGNvbnN0cnVjdG9yKFxuXHRcdHJldHJ5QWZ0ZXI6IG51bWJlciA9IGRlZmF1bHRSZXRyeUFmdGVyLFxuXHRcdHF1b3RhTmFtZT86IHN0cmluZyxcblx0XHRsaW1pdD86IG51bWJlcixcblx0XHRkZXRhaWxzOiBFcnJvckRldGFpbHMgPSB7fVxuXHQpIHtcblx0XHRjb25zdCBlcnJvck1lc3NhZ2U6IHN0cmluZyA9IGNyZWF0ZVF1b3RhRXhjZWVkZWRNZXNzYWdlKFxuXHRcdFx0cXVvdGFOYW1lLFxuXHRcdFx0bGltaXQsXG5cdFx0XHRyZXRyeUFmdGVyXG5cdFx0KTtcblxuXHRcdGNvbnN0IGVycm9yRGV0YWlsczogRXJyb3JEZXRhaWxzID0ge1xuXHRcdFx0Li4uKHF1b3RhTmFtZSA/IHsgcXVvdGFOYW1lIH0gOiB7fSksXG5cdFx0XHQuLi4obGltaXQgIT09IHVuZGVmaW5lZCA/IHsgbGltaXQgfSA6IHt9KSxcblx0XHRcdC4uLihyZXRyeUFmdGVyID8geyByZXRyeUFmdGVyIH0gOiB7fSksXG5cdFx0XHQuLi5kZXRhaWxzXG5cdFx0fTtcblxuXHRcdHN1cGVyKFxuXHRcdFx0ZXJyb3JNZXNzYWdlLFxuXHRcdFx0NDI5LFxuXHRcdFx0RXJyb3JTZXZlcml0eS5XQVJOSU5HLFxuXHRcdFx0RVJST1JfQ09ERVMuUVVPVEFfRVhDRUVERURfV0FSTklORyxcblx0XHRcdGVycm9yRGV0YWlsc1xuXHRcdCk7XG5cdFx0dGhpcy5uYW1lID0gJ1F1b3RhRXhjZWVkZWRFcnJvcldhcm5pbmcnO1xuXHR9XG59XG5cbmV4cG9ydCBjbGFzcyBSYXRlTGltaXRFcnJvclJlY292ZXJhYmxlIGV4dGVuZHMgQ2xpZW50RXJyb3Ige1xuXHRjb25zdHJ1Y3Rvcihcblx0XHRyZXRyeUFmdGVyOiBudW1iZXIgPSBkZWZhdWx0UmV0cnlBZnRlcixcblx0XHRkZXRhaWxzOiBFcnJvckRldGFpbHMgPSB7fVxuXHQpIHtcblx0XHRjb25zdCBtZXNzYWdlOiBzdHJpbmcgPSAnUmF0ZSBsaW1pdCBleGNlZWRlZC4nO1xuXHRcdGNvbnN0IHJldHJ5TWVzc2FnZTogc3RyaW5nID0gY3JlYXRlUmV0cnlNZXNzYWdlKHJldHJ5QWZ0ZXIpO1xuXHRcdGNvbnN0IGVycm9yTWVzc2FnZSA9IGAke21lc3NhZ2V9JHtyZXRyeU1lc3NhZ2V9YC50cmltKCk7XG5cblx0XHRjb25zdCBjdXN0b21EZXRhaWxzID0gcmV0cnlBZnRlciA/IHsgcmV0cnlBZnRlciwgLi4uZGV0YWlscyB9IDogZGV0YWlscztcblxuXHRcdHN1cGVyKFxuXHRcdFx0ZXJyb3JNZXNzYWdlLFxuXHRcdFx0NDI5LFxuXHRcdFx0RXJyb3JTZXZlcml0eS5SRUNPVkVSQUJMRSxcblx0XHRcdEVSUk9SX0NPREVTLlJBVEVfTElNSVRfRVhDRUVERUQsXG5cdFx0XHRjdXN0b21EZXRhaWxzXG5cdFx0KTtcblx0XHR0aGlzLm5hbWUgPSAnUmF0ZUxpbWl0RXJyb3JSZWNvdmVyYWJsZSc7XG5cdH1cbn1cblxuZXhwb3J0IGNsYXNzIFJhdGVMaW1pdEVycm9yV2FybmluZyBleHRlbmRzIENsaWVudEVycm9yIHtcblx0Y29uc3RydWN0b3IoXG5cdFx0cmV0cnlBZnRlcjogbnVtYmVyID0gZGVmYXVsdFJldHJ5QWZ0ZXIsXG5cdFx0ZGV0YWlsczogRXJyb3JEZXRhaWxzID0ge31cblx0KSB7XG5cdFx0Y29uc3QgbWVzc2FnZTogc3RyaW5nID0gJ1JhdGUgbGltaXQgZXhjZWVkZWQuJztcblx0XHRjb25zdCByZXRyeU1lc3NhZ2U6IHN0cmluZyA9IGNyZWF0ZVJldHJ5TWVzc2FnZShyZXRyeUFmdGVyKTtcblx0XHRjb25zdCBlcnJvck1lc3NhZ2UgPSBgJHttZXNzYWdlfSR7cmV0cnlNZXNzYWdlfWAudHJpbSgpO1xuXG5cdFx0Y29uc3QgY3VzdG9tRGV0YWlscyA9IHJldHJ5QWZ0ZXIgPyB7IHJldHJ5QWZ0ZXIsIC4uLmRldGFpbHMgfSA6IGRldGFpbHM7XG5cblx0XHRzdXBlcihcblx0XHRcdGVycm9yTWVzc2FnZSxcblx0XHRcdDQyOSxcblx0XHRcdEVycm9yU2V2ZXJpdHkuV0FSTklORyxcblx0XHRcdEVSUk9SX0NPREVTLlJBVEVfTElNSVRfRVhDRUVERURfV0FSTklORyxcblx0XHRcdGN1c3RvbURldGFpbHNcblx0XHQpO1xuXHRcdHRoaXMubmFtZSA9ICdSYXRlTGltaXRFcnJvcldhcm5pbmcnO1xuXHR9XG59XG5cbmV4cG9ydCBjbGFzcyBTZXNzaW9uRXhwaXJlZEVycm9yIGV4dGVuZHMgQ2xpZW50RXJyb3Ige1xuXHRjb25zdHJ1Y3Rvcihcblx0XHRlcnJvck1lc3NhZ2U6IHN0cmluZyA9ICdZb3VyIHNlc3Npb24gaGFzIGV4cGlyZWQnLFxuXHRcdGRldGFpbHM6IEVycm9yRGV0YWlscyA9IHt9XG5cdCkge1xuXHRcdHN1cGVyKFxuXHRcdFx0ZXJyb3JNZXNzYWdlLFxuXHRcdFx0NDAxLFxuXHRcdFx0RXJyb3JTZXZlcml0eS5SRUNPVkVSQUJMRSxcblx0XHRcdEVSUk9SX0NPREVTLlNFU1NJT05fRVhQSVJFRCxcblx0XHRcdGRldGFpbHNcblx0XHQpO1xuXHRcdHRoaXMubmFtZSA9ICdTZXNzaW9uRXhwaXJlZEVycm9yJztcblx0fVxufVxuXG5leHBvcnQgY2xhc3MgVGltZW91dEVycm9yIGV4dGVuZHMgQ2xpZW50RXJyb3Ige1xuXHRjb25zdHJ1Y3Rvcihcblx0XHRlcnJvck1lc3NhZ2U6IHN0cmluZyA9ICdSZXF1ZXN0IHRpbWVkIG91dC4gUGxlYXNlIHRyeSBhZ2FpbicsXG5cdFx0ZGV0YWlsczogRXJyb3JEZXRhaWxzID0ge31cblx0KSB7XG5cdFx0c3VwZXIoXG5cdFx0XHRlcnJvck1lc3NhZ2UsXG5cdFx0XHQ1MDQsXG5cdFx0XHRFcnJvclNldmVyaXR5LlJFQ09WRVJBQkxFLFxuXHRcdFx0RVJST1JfQ09ERVMuVElNRU9VVF9FUlJPUixcblx0XHRcdGRldGFpbHNcblx0XHQpO1xuXHRcdHRoaXMubmFtZSA9ICdUaW1lb3V0RXJyb3InO1xuXHR9XG59XG5cbmV4cG9ydCBjbGFzcyBVc2VyUmVnaXN0cmF0aW9uRXJyb3IgZXh0ZW5kcyBDbGllbnRFcnJvciB7XG5cdGNvbnN0cnVjdG9yKFxuXHRcdGVycm9yTWVzc2FnZTogc3RyaW5nID0gJ0FjY291bnQgcmVnaXN0cmF0aW9uIGZhaWxlZC4gUGxlYXNlIHRyeSBhZ2Fpbi4nLFxuXHRcdGRldGFpbHM6IEVycm9yRGV0YWlscyA9IHt9XG5cdCkge1xuXHRcdHN1cGVyKFxuXHRcdFx0ZXJyb3JNZXNzYWdlLFxuXHRcdFx0NTAwLFxuXHRcdFx0RXJyb3JTZXZlcml0eS5SRUNPVkVSQUJMRSxcblx0XHRcdEVSUk9SX0NPREVTLlVTRVJfUkVHSVNUUkFUSU9OX0VSUk9SLFxuXHRcdFx0ZGV0YWlsc1xuXHRcdCk7XG5cdFx0dGhpcy5uYW1lID0gJ1VzZXJSZWdpc3RyYXRpb25FcnJvcic7XG5cdH1cbn1cblxuZXhwb3J0IGNvbnN0IEVycm9yQ2xhc3NlcyA9IHtcblx0QXBwQXV0aGVudGljYXRpb25FcnJvcixcblx0QXV0aENvbnRyb2xsZXJFcnJvcixcblx0QXV0b0NvcnJlY3RlZElucHV0V2FybmluZyxcblx0Q2FjaGVTZXJ2aWNlRXJyb3IsXG5cdENsaWVudEF1dGhlbnRpY2F0aW9uRXJyb3IsXG5cdENvbmN1cnJlbmN5RXJyb3IsXG5cdENvbmZpZ3VyYXRpb25FcnJvcixcblx0Q29uZmlndXJhdGlvbkVycm9yRmF0YWwsXG5cdENvbmZsaWN0RXJyb3IsXG5cdERhdGFiYXNlRXJyb3JGYXRhbCxcblx0RGF0YWJhc2VFcnJvclJlY292ZXJhYmxlLFxuXHREYXRhSW50ZWdyaXR5RXJyb3IsXG5cdERlcGVuZGVuY3lFcnJvckZhdGFsLFxuXHREZXBlbmRlbmN5RXJyb3JSZWNvdmVyYWJsZSxcblx0RGVwcmVjYXRlZEFwaVdhcm5pbmcsXG5cdEV4cHJlc3NFcnJvcixcblx0RXhwcmVzc1JvdXRlRXJyb3IsXG5cdEV4dGVybmFsU2VydmljZUVycm9yLFxuXHRFeHRlcm5hbFNlcnZpY2VFcnJvckZhdGFsLFxuXHRGYWxsYmFja1N1Y2Nlc3NJbmZvLFxuXHRGaWxlUHJvY2Vzc2luZ0Vycm9yLFxuXHRGb3JiaWRkZW5FcnJvcixcblx0SGVhbHRoQ2hlY2tFcnJvcixcblx0SFRUUFNDbGllbnRFcnJvckZhdGFsLFxuXHRIVFRQU1NlcnZlckVycm9yUmVjb3ZlcmFibGUsXG5cdEluc3VmZmljaWVudFN0b3JhZ2VFcnJvcixcblx0SW52YWxpZENyZWRlbnRpYWxzRXJyb3IsXG5cdEludmFsaWRJbnB1dEVycm9yLFxuXHRJbnZhbGlkVG9rZW5FcnJvcixcblx0TWlkZGxld2FyZVNlcnZpY2VFcnJvcixcblx0TWlzc2luZ1Jlc291cmNlRXJyb3IsXG5cdFBhc3Nwb3J0QXV0aFNlcnZpY2VFcnJvcixcblx0UGFydGlhbFNlcnZpY2VGYWlsdXJlV2FybmluZyxcblx0UGFzc3dvcmRWYWxpZGF0aW9uRXJyb3IsXG5cdFBlcm1pc3Npb25EZW5pZWRFcnJvcixcblx0UXVvdGFFeGNlZWRlZEVycm9yRmF0YWwsXG5cdFF1b3RhRXhjZWVkZWRFcnJvclJlY292ZXJhYmxlLFxuXHRRdW90YUV4Y2VlZGVkRXJyb3JXYXJuaW5nLFxuXHRSYXRlTGltaXRFcnJvckZhdGFsLFxuXHRSYXRlTGltaXRFcnJvclJlY292ZXJhYmxlLFxuXHRSYXRlTGltaXRFcnJvcldhcm5pbmcsXG5cdFJlZGlzU2VydmljZUVycm9yLFxuXHRSZXNvdXJjZU1hbmFnZXJFcnJvcixcblx0Um9vdE1pZGRsZXdhcmVFcnJvcixcblx0U2VydmVyTm90SW5pdGlhbGl6ZWRFcnJvcixcblx0U2VydmljZURlZ3JhZGVkRXJyb3IsXG5cdFNlcnZpY2VEZWdyYWRlZEVycm9yTWlub3IsXG5cdFNlcnZpY2VVbmF2YWlsYWJsZUVycm9yLFxuXHRTZXJ2aWNlVW5hdmFpbGFibGVFcnJvckZhdGFsLFxuXHRTZXNzaW9uRXhwaXJlZEVycm9yLFxuXHRTbG93QXBpV2FybmluZyxcblx0VGltZW91dEVycm9yLFxuXHRVc2VyQWN0aW9uSW5mbyxcblx0VXNlclJlZ2lzdHJhdGlvbkVycm9yLFxuXHRVdGlsaXR5RXJyb3JGYXRhbCxcblx0VXRpbGl0eUVycm9yUmVjb3ZlcmFibGUsXG5cdFZhbGlkYXRpb25FcnJvclxufTtcbiJdfQ==
