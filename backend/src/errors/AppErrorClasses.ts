import {
	AppError,
	ErrorDetails,
	ErrorSeverity,
	createQuotaExceededMessage,
	createRetryMessage,
	defaultRetryAfter
} from './ErrorClasses';
import { ERROR_CODES } from '../config/errorCodes';

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

export const AppErrorClasses = {
	AppAuthenticationError,
	AuthControllerError,
	CacheServiceError,
	ConfigurationError,
	ConfigurationErrorFatal,
	ConcurrencyError,
	ConflictError,
	DatabaseErrorFatal,
	DatabaseErrorRecoverable,
	DataIntegrityError,
	DependencyErrorFatal,
	DependencyErrorRecoverable,
	ExpressError,
	ExpressRouteError,
	ExternalServiceErrorFatal,
	HealthCheckError,
	InsufficientStorageError,
	MiddlewareServiceError,
	MissingResourceError,
	PassportAuthServiceError,
	PartialServiceFailureWarning,
	QuotaExceededErrorFatal,
	RateLimitErrorFatal,
	RedisServiceError,
	ResourceManagerError,
	RootMiddlewareError,
	ServiceDegradedError,
	ServiceDegradedErrorMinor,
	ServiceUnavailableError,
	ServiceUnavailableErrorFatal,
	SlowApiWarning,
	UserActionInfo,
	UtilityErrorFatal,
	UtilityErrorRecoverable,
	ValidationError
};
