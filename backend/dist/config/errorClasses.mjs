const errorCounts = new Map();
export const ErrorSeverity = {
	FATAL: 'fatal',
	RECOVERABLE: 'recoverable',
	WARNING: 'warning',
	INFO: 'info'
};
export class AppError extends Error {
	statusCode;
	errorCode;
	details;
	severity;
	constructor(
		message,
		statusCode = 500,
		severity = ErrorSeverity.RECOVERABLE,
		errorCode,
		details
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
	constructor(message, details) {
		super(message, 401, ErrorSeverity.RECOVERABLE, 'AUTH_ERROR', details);
		this.name = 'AuthenticationError';
	}
}
export class AutoCorrectedInputWarning extends AppError {
	constructor(fieldName, details) {
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
	constructor(message = 'Configuration error', details) {
		super(message, 500, ErrorSeverity.RECOVERABLE, 'CONFIG_ERROR', details);
	}
}
export class ConcurrencyError extends AppError {
	constructor(resource, details) {
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
	constructor(resource, details) {
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
	constructor(service, details) {
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
	constructor(message, details) {
		super(message, 500, ErrorSeverity.FATAL, 'DATABASE_ERROR', details);
		this.name = 'DatabaseError';
	}
}
export class DataIntegrityError extends AppError {
	constructor(details) {
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
	constructor(dependencyName, details) {
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
	constructor(apiVersion, details) {
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
	constructor(message = 'External service error', details) {
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
	constructor(service, details) {
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
	constructor(message = 'File processing failed', details) {
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
	constructor(action, details) {
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
	constructor(requiredSpace, availableSpace, details) {
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
	constructor(details) {
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
	constructor(inputName, details) {
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
	constructor(configKey, details) {
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
	constructor(details) {
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
	constructor(resource, details) {
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
	constructor(serviceName, details) {
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
	constructor(message = 'Password validation error', details) {
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
	constructor(action, details) {
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
	constructor(quotaName, limit, details) {
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
	constructor(message, retryAfter, details = {}) {
		super(message, 429, ErrorSeverity.RECOVERABLE, 'RATE_LIMIT_EXCEEDED', {
			...details,
			retryAfter
		});
		this.name = 'RateLimitError';
	}
}
export class ServiceDegradedError extends AppError {
	constructor(service, details) {
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
	constructor(details) {
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
	constructor(apiName, responseTime, details) {
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
	constructor(message = 'Request timed out', details) {
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
	constructor(action, details) {
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
	constructor(message = 'Validation error', details) {
		super(message, 400, ErrorSeverity.WARNING, 'VALIDATION_ERROR', details);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXJyb3JDbGFzc2VzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2NvbmZpZy9lcnJvckNsYXNzZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsTUFBTSxXQUFXLEdBQUcsSUFBSSxHQUFHLEVBQWtCLENBQUM7QUFPOUMsTUFBTSxDQUFDLE1BQU0sYUFBYSxHQUFHO0lBQzVCLEtBQUssRUFBRSxPQUFPO0lBQ2QsV0FBVyxFQUFFLGFBQWE7SUFDMUIsT0FBTyxFQUFFLFNBQVM7SUFDbEIsSUFBSSxFQUFFLE1BQU07Q0FDSCxDQUFDO0FBSVgsTUFBTSxPQUFPLFFBQVMsU0FBUSxLQUFLO0lBQ2xCLFVBQVUsQ0FBUztJQUNuQixTQUFTLENBQXNCO0lBQy9CLE9BQU8sQ0FBK0I7SUFDdEMsUUFBUSxDQUFvQjtJQUU1QyxZQUNDLE9BQWUsRUFDZixhQUFxQixHQUFHLEVBQ3hCLFdBQThCLGFBQWEsQ0FBQyxXQUFXLEVBQ3ZELFNBQWtCLEVBQ2xCLE9BQXlCO1FBRXpCLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNmLElBQUksQ0FBQyxVQUFVLEdBQUcsVUFBVSxDQUFDO1FBQzdCLElBQUksQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDO1FBQ3pCLElBQUksQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFDO1FBQzNCLElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO1FBQ3ZCLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO0lBQ2pELENBQUM7Q0FDRDtBQUVBLE1BQU0sT0FBTyxtQkFBb0IsU0FBUSxRQUFRO0lBQ2pELFlBQVksT0FBZSxFQUFFLE9BQXlCO1FBQ3JELEtBQUssQ0FDSixPQUFPLEVBQ1AsR0FBRyxFQUNILGFBQWEsQ0FBQyxXQUFXLEVBQ3pCLFlBQVksRUFDWixPQUFPLENBQ1AsQ0FBQztRQUNGLElBQUksQ0FBQyxJQUFJLEdBQUcscUJBQXFCLENBQUM7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LGFBQWE7SUFDYixrQkFBa0I7SUFDbEIsZUFBZTtJQUNmLG9CQUFvQjtJQUNwQixvQkFBb0I7SUFDcEIsbUJBQW1CO0lBQ25CLG1CQUFtQjtJQUNuQixjQUFjO0lBQ2Qsd0JBQXdCO0lBQ3hCLHVCQUF1QjtJQUN2QixpQkFBaUI7SUFDakIseUJBQXlCO0lBQ3pCLGlCQUFpQjtJQUNqQixvQkFBb0I7SUFDcEIsNEJBQTRCO0lBQzVCLHVCQUF1QjtJQUN2QixxQkFBcUI7SUFDckIsa0JBQWtCO0lBQ2xCLGNBQWM7SUFDZCxvQkFBb0I7SUFDcEIsbUJBQW1CO0lBQ25CLGNBQWM7SUFDZCxZQUFZO0lBQ1osY0FBYztJQUNkLGVBQWU7Q0FDZixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiY29uc3QgZXJyb3JDb3VudHMgPSBuZXcgTWFwPHN0cmluZywgbnVtYmVyPigpO1xuXG5pbnRlcmZhY2UgQXBwRXJyb3JEZXRhaWxzIHtcblx0cmV0cnlBZnRlcj86IG51bWJlciB8IHVuZGVmaW5lZDtcblx0W2tleTogc3RyaW5nXTogdW5rbm93bjtcbn1cblxuZXhwb3J0IGNvbnN0IEVycm9yU2V2ZXJpdHkgPSB7XG5cdEZBVEFMOiAnZmF0YWwnLFxuXHRSRUNPVkVSQUJMRTogJ3JlY292ZXJhYmxlJyxcblx0V0FSTklORzogJ3dhcm5pbmcnLFxuXHRJTkZPOiAnaW5mbydcbn0gYXMgY29uc3Q7XG5cbmV4cG9ydCB0eXBlIEVycm9yU2V2ZXJpdHlUeXBlID0gdHlwZW9mIEVycm9yU2V2ZXJpdHlba2V5b2YgdHlwZW9mIEVycm9yU2V2ZXJpdHldO1xuXG5leHBvcnQgY2xhc3MgQXBwRXJyb3IgZXh0ZW5kcyBFcnJvciB7XG5cdHB1YmxpYyByZWFkb25seSBzdGF0dXNDb2RlOiBudW1iZXI7XG5cdHB1YmxpYyByZWFkb25seSBlcnJvckNvZGU/OiBzdHJpbmcgfCB1bmRlZmluZWQ7XG5cdHB1YmxpYyByZWFkb25seSBkZXRhaWxzPzogQXBwRXJyb3JEZXRhaWxzIHwgdW5kZWZpbmVkO1xuXHRwdWJsaWMgcmVhZG9ubHkgc2V2ZXJpdHk6IEVycm9yU2V2ZXJpdHlUeXBlO1xuXG5cdGNvbnN0cnVjdG9yKFxuXHRcdG1lc3NhZ2U6IHN0cmluZyxcblx0XHRzdGF0dXNDb2RlOiBudW1iZXIgPSA1MDAsXG5cdFx0c2V2ZXJpdHk6IEVycm9yU2V2ZXJpdHlUeXBlID0gRXJyb3JTZXZlcml0eS5SRUNPVkVSQUJMRSxcblx0XHRlcnJvckNvZGU/OiBzdHJpbmcsXG5cdFx0ZGV0YWlscz86IEFwcEVycm9yRGV0YWlsc1xuXHQpIHtcblx0XHRzdXBlcihtZXNzYWdlKTtcblx0XHR0aGlzLnN0YXR1c0NvZGUgPSBzdGF0dXNDb2RlO1xuXHRcdHRoaXMuc2V2ZXJpdHkgPSBzZXZlcml0eTtcblx0XHR0aGlzLmVycm9yQ29kZSA9IGVycm9yQ29kZTtcblx0XHR0aGlzLmRldGFpbHMgPSBkZXRhaWxzO1xuXHRcdEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKHRoaXMsIHRoaXMuY29uc3RydWN0b3IpO1xuXHR9XG59XG5cbiBleHBvcnQgY2xhc3MgQXV0aGVudGljYXRpb25FcnJvciBleHRlbmRzIEFwcEVycm9yIHtcblx0Y29uc3RydWN0b3IobWVzc2FnZTogc3RyaW5nLCBkZXRhaWxzPzogQXBwRXJyb3JEZXRhaWxzKSB7XG5cdFx0c3VwZXIoXG5cdFx0XHRtZXNzYWdlLFxuXHRcdFx0NDAxLFxuXHRcdFx0RXJyb3JTZXZlcml0eS5SRUNPVkVSQUJMRSxcblx0XHRcdCdBVVRIX0VSUk9SJyxcblx0XHRcdGRldGFpbHNcblx0XHQpO1xuXHRcdHRoaXMubmFtZSA9ICdBdXRoZW50aWNhdGlvbkVycm9yJztcblx0fVxufVxuXG4gZXhwb3J0IGNsYXNzIEF1dG9Db3JyZWN0ZWRJbnB1dFdhcm5pbmcgZXh0ZW5kcyBBcHBFcnJvciB7XG5cdGNvbnN0cnVjdG9yKGZpZWxkTmFtZTogc3RyaW5nLCBkZXRhaWxzPzogQXBwRXJyb3JEZXRhaWxzKSB7XG5cdFx0c3VwZXIoXG5cdFx0XHRgJHtmaWVsZE5hbWV9IHdhcyBhdXRvLWNvcnJlY3RlZGAsXG5cdFx0XHQyMDAsXG5cdFx0XHRFcnJvclNldmVyaXR5LldBUk5JTkcsXG5cdFx0XHQnQVVUT0NPUlJFQ1RfV0FSTklORycsXG5cdFx0XHRkZXRhaWxzXG5cdFx0KTtcblx0XHR0aGlzLm5hbWUgPSAnQXV0b0NvcnJlY3RlZElucHV0V2FybmluZyc7XG5cdH1cbn1cblxuIGV4cG9ydCBjbGFzcyBDb25maWd1cmF0aW9uRXJyb3IgZXh0ZW5kcyBBcHBFcnJvciB7XG4gICAgY29uc3RydWN0b3IobWVzc2FnZSA9ICdDb25maWd1cmF0aW9uIGVycm9yJywgZGV0YWlscz86IEFwcEVycm9yRGV0YWlscykge1xuICAgICAgICBzdXBlcihcblx0XHRcdG1lc3NhZ2UsXG5cdFx0XHQ1MDAsXG5cdFx0XHRFcnJvclNldmVyaXR5LlJFQ09WRVJBQkxFLFxuXHRcdFx0J0NPTkZJR19FUlJPUicsXG5cdFx0XHRkZXRhaWxzXG5cdFx0KTtcbiAgICB9XG59XG5cbiBleHBvcnQgY2xhc3MgQ29uY3VycmVuY3lFcnJvciBleHRlbmRzIEFwcEVycm9yIHtcblx0Y29uc3RydWN0b3IocmVzb3VyY2U6IHN0cmluZywgZGV0YWlscz86IEFwcEVycm9yRGV0YWlscykge1xuXHRcdHN1cGVyKFxuXHRcdFx0YENvbmN1cnJlbmN5IGVycm9yIG9uIHJlc291cmNlOiAke3Jlc291cmNlfWAsXG5cdFx0XHQ0MDksXG5cdFx0XHRFcnJvclNldmVyaXR5LlJFQ09WRVJBQkxFLFxuXHRcdFx0J0NPTkNVUlJFTkNZX0VSUk9SJyxcblx0XHRcdGRldGFpbHNcblx0XHQpO1xuXHRcdHRoaXMubmFtZSA9ICdDb25jdXJyZW5jeUVycm9yJztcblx0fVxufVxuXG4gZXhwb3J0IGNsYXNzIENvbmZsaWN0RXJyb3IgZXh0ZW5kcyBBcHBFcnJvciB7XG4gICAgY29uc3RydWN0b3IocmVzb3VyY2U6IHN0cmluZywgZGV0YWlscz86IEFwcEVycm9yRGV0YWlscykge1xuIFx0ICAgc3VwZXIoXG4gXHRcdCAgIGBDb25mbGljdDogJHtyZXNvdXJjZX0gYWxyZWFkeSBleGlzdHNgLFxuIFx0XHQgICA0MDksXG4gXHRcdCAgIEVycm9yU2V2ZXJpdHkuUkVDT1ZFUkFCTEUsXG4gXHRcdCAgICdDT05GTElDVF9FUlJPUicsXG4gXHRcdCAgIGRldGFpbHNcbiBcdCAgICk7XG4gXHQgICB0aGlzLm5hbWUgPSAnQ29uZmxpY3RFcnJvcic7XG4gICAgfVxufVxuXG5cbiBleHBvcnQgY2xhc3MgQ3JpdGljYWxTZXJ2aWNlVW5hdmFpbGFibGVFcnJvciBleHRlbmRzIEFwcEVycm9yIHtcblx0Y29uc3RydWN0b3Ioc2VydmljZTogc3RyaW5nLCBkZXRhaWxzPzogQXBwRXJyb3JEZXRhaWxzKSB7XG5cdFx0c3VwZXIoXG5cdFx0XHRgJHtzZXJ2aWNlfSBpcyBjdXJyZW50bHkgdW5hdmFpbGFibGVgLFxuXHRcdFx0NTAzLFxuXHRcdFx0RXJyb3JTZXZlcml0eS5GQVRBTCxcblx0XHRcdCdTRVJWSUNFX1VOQVZBSUxBQkxFJyxcblx0XHRcdGRldGFpbHNcblx0XHQpO1xuXHRcdHRoaXMubmFtZSA9ICdTZXJ2aWNlVW5hdmFpbGFibGVFcnJvcic7XG5cdH1cbn1cblxuXG4gZXhwb3J0IGNsYXNzIERhdGFiYXNlRXJyb3IgZXh0ZW5kcyBBcHBFcnJvciB7XG5cdGNvbnN0cnVjdG9yKG1lc3NhZ2U6IHN0cmluZywgZGV0YWlscz86IEFwcEVycm9yRGV0YWlscykge1xuXHRcdHN1cGVyKFxuXHRcdFx0bWVzc2FnZSxcblx0XHRcdDUwMCxcblx0XHRcdEVycm9yU2V2ZXJpdHkuRkFUQUwsXG5cdFx0XHQnREFUQUJBU0VfRVJST1InLFxuXHRcdFx0ZGV0YWlsc1xuXHRcdCk7XG5cdFx0dGhpcy5uYW1lID0gJ0RhdGFiYXNlRXJyb3InO1xuXHR9XG59XG5cbiBleHBvcnQgY2xhc3MgRGF0YUludGVncml0eUVycm9yIGV4dGVuZHMgQXBwRXJyb3Ige1xuXHRjb25zdHJ1Y3RvcihkZXRhaWxzPzogQXBwRXJyb3JEZXRhaWxzKSB7XG5cdFx0c3VwZXIoXG5cdFx0XHRgRGF0YSBpbnRlZ3JpdHkgaXNzdWUgZGV0ZWN0ZWRgLFxuXHRcdFx0NTAwLFxuXHRcdFx0RXJyb3JTZXZlcml0eS5GQVRBTCxcblx0XHRcdCdEQVRBX0lOVEVHUklUWV9FUlJPUicsXG5cdFx0XHRkZXRhaWxzXG5cdFx0KTtcblx0XHR0aGlzLm5hbWUgPSAnRGF0YUludGVncml0eUVycm9yJztcblx0fVxufVxuXG4gZXhwb3J0IGNsYXNzIERlcGVuZGVuY3lFcnJvciBleHRlbmRzIEFwcEVycm9yIHtcblx0Y29uc3RydWN0b3IoZGVwZW5kZW5jeU5hbWU6IHN0cmluZywgZGV0YWlscz86IEFwcEVycm9yRGV0YWlscykge1xuXHRcdHN1cGVyKFxuXHRcdFx0YERlcGVuZGVuY3kgJHtkZXBlbmRlbmN5TmFtZX0gZmFpbGVkYCxcblx0XHRcdDUwMCxcblx0XHRcdEVycm9yU2V2ZXJpdHkuRkFUQUwsXG5cdFx0XHQnREVQRU5ERU5DWV9FUlJPUicsXG5cdFx0XHRkZXRhaWxzXG5cdFx0KTtcblx0XHR0aGlzLm5hbWUgPSAnRGVwZW5kZW5jeUVycm9yJztcblx0fVxufVxuXG4gZXhwb3J0IGNsYXNzIERlcHJlY2F0ZWRBcGlXYXJuaW5nIGV4dGVuZHMgQXBwRXJyb3Ige1xuXHRjb25zdHJ1Y3RvcihhcGlWZXJzaW9uOiBzdHJpbmcsIGRldGFpbHM/OiBBcHBFcnJvckRldGFpbHMpIHtcblx0XHRzdXBlcihcblx0XHRcdGBEZXByZWNhdGVkIEFQSSB2ZXJzaW9uICR7YXBpVmVyc2lvbn0gdXNlZGAsXG5cdFx0XHQyMDAsXG5cdFx0XHRFcnJvclNldmVyaXR5LklORk8sXG5cdFx0XHQnREVQUkVDQVRFRF9BUElfV0FSTklORycsXG5cdFx0XHRkZXRhaWxzXG5cdFx0KTtcblx0XHR0aGlzLm5hbWUgPSAnRGVwcmVjYXRlZEFwaVdhcm5pbmcnO1xuXHR9XG59XG5cbiBleHBvcnQgY2xhc3MgRXh0ZXJuYWxTZXJ2aWNlRXJyb3IgZXh0ZW5kcyBBcHBFcnJvciB7XG4gICAgY29uc3RydWN0b3IobWVzc2FnZSA9ICdFeHRlcm5hbCBzZXJ2aWNlIGVycm9yJywgZGV0YWlscz86IEFwcEVycm9yRGV0YWlscykge1xuICAgICAgICBzdXBlcihcblx0XHRcdG1lc3NhZ2UsXG5cdFx0XHQ1MDMsXG5cdFx0XHRFcnJvclNldmVyaXR5LlJFQ09WRVJBQkxFLFxuXHRcdFx0J0VYVEVSTkFMX1NFUlZJQ0VfRVJST1InLFxuXHRcdFx0ZGV0YWlsc1xuXHRcdCk7XG4gICAgfVxufVxuXG4gZXhwb3J0IGNsYXNzIEZhbGxiYWNrU3VjY2Vzc0luZm8gZXh0ZW5kcyBBcHBFcnJvciB7XG5cdGNvbnN0cnVjdG9yKHNlcnZpY2U6IHN0cmluZywgZGV0YWlscz86IEFwcEVycm9yRGV0YWlscykge1xuXHRcdHN1cGVyKFxuXHRcdFx0YFN1Y2Nlc3NmdWxseSBmZWxsIGJhY2sgdG8gJHtzZXJ2aWNlfWAsXG5cdFx0XHQyMDAsXG5cdFx0XHRFcnJvclNldmVyaXR5LklORk8sXG5cdFx0XHQnRkFMTEJBQ0tfU1VDQ0VTUycsXG5cdFx0XHRkZXRhaWxzXG5cdFx0KTtcblx0XHR0aGlzLm5hbWUgPSAnRmFsbGJhY2tTdWNjZXNzSW5mbyc7XG5cdH1cbn1cblxuIGV4cG9ydCBjbGFzcyBGaWxlUHJvY2Vzc2luZ0Vycm9yIGV4dGVuZHMgQXBwRXJyb3Ige1xuICAgIGNvbnN0cnVjdG9yKG1lc3NhZ2UgPSAnRmlsZSBwcm9jZXNzaW5nIGZhaWxlZCcsIGRldGFpbHM/OiBBcHBFcnJvckRldGFpbHMpIHtcbiAgICAgICAgc3VwZXIoXG5cdFx0XHRtZXNzYWdlLFxuXHRcdFx0NTAwLFxuXHRcdFx0RXJyb3JTZXZlcml0eS5SRUNPVkVSQUJMRSxcblx0XHRcdCdGSUxFX1BST0NFU1NJTkdfRVJST1InLFxuXHRcdFx0ZGV0YWlsc1xuXHRcdCk7XG4gICAgfVxufVxuXG4gZXhwb3J0IGNsYXNzIEZvcmJpZGRlbkVycm9yIGV4dGVuZHMgQXBwRXJyb3Ige1xuICAgIGNvbnN0cnVjdG9yKGFjdGlvbjogc3RyaW5nLCBkZXRhaWxzPzogQXBwRXJyb3JEZXRhaWxzKSB7XG4gXHQgICBzdXBlcihcbiBcdFx0ICAgYEZvcmJpZGRlbjogWW91IGFyZSBub3QgYWxsb3dlZCB0byAke2FjdGlvbn1gLFxuIFx0XHQgICA0MDMsXG4gXHRcdCAgIEVycm9yU2V2ZXJpdHkuUkVDT1ZFUkFCTEUsXG4gXHRcdCAgICdGT1JCSURERU4nLFxuIFx0XHQgICBkZXRhaWxzXG4gXHQgICApO1xuIFx0ICAgdGhpcy5uYW1lID0gJ0ZvcmJpZGRlbkVycm9yJztcbiAgICB9XG59XG5cbiBleHBvcnQgY2xhc3MgSW5zdWZmaWNpZW50U3RvcmFnZUVycm9yIGV4dGVuZHMgQXBwRXJyb3Ige1xuXHRjb25zdHJ1Y3RvcihyZXF1aXJlZFNwYWNlOiBudW1iZXIsIGF2YWlsYWJsZVNwYWNlOiBudW1iZXIsIGRldGFpbHM/OiBBcHBFcnJvckRldGFpbHMpIHtcblx0XHRzdXBlcihcblx0XHRcdGBJbnN1ZmZpY2llbnQgc3RvcmFnZS4gUmVxdWlyZWQ6ICR7cmVxdWlyZWRTcGFjZX1NQiwgQXZhaWxhYmxlOiAke2F2YWlsYWJsZVNwYWNlfU1CYCxcblx0XHRcdDUwNyxcblx0XHRcdEVycm9yU2V2ZXJpdHkuRkFUQUwsXG5cdFx0XHQnSU5TVUZGSUNJRU5UX1NUT1JBR0UnLFxuXHRcdFx0ZGV0YWlsc1xuXHRcdCk7XG5cdFx0dGhpcy5uYW1lID0gJ0luc3VmZmljaWVudFN0b3JhZ2VFcnJvcic7XG5cdH1cbn1cblxuIGV4cG9ydCBjbGFzcyBJbnZhbGlkQ3JlZGVudGlhbHNFcnJvciBleHRlbmRzIEFwcEVycm9yIHtcbiAgICBjb25zdHJ1Y3RvcihkZXRhaWxzPzogQXBwRXJyb3JEZXRhaWxzKSB7XG4gXHQgICBzdXBlcihcbiBcdFx0ICAgJ0ludmFsaWQgY3JlZGVudGlhbHMgcHJvdmlkZWQnLFxuIFx0XHQgICA0MDEsXG4gXHRcdCAgIEVycm9yU2V2ZXJpdHkuUkVDT1ZFUkFCTEUsXG4gXHRcdCAgICdJTlZBTElEX0NSRURFTlRJQUxTJyxcbiBcdFx0ICAgZGV0YWlsc1xuIFx0ICAgKTtcbiBcdCAgIHRoaXMubmFtZSA9ICdJbnZhbGlkQ3JlZGVudGlhbHNFcnJvcic7XG4gICAgfVxufVxuXG4gZXhwb3J0IGNsYXNzIEludmFsaWRJbnB1dEVycm9yIGV4dGVuZHMgQXBwRXJyb3Ige1xuXHRjb25zdHJ1Y3RvcihpbnB1dE5hbWU6IHN0cmluZywgZGV0YWlscz86IEFwcEVycm9yRGV0YWlscykge1xuXHRcdHN1cGVyKFxuXHRcdFx0YEludmFsaWQgaW5wdXQ6ICR7aW5wdXROYW1lfWAsXG5cdFx0XHQ0MDAsXG5cdFx0XHRFcnJvclNldmVyaXR5LldBUk5JTkcsXG5cdFx0XHQnSU5WQUxJRF9JTlBVVCcsXG5cdFx0XHRkZXRhaWxzXG5cdFx0KTtcblx0XHR0aGlzLm5hbWUgPSAnSW52YWxpZElucHV0RXJyb3InO1xuXHR9XG59XG5cbiBleHBvcnQgY2xhc3MgSW52YWxpZENvbmZpZ3VyYXRpb25FcnJvciBleHRlbmRzIEFwcEVycm9yIHtcblx0Y29uc3RydWN0b3IoY29uZmlnS2V5OiBzdHJpbmcsIGRldGFpbHM/OiBBcHBFcnJvckRldGFpbHMpIHtcblx0XHRzdXBlcihcblx0XHRcdGBJbnZhbGlkIG9yIG1pc3NpbmcgY29uZmlndXJhdGlvbiBmb3I6ICR7Y29uZmlnS2V5fWAsXG5cdFx0XHQ1MDAsXG5cdFx0XHRFcnJvclNldmVyaXR5LkZBVEFMLFxuXHRcdFx0J0lOVkFMSURfQ09ORklHVVJBVElPTicsXG5cdFx0XHRkZXRhaWxzXG5cdFx0KTtcblx0XHR0aGlzLm5hbWUgPSAnSW52YWxpZENvbmZpZ3VyYXRpb25FcnJvcic7XG5cdH1cbn1cblxuIGV4cG9ydCBjbGFzcyBJbnZhbGlkVG9rZW5FcnJvciBleHRlbmRzIEFwcEVycm9yIHtcblx0Y29uc3RydWN0b3IoZGV0YWlscz86IEFwcEVycm9yRGV0YWlscykge1xuXHRcdHN1cGVyKFxuXHRcdFx0J0ludmFsaWQgb3IgZXhwaXJlZCB0b2tlbicsXG5cdFx0XHQ0MDEsXG5cdFx0XHRFcnJvclNldmVyaXR5LlJFQ09WRVJBQkxFLFxuXHRcdFx0J0lOVkFMSURfVE9LRU4nLFxuXHRcdFx0ZGV0YWlsc1xuXHRcdCk7XG5cdFx0dGhpcy5uYW1lID0gJ0ludmFsaWRUb2tlbkVycm9yJztcblx0fVxufVxuXG4gZXhwb3J0IGNsYXNzIE1pc3NpbmdSZXNvdXJjZUVycm9yIGV4dGVuZHMgQXBwRXJyb3Ige1xuXHRjb25zdHJ1Y3RvcihyZXNvdXJjZTogc3RyaW5nLCBkZXRhaWxzPzogQXBwRXJyb3JEZXRhaWxzKSB7XG5cdFx0c3VwZXIoXG5cdFx0XHRgJHtyZXNvdXJjZX0gbm90IGZvdW5kYCxcblx0XHRcdDQwNCxcblx0XHRcdEVycm9yU2V2ZXJpdHkuUkVDT1ZFUkFCTEUsXG5cdFx0XHQnTUlTU0lOR19SRVNPVVJDRScsXG5cdFx0XHRkZXRhaWxzXG5cdFx0KTtcblx0XHR0aGlzLm5hbWUgPSAnTWlzc2luZ1Jlc291cmNlRXJyb3InO1xuXHR9XG59XG5cbiBleHBvcnQgY2xhc3MgUGFydGlhbFNlcnZpY2VGYWlsdXJlV2FybmluZyBleHRlbmRzIEFwcEVycm9yIHtcblx0Y29uc3RydWN0b3Ioc2VydmljZU5hbWU6IHN0cmluZywgZGV0YWlscz86IEFwcEVycm9yRGV0YWlscykge1xuXHRcdHN1cGVyKFxuXHRcdFx0YCR7c2VydmljZU5hbWV9IGlzIHBhcnRpYWxseSBmYWlsaW5nYCxcblx0XHRcdDUwMCxcblx0XHRcdEVycm9yU2V2ZXJpdHkuV0FSTklORyxcblx0XHRcdCdQQVJUSUFMX1NFUlZJQ0VfRkFJTFVSRScsXG5cdFx0XHRkZXRhaWxzXG5cdFx0KTtcblx0XHR0aGlzLm5hbWUgPSAnUGFydGlhbFNlcnZpY2VGYWlsdXJlV2FybmluZyc7XG5cdH1cbn1cblxuIGV4cG9ydCBjbGFzcyBQYXNzd29yZFZhbGlkYXRpb25FcnJvciBleHRlbmRzIEFwcEVycm9yIHtcblx0Y29uc3RydWN0b3IobWVzc2FnZSA9ICdQYXNzd29yZCB2YWxpZGF0aW9uIGVycm9yJywgZGV0YWlscz86IEFwcEVycm9yRGV0YWlscykge1xuXHRcdHN1cGVyKFxuXHRcdFx0bWVzc2FnZSxcblx0XHRcdDQwMCxcblx0XHRcdEVycm9yU2V2ZXJpdHkuV0FSTklORyxcblx0XHRcdCdQQVNTV09SRF9WQUxJREFUSU9OX0VSUk9SJyxcblx0XHRcdGRldGFpbHNcblx0XHQpO1xuXHRcdHRoaXMubmFtZSA9ICdQYXNzd29yZFZhbGlkYXRpb25FcnJvcic7XG5cdH1cbn1cblxuIGV4cG9ydCBjbGFzcyBQZXJtaXNzaW9uRGVuaWVkRXJyb3IgZXh0ZW5kcyBBcHBFcnJvciB7XG5cdGNvbnN0cnVjdG9yKGFjdGlvbjogc3RyaW5nLFx0ZGV0YWlscz86IEFwcEVycm9yRGV0YWlscykge1xuXHRcdHN1cGVyKFxuXHRcdFx0YFBlcm1pc3Npb24gZGVuaWVkIGZvciBhY3Rpb246ICR7YWN0aW9ufWAsXG5cdFx0XHQ0MDMsXG5cdFx0XHRFcnJvclNldmVyaXR5LlJFQ09WRVJBQkxFLFxuXHRcdFx0J1BFUk1JU1NJT05fREVOSUVEJyxcblx0XHRcdGRldGFpbHNcblx0XHQpO1xuXHRcdHRoaXMubmFtZSA9ICdQZXJtaXNzaW9uRGVuaWVkRXJyb3InO1xuXHR9XG59XG5cbiBleHBvcnQgY2xhc3MgUXVvdGFFeGNlZWRlZEVycm9yIGV4dGVuZHMgQXBwRXJyb3Ige1xuXHRjb25zdHJ1Y3RvcihxdW90YU5hbWU6IHN0cmluZywgbGltaXQ6IG51bWJlciwgZGV0YWlscz86IEFwcEVycm9yRGV0YWlscykge1xuXHRcdHN1cGVyKFxuXHRcdFx0YCR7cXVvdGFOYW1lfSBsaW1pdCBvZiAke2xpbWl0fSBleGNlZWRlZGAsXG5cdFx0XHQ0MjksXG5cdFx0XHRFcnJvclNldmVyaXR5LlJFQ09WRVJBQkxFLFxuXHRcdFx0J1FVT1RBX0VYQ0VFREVEJyxcblx0XHRcdGRldGFpbHNcblx0XHQpO1xuXHRcdHRoaXMubmFtZSA9ICdRdW90YUV4Y2VlZGVkRXJyb3InO1xuXHR9XG59XG5cbmV4cG9ydCBjbGFzcyBSYXRlTGltaXRFcnJvciBleHRlbmRzIEFwcEVycm9yIHtcblx0Y29uc3RydWN0b3IobWVzc2FnZTogc3RyaW5nLCByZXRyeUFmdGVyPzogbnVtYmVyLCBkZXRhaWxzOiBBcHBFcnJvckRldGFpbHMgPSB7fSkge1xuXHRcdHN1cGVyKFxuXHRcdFx0bWVzc2FnZSxcblx0XHRcdDQyOSxcblx0XHRcdEVycm9yU2V2ZXJpdHkuUkVDT1ZFUkFCTEUsXG5cdFx0XHQnUkFURV9MSU1JVF9FWENFRURFRCcsXG5cdFx0XHR7IC4uLmRldGFpbHMsIHJldHJ5QWZ0ZXIgfVxuXHRcdCk7XG5cdFx0dGhpcy5uYW1lID0gJ1JhdGVMaW1pdEVycm9yJztcblx0fVxufVxuXG4gZXhwb3J0IGNsYXNzIFNlcnZpY2VEZWdyYWRlZEVycm9yIGV4dGVuZHMgQXBwRXJyb3Ige1xuICAgIGNvbnN0cnVjdG9yKHNlcnZpY2U6IHN0cmluZywgZGV0YWlscz86IEFwcEVycm9yRGV0YWlscykge1xuIFx0ICAgc3VwZXIoXG4gXHRcdCAgIGAke3NlcnZpY2V9IGlzIGRlZ3JhZGVkIGFuZCBmdW5jdGlvbmluZyBiZWxvdyBjYXBhY2l0eWAsXG4gXHRcdCAgIDIwMCxcbiBcdFx0ICAgRXJyb3JTZXZlcml0eS5XQVJOSU5HLFxuIFx0XHQgICAnU0VSVklDRV9ERUdSQURFRCcsXG4gXHRcdCAgIGRldGFpbHNcbiBcdCAgICk7XG4gXHQgICB0aGlzLm5hbWUgPSAnU2VydmljZURlZ3JhZGVkRXJyb3InO1xuICAgIH1cbn1cblxuXG4gZXhwb3J0IGNsYXNzIFNlc3Npb25FeHBpcmVkRXJyb3IgZXh0ZW5kcyBBcHBFcnJvciB7XG5cdGNvbnN0cnVjdG9yKGRldGFpbHM/OiBBcHBFcnJvckRldGFpbHMpIHtcblx0XHRzdXBlcihcblx0XHRcdCdTZXNzaW9uIGV4cGlyZWQnLFxuXHRcdFx0NDAxLFxuXHRcdFx0RXJyb3JTZXZlcml0eS5SRUNPVkVSQUJMRSxcblx0XHRcdCdTRVNTSU9OX0VYUElSRUQnLFxuXHRcdFx0ZGV0YWlsc1xuXHRcdCk7XG5cdFx0dGhpcy5uYW1lID0gJ1Nlc3Npb25FeHBpcmVkRXJyb3InO1xuXHR9XG59XG5cbiBleHBvcnQgY2xhc3MgU2xvd0FwaVdhcm5pbmcgZXh0ZW5kcyBBcHBFcnJvciB7XG5cdGNvbnN0cnVjdG9yKGFwaU5hbWU6IHN0cmluZywgcmVzcG9uc2VUaW1lOiBudW1iZXIsIGRldGFpbHM/OiBBcHBFcnJvckRldGFpbHMpIHtcblx0XHRzdXBlcihcblx0XHRcdGAke2FwaU5hbWV9IGlzIHJlc3BvbmRpbmcgc2xvd2x5YCxcblx0XHRcdDIwMCxcblx0XHRcdEVycm9yU2V2ZXJpdHkuV0FSTklORyxcblx0XHRcdCdTTE9XX0FQSV9XQVJOSU5HJyxcblx0XHRcdHsgcmVzcG9uc2VUaW1lLCAuLi5kZXRhaWxzIH1cblx0XHQpO1xuXHRcdHRoaXMubmFtZSA9ICdTbG93QXBpV2FybmluZyc7XG5cdH1cbn1cblxuIGV4cG9ydCBjbGFzcyBUaW1lb3V0RXJyb3IgZXh0ZW5kcyBBcHBFcnJvciB7XG5cdGNvbnN0cnVjdG9yKG1lc3NhZ2UgPSAnUmVxdWVzdCB0aW1lZCBvdXQnLCBkZXRhaWxzPzogQXBwRXJyb3JEZXRhaWxzKSB7XG5cdFx0c3VwZXIoXG5cdFx0XHRtZXNzYWdlLFxuXHRcdFx0NTA0LFxuXHRcdFx0RXJyb3JTZXZlcml0eS5SRUNPVkVSQUJMRSxcblx0XHRcdCdUSU1FT1VUX0VSUk9SJyxcblx0XHRcdGRldGFpbHNcblx0XHQpO1xuXHRcdHRoaXMubmFtZSA9ICdUaW1lb3V0RXJyb3InO1xuXHR9XG59XG5cbiBleHBvcnQgY2xhc3MgVXNlckFjdGlvbkluZm8gZXh0ZW5kcyBBcHBFcnJvciB7XG5cdGNvbnN0cnVjdG9yKGFjdGlvbjogc3RyaW5nLCBkZXRhaWxzPzogQXBwRXJyb3JEZXRhaWxzKSB7XG5cdFx0c3VwZXIoXG5cdFx0XHRgVXNlciBwZXJmb3JtZWQgYWN0aW9uOiAke2FjdGlvbn1gLFxuXHRcdFx0MjAwLFxuXHRcdFx0RXJyb3JTZXZlcml0eS5JTkZPLFxuXHRcdFx0J1VTRVJfQUNUSU9OX0xPR0dFRCcsXG5cdFx0XHRkZXRhaWxzXG5cdFx0KTtcblx0XHR0aGlzLm5hbWUgPSAnVXNlckFjdGlvbkluZm8nO1xuXHR9XG59XG5cbiBleHBvcnQgY2xhc3MgVmFsaWRhdGlvbkVycm9yIGV4dGVuZHMgQXBwRXJyb3Ige1xuXHRjb25zdHJ1Y3RvcihtZXNzYWdlID0gJ1ZhbGlkYXRpb24gZXJyb3InLCBkZXRhaWxzPzogQXBwRXJyb3JEZXRhaWxzKSB7XG5cdFx0c3VwZXIoXG5cdFx0XHRtZXNzYWdlLFxuXHRcdFx0NDAwLFxuXHRcdFx0RXJyb3JTZXZlcml0eS5XQVJOSU5HLFxuXHRcdFx0J1ZBTElEQVRJT05fRVJST1InLFxuXHRcdFx0ZGV0YWlsc1xuXHRcdCk7XG5cdFx0dGhpcy5uYW1lID0gJ1ZhbGlkYXRpb25FcnJvcic7XG5cdH1cbn1cblxuZXhwb3J0IGNvbnN0IGVycm9yQ2xhc3NlcyA9IHtcblx0QXBwRXJyb3IsXG5cdEF1dGhlbnRpY2F0aW9uRXJyb3IsXG5cdEF1dG9Db3JyZWN0ZWRJbnB1dFdhcm5pbmcsXG5cdENvbmZpZ3VyYXRpb25FcnJvcixcblx0Q29uY3VycmVuY3lFcnJvcixcblx0Q29uZmxpY3RFcnJvcixcblx0Q3JpdGljYWxTZXJ2aWNlVW5hdmFpbGFibGVFcnJvcixcblx0RGF0YWJhc2VFcnJvcixcblx0RGF0YUludGVncml0eUVycm9yLFxuXHREZXBlbmRlbmN5RXJyb3IsXG5cdERlcHJlY2F0ZWRBcGlXYXJuaW5nLFxuXHRFeHRlcm5hbFNlcnZpY2VFcnJvcixcblx0RmFsbGJhY2tTdWNjZXNzSW5mbyxcblx0RmlsZVByb2Nlc3NpbmdFcnJvcixcblx0Rm9yYmlkZGVuRXJyb3IsXG5cdEluc3VmZmljaWVudFN0b3JhZ2VFcnJvcixcblx0SW52YWxpZENyZWRlbnRpYWxzRXJyb3IsXG5cdEludmFsaWRJbnB1dEVycm9yLFxuXHRJbnZhbGlkQ29uZmlndXJhdGlvbkVycm9yLFxuXHRJbnZhbGlkVG9rZW5FcnJvcixcblx0TWlzc2luZ1Jlc291cmNlRXJyb3IsXG5cdFBhcnRpYWxTZXJ2aWNlRmFpbHVyZVdhcm5pbmcsXG5cdFBhc3N3b3JkVmFsaWRhdGlvbkVycm9yLFxuXHRQZXJtaXNzaW9uRGVuaWVkRXJyb3IsXG5cdFF1b3RhRXhjZWVkZWRFcnJvcixcblx0UmF0ZUxpbWl0RXJyb3IsXG5cdFNlcnZpY2VEZWdyYWRlZEVycm9yLFxuXHRTZXNzaW9uRXhwaXJlZEVycm9yLFxuXHRTbG93QXBpV2FybmluZyxcblx0VGltZW91dEVycm9yLFxuXHRVc2VyQWN0aW9uSW5mbyxcblx0VmFsaWRhdGlvbkVycm9yXG59O1xuIl19