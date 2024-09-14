import { FallbackSuccessInfo } from './appErrorClasses';
import {
	ClientError,
	ErrorDetails,
	ErrorSeverity,
	createQuotaExceededMessage,
	createRetryMessage,
	defaultRetryAfter
} from './errorClasses';

export class AuthenticationError extends ClientError {
	constructor(
		errorMessage: string = 'Authentication failed',
		details: ErrorDetails = {}
	) {
		super(
			errorMessage,
			401,
			ErrorSeverity.RECOVERABLE,
			'AUTH_ERROR',
			details
		);
		this.name = 'AuthenticationError';
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
			'AUTOCORRECT_WARNING',
			customDetails
		);
		this.name = 'AutoCorrectedInputWarning';
	}
}

export class DatabaseErrorRecoverable extends ClientError {
	constructor(
		errorMessage: string = 'Internal server error. Please try again later.',
		details: ErrorDetails = {}
	) {
		super(
			errorMessage,
			503,
			ErrorSeverity.RECOVERABLE,
			'DATABASE_ERROR_RECOVERABLE',
			details
		);
		this.name = 'DatabaseErrorRecoverable';
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
			'DEPRECATED_API_WARNING',
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
			'EXTERNAL_SERVICE_ERROR',
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
			'FILE_PROCESSING_ERROR',
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
			'FORBIDDEN',
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
			'INVALID_CREDENTIALS',
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
			'INVALID_INPUT',
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
			'INVALID_TOKEN',
			customDetails
		);
		this.name = 'InvalidTokenError';
	}
}

export class MissingResourceError extends ClientError {
	constructor(resource?: string, details: ErrorDetails = {}) {
		const errorMessage: string = resource
			? `${resource} not found`
			: 'Resource not found';

		const customDetails = resource ? { resource, ...details } : details;

		super(
			errorMessage,
			404,
			ErrorSeverity.RECOVERABLE,
			'MISSING_RESOURCE',
			customDetails
		);
		this.name = 'MissingResourceError';
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
			'PASSWORD_VALIDATION_ERROR',
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
			'PERMISSION_DENIED',
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
			'QUOTA_EXCEEDED',
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
			'QUOTA_EXCEEDED_WARNING',
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
			'RATE_LIMIT_EXCEEDED',
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
			'RATE_LIMIT_EXCEEDED_WARNING',
			customDetails
		);
		this.name = 'RateLimitErrorWarning';
	}
}

export class ServiceUnavailableError extends ClientError {
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
			'SERVICE_UNAVAILABLE',
			errorDetails
		);
		this.name = 'ServiceUnavailableError';
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
			'SESSION_EXPIRED',
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
			'TIMEOUT_ERROR',
			details
		);
		this.name = 'TimeoutError';
	}
}

export const clientErrorClasses = {
	AuthenticationError,
	AutoCorrectedInputWarning,
	DatabaseErrorRecoverable,
	DeprecatedApiWarning,
	ExternalServiceError,
	FallbackSuccessInfo,
	FileProcessingError,
	ForbiddenError,
	InvalidCredentialsError,
	InvalidInputError,
	InvalidTokenError,
	MissingResourceError,
	PasswordValidationError,
	PermissionDeniedError,
	QuotaExceededErrorRecoverable,
	QuotaExceededErrorWarning,
	RateLimitErrorRecoverable,
	RateLimitErrorWarning,
	ServiceUnavailableError,
	SessionExpiredError,
	TimeoutError
};
