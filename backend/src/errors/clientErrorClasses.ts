import { FallbackSuccessInfo } from './appErrorClasses';
import {
	ClientError,
	ErrorDetails,
	ErrorSeverity,
	createQuotaExceededMessage,
	createRetryMessage,
	defaultRetryAfter
} from './errorClasses';
import { ERROR_CODES } from './errorCodes';

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

export const clientErrorClasses = {
	AutoCorrectedInputWarning,
	ClientAuthenticationError,
	DeprecatedApiWarning,
	ExternalServiceError,
	FallbackSuccessInfo,
	FileProcessingError,
	ForbiddenError,
	InvalidCredentialsError,
	InvalidInputError,
	InvalidTokenError,
	PasswordValidationError,
	PermissionDeniedError,
	QuotaExceededErrorRecoverable,
	QuotaExceededErrorWarning,
	RateLimitErrorRecoverable,
	RateLimitErrorWarning,
	SessionExpiredError,
	TimeoutError,
	UserRegistrationError
};
