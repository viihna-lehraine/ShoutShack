interface AppErrorDetails {
    retryAfter?: number | undefined;
    [key: string]: unknown;
}
export declare const ErrorSeverity: {
    readonly FATAL: "fatal";
    readonly RECOVERABLE: "recoverable";
    readonly WARNING: "warning";
    readonly INFO: "info";
};
export type ErrorSeverityType = typeof ErrorSeverity[keyof typeof ErrorSeverity];
export declare class AppError extends Error {
    readonly statusCode: number;
    readonly errorCode?: string | undefined;
    readonly details?: AppErrorDetails | undefined;
    readonly severity: ErrorSeverityType;
    constructor(message: string, statusCode?: number, severity?: ErrorSeverityType, errorCode?: string, details?: AppErrorDetails);
}
export declare class AuthenticationError extends AppError {
    constructor(message: string, details?: AppErrorDetails);
}
export declare class AutoCorrectedInputWarning extends AppError {
    constructor(fieldName: string, details?: AppErrorDetails);
}
export declare class ConfigurationError extends AppError {
    constructor(message?: string, details?: AppErrorDetails);
}
export declare class ConcurrencyError extends AppError {
    constructor(resource: string, details?: AppErrorDetails);
}
export declare class ConflictError extends AppError {
    constructor(resource: string, details?: AppErrorDetails);
}
export declare class CriticalServiceUnavailableError extends AppError {
    constructor(service: string, details?: AppErrorDetails);
}
export declare class DatabaseError extends AppError {
    constructor(message: string, details?: AppErrorDetails);
}
export declare class DataIntegrityError extends AppError {
    constructor(details?: AppErrorDetails);
}
export declare class DependencyError extends AppError {
    constructor(dependencyName: string, details?: AppErrorDetails);
}
export declare class DeprecatedApiWarning extends AppError {
    constructor(apiVersion: string, details?: AppErrorDetails);
}
export declare class ExternalServiceError extends AppError {
    constructor(message?: string, details?: AppErrorDetails);
}
export declare class FallbackSuccessInfo extends AppError {
    constructor(service: string, details?: AppErrorDetails);
}
export declare class FileProcessingError extends AppError {
    constructor(message?: string, details?: AppErrorDetails);
}
export declare class ForbiddenError extends AppError {
    constructor(action: string, details?: AppErrorDetails);
}
export declare class InsufficientStorageError extends AppError {
    constructor(requiredSpace: number, availableSpace: number, details?: AppErrorDetails);
}
export declare class InvalidCredentialsError extends AppError {
    constructor(details?: AppErrorDetails);
}
export declare class InvalidInputError extends AppError {
    constructor(inputName: string, details?: AppErrorDetails);
}
export declare class InvalidConfigurationError extends AppError {
    constructor(configKey: string, details?: AppErrorDetails);
}
export declare class InvalidTokenError extends AppError {
    constructor(details?: AppErrorDetails);
}
export declare class MissingResourceError extends AppError {
    constructor(resource: string, details?: AppErrorDetails);
}
export declare class PartialServiceFailureWarning extends AppError {
    constructor(serviceName: string, details?: AppErrorDetails);
}
export declare class PasswordValidationError extends AppError {
    constructor(message?: string, details?: AppErrorDetails);
}
export declare class PermissionDeniedError extends AppError {
    constructor(action: string, details?: AppErrorDetails);
}
export declare class QuotaExceededError extends AppError {
    constructor(quotaName: string, limit: number, details?: AppErrorDetails);
}
export declare class RateLimitError extends AppError {
    constructor(message: string, retryAfter?: number, details?: AppErrorDetails);
}
export declare class ServiceDegradedError extends AppError {
    constructor(service: string, details?: AppErrorDetails);
}
export declare class SessionExpiredError extends AppError {
    constructor(details?: AppErrorDetails);
}
export declare class SlowApiWarning extends AppError {
    constructor(apiName: string, responseTime: number, details?: AppErrorDetails);
}
export declare class TimeoutError extends AppError {
    constructor(message?: string, details?: AppErrorDetails);
}
export declare class UserActionInfo extends AppError {
    constructor(action: string, details?: AppErrorDetails);
}
export declare class ValidationError extends AppError {
    constructor(message?: string, details?: AppErrorDetails);
}
export declare const errorClasses: {
    AppError: typeof AppError;
    AuthenticationError: typeof AuthenticationError;
    AutoCorrectedInputWarning: typeof AutoCorrectedInputWarning;
    ConfigurationError: typeof ConfigurationError;
    ConcurrencyError: typeof ConcurrencyError;
    ConflictError: typeof ConflictError;
    CriticalServiceUnavailableError: typeof CriticalServiceUnavailableError;
    DatabaseError: typeof DatabaseError;
    DataIntegrityError: typeof DataIntegrityError;
    DependencyError: typeof DependencyError;
    DeprecatedApiWarning: typeof DeprecatedApiWarning;
    ExternalServiceError: typeof ExternalServiceError;
    FallbackSuccessInfo: typeof FallbackSuccessInfo;
    FileProcessingError: typeof FileProcessingError;
    ForbiddenError: typeof ForbiddenError;
    InsufficientStorageError: typeof InsufficientStorageError;
    InvalidCredentialsError: typeof InvalidCredentialsError;
    InvalidInputError: typeof InvalidInputError;
    InvalidConfigurationError: typeof InvalidConfigurationError;
    InvalidTokenError: typeof InvalidTokenError;
    MissingResourceError: typeof MissingResourceError;
    PartialServiceFailureWarning: typeof PartialServiceFailureWarning;
    PasswordValidationError: typeof PasswordValidationError;
    PermissionDeniedError: typeof PermissionDeniedError;
    QuotaExceededError: typeof QuotaExceededError;
    RateLimitError: typeof RateLimitError;
    ServiceDegradedError: typeof ServiceDegradedError;
    SessionExpiredError: typeof SessionExpiredError;
    SlowApiWarning: typeof SlowApiWarning;
    TimeoutError: typeof TimeoutError;
    UserActionInfo: typeof UserActionInfo;
    ValidationError: typeof ValidationError;
};
export {};
//# sourceMappingURL=errorClasses.d.ts.map