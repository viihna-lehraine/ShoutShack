const errorCounts = new Map<string, number>();

interface AppErrorDetails {
	retryAfter?: number | undefined;
	[key: string]: unknown;
}

export const ErrorSeverity = {
	FATAL: 'fatal',
	RECOVERABLE: 'recoverable',
	WARNING: 'warning',
	INFO: 'info'
} as const;

export type ErrorSeverityType = typeof ErrorSeverity[keyof typeof ErrorSeverity];

export class AppError extends Error {
	public readonly statusCode: number;
	public readonly errorCode?: string | undefined;
	public readonly details?: AppErrorDetails | undefined;
	public readonly severity: ErrorSeverityType;

	constructor(
		message: string,
		statusCode: number = 500,
		severity: ErrorSeverityType = ErrorSeverity.RECOVERABLE,
		errorCode?: string,
		details?: AppErrorDetails
	) {
		super(message);
		this.statusCode = statusCode;
		this.severity = severity;
		this.errorCode = errorCode;
		this.details = details;
		Error.captureStackTrace(this, this.constructor);
	}
}

 export class AuthenticationError extends AppError {
	constructor(message: string, details?: AppErrorDetails) {
		super(
			message,
			401,
			ErrorSeverity.RECOVERABLE,
			'AUTH_ERROR',
			details
		);
		this.name = 'AuthenticationError';
	}
}

 export class AutoCorrectedInputWarning extends AppError {
	constructor(fieldName: string, details?: AppErrorDetails) {
		super(
			`${fieldName} was auto-corrected`,
			200,
			ErrorSeverity.WARNING,
			'AUTOCORRECT_WARNING',
			details
		);
		this.name = 'AutoCorrectedInputWarning';
	}
}

 export class ConfigurationError extends AppError {
    constructor(message = 'Configuration error', details?: AppErrorDetails) {
        super(
			message,
			500,
			ErrorSeverity.RECOVERABLE,
			'CONFIG_ERROR',
			details
		);
    }
}

 export class ConcurrencyError extends AppError {
	constructor(resource: string, details?: AppErrorDetails) {
		super(
			`Concurrency error on resource: ${resource}`,
			409,
			ErrorSeverity.RECOVERABLE,
			'CONCURRENCY_ERROR',
			details
		);
		this.name = 'ConcurrencyError';
	}
}

 export class ConflictError extends AppError {
    constructor(resource: string, details?: AppErrorDetails) {
 	   super(
 		   `Conflict: ${resource} already exists`,
 		   409,
 		   ErrorSeverity.RECOVERABLE,
 		   'CONFLICT_ERROR',
 		   details
 	   );
 	   this.name = 'ConflictError';
    }
}


 export class CriticalServiceUnavailableError extends AppError {
	constructor(service: string, details?: AppErrorDetails) {
		super(
			`${service} is currently unavailable`,
			503,
			ErrorSeverity.FATAL,
			'SERVICE_UNAVAILABLE',
			details
		);
		this.name = 'ServiceUnavailableError';
	}
}


 export class DatabaseError extends AppError {
	constructor(message: string, details?: AppErrorDetails) {
		super(
			message,
			500,
			ErrorSeverity.FATAL,
			'DATABASE_ERROR',
			details
		);
		this.name = 'DatabaseError';
	}
}

 export class DataIntegrityError extends AppError {
	constructor(details?: AppErrorDetails) {
		super(
			`Data integrity issue detected`,
			500,
			ErrorSeverity.FATAL,
			'DATA_INTEGRITY_ERROR',
			details
		);
		this.name = 'DataIntegrityError';
	}
}

 export class DependencyError extends AppError {
	constructor(dependencyName: string, details?: AppErrorDetails) {
		super(
			`Dependency ${dependencyName} failed`,
			500,
			ErrorSeverity.FATAL,
			'DEPENDENCY_ERROR',
			details
		);
		this.name = 'DependencyError';
	}
}

 export class DeprecatedApiWarning extends AppError {
	constructor(apiVersion: string, details?: AppErrorDetails) {
		super(
			`Deprecated API version ${apiVersion} used`,
			200,
			ErrorSeverity.INFO,
			'DEPRECATED_API_WARNING',
			details
		);
		this.name = 'DeprecatedApiWarning';
	}
}

 export class ExternalServiceError extends AppError {
    constructor(message = 'External service error', details?: AppErrorDetails) {
        super(
			message,
			503,
			ErrorSeverity.RECOVERABLE,
			'EXTERNAL_SERVICE_ERROR',
			details
		);
    }
}

 export class FallbackSuccessInfo extends AppError {
	constructor(service: string, details?: AppErrorDetails) {
		super(
			`Successfully fell back to ${service}`,
			200,
			ErrorSeverity.INFO,
			'FALLBACK_SUCCESS',
			details
		);
		this.name = 'FallbackSuccessInfo';
	}
}

 export class FileProcessingError extends AppError {
    constructor(message = 'File processing failed', details?: AppErrorDetails) {
        super(
			message,
			500,
			ErrorSeverity.RECOVERABLE,
			'FILE_PROCESSING_ERROR',
			details
		);
    }
}

 export class ForbiddenError extends AppError {
    constructor(action: string, details?: AppErrorDetails) {
 	   super(
 		   `Forbidden: You are not allowed to ${action}`,
 		   403,
 		   ErrorSeverity.RECOVERABLE,
 		   'FORBIDDEN',
 		   details
 	   );
 	   this.name = 'ForbiddenError';
    }
}

 export class InsufficientStorageError extends AppError {
	constructor(requiredSpace: number, availableSpace: number, details?: AppErrorDetails) {
		super(
			`Insufficient storage. Required: ${requiredSpace}MB, Available: ${availableSpace}MB`,
			507,
			ErrorSeverity.FATAL,
			'INSUFFICIENT_STORAGE',
			details
		);
		this.name = 'InsufficientStorageError';
	}
}

 export class InvalidCredentialsError extends AppError {
    constructor(details?: AppErrorDetails) {
 	   super(
 		   'Invalid credentials provided',
 		   401,
 		   ErrorSeverity.RECOVERABLE,
 		   'INVALID_CREDENTIALS',
 		   details
 	   );
 	   this.name = 'InvalidCredentialsError';
    }
}

 export class InvalidInputError extends AppError {
	constructor(inputName: string, details?: AppErrorDetails) {
		super(
			`Invalid input: ${inputName}`,
			400,
			ErrorSeverity.WARNING,
			'INVALID_INPUT',
			details
		);
		this.name = 'InvalidInputError';
	}
}

 export class InvalidConfigurationError extends AppError {
	constructor(configKey: string, details?: AppErrorDetails) {
		super(
			`Invalid or missing configuration for: ${configKey}`,
			500,
			ErrorSeverity.FATAL,
			'INVALID_CONFIGURATION',
			details
		);
		this.name = 'InvalidConfigurationError';
	}
}

 export class InvalidTokenError extends AppError {
	constructor(details?: AppErrorDetails) {
		super(
			'Invalid or expired token',
			401,
			ErrorSeverity.RECOVERABLE,
			'INVALID_TOKEN',
			details
		);
		this.name = 'InvalidTokenError';
	}
}

 export class MissingResourceError extends AppError {
	constructor(resource: string, details?: AppErrorDetails) {
		super(
			`${resource} not found`,
			404,
			ErrorSeverity.RECOVERABLE,
			'MISSING_RESOURCE',
			details
		);
		this.name = 'MissingResourceError';
	}
}

 export class PartialServiceFailureWarning extends AppError {
	constructor(serviceName: string, details?: AppErrorDetails) {
		super(
			`${serviceName} is partially failing`,
			500,
			ErrorSeverity.WARNING,
			'PARTIAL_SERVICE_FAILURE',
			details
		);
		this.name = 'PartialServiceFailureWarning';
	}
}

 export class PasswordValidationError extends AppError {
	constructor(message = 'Password validation error', details?: AppErrorDetails) {
		super(
			message,
			400,
			ErrorSeverity.WARNING,
			'PASSWORD_VALIDATION_ERROR',
			details
		);
		this.name = 'PasswordValidationError';
	}
}

 export class PermissionDeniedError extends AppError {
	constructor(action: string,	details?: AppErrorDetails) {
		super(
			`Permission denied for action: ${action}`,
			403,
			ErrorSeverity.RECOVERABLE,
			'PERMISSION_DENIED',
			details
		);
		this.name = 'PermissionDeniedError';
	}
}

 export class QuotaExceededError extends AppError {
	constructor(quotaName: string, limit: number, details?: AppErrorDetails) {
		super(
			`${quotaName} limit of ${limit} exceeded`,
			429,
			ErrorSeverity.RECOVERABLE,
			'QUOTA_EXCEEDED',
			details
		);
		this.name = 'QuotaExceededError';
	}
}

export class RateLimitError extends AppError {
	constructor(message: string, retryAfter?: number, details: AppErrorDetails = {}) {
		super(
			message,
			429,
			ErrorSeverity.RECOVERABLE,
			'RATE_LIMIT_EXCEEDED',
			{ ...details, retryAfter }
		);
		this.name = 'RateLimitError';
	}
}

 export class ServiceDegradedError extends AppError {
    constructor(service: string, details?: AppErrorDetails) {
 	   super(
 		   `${service} is degraded and functioning below capacity`,
 		   200,
 		   ErrorSeverity.WARNING,
 		   'SERVICE_DEGRADED',
 		   details
 	   );
 	   this.name = 'ServiceDegradedError';
    }
}


 export class SessionExpiredError extends AppError {
	constructor(details?: AppErrorDetails) {
		super(
			'Session expired',
			401,
			ErrorSeverity.RECOVERABLE,
			'SESSION_EXPIRED',
			details
		);
		this.name = 'SessionExpiredError';
	}
}

 export class SlowApiWarning extends AppError {
	constructor(apiName: string, responseTime: number, details?: AppErrorDetails) {
		super(
			`${apiName} is responding slowly`,
			200,
			ErrorSeverity.WARNING,
			'SLOW_API_WARNING',
			{ responseTime, ...details }
		);
		this.name = 'SlowApiWarning';
	}
}

 export class TimeoutError extends AppError {
	constructor(message = 'Request timed out', details?: AppErrorDetails) {
		super(
			message,
			504,
			ErrorSeverity.RECOVERABLE,
			'TIMEOUT_ERROR',
			details
		);
		this.name = 'TimeoutError';
	}
}

 export class UserActionInfo extends AppError {
	constructor(action: string, details?: AppErrorDetails) {
		super(
			`User performed action: ${action}`,
			200,
			ErrorSeverity.INFO,
			'USER_ACTION_LOGGED',
			details
		);
		this.name = 'UserActionInfo';
	}
}

 export class ValidationError extends AppError {
	constructor(message = 'Validation error', details?: AppErrorDetails) {
		super(
			message,
			400,
			ErrorSeverity.WARNING,
			'VALIDATION_ERROR',
			details
		);
		this.name = 'ValidationError';
	}
}

export const errorClasses = {
	AppError,
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
};
