export interface ErrorDetails {
    retryAfter?: number | undefined;
    exposeToClient?: boolean;
    [key: string]: unknown;
}
export declare const ErrorSeverity: {
    readonly FATAL: "fatal";
    readonly RECOVERABLE: "recoverable";
    readonly WARNING: "warning";
    readonly INFO: "info";
};
export type ErrorSeverityType = (typeof ErrorSeverity)[keyof typeof ErrorSeverity];
export declare class RootError extends Error {
    readonly statusCode: number;
    readonly errorCode?: string | undefined;
    readonly details?: ErrorDetails | undefined;
    readonly severity: ErrorSeverityType;
    constructor(errorMessage: string, statusCode?: number, severity?: ErrorSeverityType, errorCode?: string, details?: ErrorDetails);
}
export declare class AppError extends RootError {
    constructor(errorMessage: string, statusCode?: number, severity?: ErrorSeverityType, errorCode?: string, details?: ErrorDetails);
}
export declare class ClientError extends RootError {
    constructor(errorMessage: string, statusCode?: number, severity?: ErrorSeverityType, errorCode?: string, details?: ErrorDetails);
}
export declare const defaultRetryAfter = 60;
export declare function setDefaultDetails(details?: ErrorDetails): ErrorDetails;
export declare function createRetryMessage(retryAfter?: number): string;
export declare function createQuotaExceededMessage(quotaName?: string, limit?: number, retryAfter?: number): string;
export declare class AppAuthenticationError extends AppError {
    constructor(errorMessage?: string, details?: ErrorDetails);
}
export declare class AuthControllerError extends AppError {
    constructor(errorMessage?: string, details?: ErrorDetails);
}
export declare class CacheServiceError extends AppError {
    constructor(errorMessage?: string, details?: ErrorDetails);
}
export declare class ConfigurationError extends AppError {
    constructor(errorMessage?: string, details?: ErrorDetails);
}
export declare class ConfigurationErrorFatal extends AppError {
    constructor(errorMessage?: string, details?: ErrorDetails);
}
export declare class ConcurrencyError extends AppError {
    constructor(resource?: string, details?: ErrorDetails);
}
export declare class ConflictError extends AppError {
    constructor(resource?: string, details?: ErrorDetails);
}
export declare class DatabaseErrorFatal extends AppError {
    constructor(errorMessage?: string, details?: ErrorDetails);
}
export declare class DatabaseErrorRecoverable extends AppError {
    constructor(errorMessage?: string, details?: ErrorDetails);
}
export declare class DataIntegrityError extends AppError {
    constructor(errorMessage?: string, details?: ErrorDetails);
}
export declare class DependencyErrorFatal extends AppError {
    constructor(errorMessage?: string, details?: ErrorDetails, dependencyName?: string);
}
export declare class DependencyErrorRecoverable extends AppError {
    constructor(errorMessage?: string, details?: ErrorDetails, dependencyName?: string);
}
export declare class ExpressError extends AppError {
    constructor(errorMessage?: string, details?: ErrorDetails);
}
export declare class ExpressRouteError extends AppError {
    constructor(errorMessage?: string, details?: ErrorDetails);
}
export declare class ExternalServiceErrorFatal extends AppError {
    constructor(errorMessage?: string, details?: ErrorDetails);
}
export declare class FallbackSuccessInfo extends AppError {
    constructor(service?: string, details?: ErrorDetails);
}
export declare class HealthCheckError extends AppError {
    constructor(errorMessage?: string, details?: ErrorDetails);
}
export declare class HTTPSClientErrorFatal extends AppError {
    constructor(errorMessage?: string, details?: ErrorDetails);
}
export declare class HTTPSServerErrorRecoverable extends AppError {
    constructor(errorMessage?: string, details?: ErrorDetails);
}
export declare class InsufficientStorageError extends AppError {
    constructor(requiredSpace?: number, availableSpace?: number, details?: ErrorDetails);
}
export declare class InvalidConfigurationError extends AppError {
    constructor(configKey?: string, details?: ErrorDetails);
}
export declare class MiddlewareServiceError extends AppError {
    constructor(errorMessage?: string, details?: ErrorDetails);
}
export declare class MissingResourceError extends AppError {
    constructor(resource?: string, details?: ErrorDetails);
}
export declare class PassportAuthServiceError extends AppError {
    constructor(errorMessage?: string, details?: ErrorDetails);
}
export declare class PartialServiceFailureWarning extends AppError {
    constructor(serviceName?: string, details?: ErrorDetails);
}
export declare class QuotaExceededErrorFatal extends AppError {
    constructor(retryAfter?: number, quotaName?: string, limit?: number, details?: ErrorDetails);
}
export declare class RateLimitErrorFatal extends AppError {
    constructor(retryAfter?: number, details?: ErrorDetails);
}
export declare class RedisServiceError extends AppError {
    constructor(errorMessage?: string, details?: ErrorDetails);
}
export declare class ResourceManagerError extends AppError {
    constructor(errorMessage?: string, details?: ErrorDetails);
}
export declare class RootMiddlewareError extends AppError {
    constructor(errorMessage?: string, details?: ErrorDetails);
}
export declare class ServerNotInitializedError extends AppError {
    constructor(errorMessage?: string, details?: ErrorDetails);
}
export declare class ServiceDegradedError extends AppError {
    constructor(service?: string, details?: ErrorDetails);
}
export declare class ServiceDegradedErrorMinor extends AppError {
    constructor(service: string, details?: ErrorDetails);
}
export declare class ServiceUnavailableError extends AppError {
    constructor(retryAfter?: number, service?: string, details?: ErrorDetails);
}
export declare class ServiceUnavailableErrorFatal extends AppError {
    constructor(service?: string, details?: ErrorDetails);
}
export declare class SlowApiWarning extends AppError {
    constructor(apiName?: string, responseTime?: number, details?: ErrorDetails);
}
export declare class UserActionInfo extends AppError {
    constructor(action?: string, details?: ErrorDetails);
}
export declare class UtilityErrorFatal extends AppError {
    constructor(utility?: string, details?: ErrorDetails);
}
export declare class UtilityErrorRecoverable extends AppError {
    constructor(utility?: string, details?: ErrorDetails);
}
export declare class ValidationError extends AppError {
    constructor(invalidFields?: string[], details?: ErrorDetails);
}
export declare class AutoCorrectedInputWarning extends ClientError {
    constructor(fieldName?: string, details?: ErrorDetails);
}
export declare class ClientAuthenticationError extends ClientError {
    constructor(errorMessage?: string, details?: ErrorDetails);
}
export declare class DeprecatedApiWarning extends ClientError {
    constructor(apiVersion?: string, details?: ErrorDetails);
}
export declare class ExternalServiceError extends ClientError {
    constructor(errorMessage?: string, details?: ErrorDetails);
}
export declare class FileProcessingError extends ClientError {
    constructor(retryAfter?: number, details?: ErrorDetails);
}
export declare class ForbiddenError extends ClientError {
    constructor(action?: string, details?: ErrorDetails);
}
export declare class InvalidCredentialsError extends ClientError {
    constructor(errorMessage?: string, details?: ErrorDetails);
}
export declare class InvalidInputError extends ClientError {
    constructor(inputName?: string, details?: ErrorDetails);
}
export declare class InvalidTokenError extends ClientError {
    constructor(errorMessage?: string, token?: string, details?: ErrorDetails);
}
export declare class PasswordValidationError extends ClientError {
    constructor(errorMessage?: string, details?: ErrorDetails);
}
export declare class PermissionDeniedError extends ClientError {
    constructor(errorMessage?: string, action?: string, details?: ErrorDetails);
}
export declare class QuotaExceededErrorRecoverable extends ClientError {
    constructor(retryAfter: number | undefined, quotaName: string, limit: number, details?: ErrorDetails);
}
export declare class QuotaExceededErrorWarning extends ClientError {
    constructor(retryAfter?: number, quotaName?: string, limit?: number, details?: ErrorDetails);
}
export declare class RateLimitErrorRecoverable extends ClientError {
    constructor(retryAfter?: number, details?: ErrorDetails);
}
export declare class RateLimitErrorWarning extends ClientError {
    constructor(retryAfter?: number, details?: ErrorDetails);
}
export declare class SessionExpiredError extends ClientError {
    constructor(errorMessage?: string, details?: ErrorDetails);
}
export declare class TimeoutError extends ClientError {
    constructor(errorMessage?: string, details?: ErrorDetails);
}
export declare class UserRegistrationError extends ClientError {
    constructor(errorMessage?: string, details?: ErrorDetails);
}
export declare const ErrorClasses: {
    AppAuthenticationError: typeof AppAuthenticationError;
    AuthControllerError: typeof AuthControllerError;
    AutoCorrectedInputWarning: typeof AutoCorrectedInputWarning;
    CacheServiceError: typeof CacheServiceError;
    ClientAuthenticationError: typeof ClientAuthenticationError;
    ConcurrencyError: typeof ConcurrencyError;
    ConfigurationError: typeof ConfigurationError;
    ConfigurationErrorFatal: typeof ConfigurationErrorFatal;
    ConflictError: typeof ConflictError;
    DatabaseErrorFatal: typeof DatabaseErrorFatal;
    DatabaseErrorRecoverable: typeof DatabaseErrorRecoverable;
    DataIntegrityError: typeof DataIntegrityError;
    DependencyErrorFatal: typeof DependencyErrorFatal;
    DependencyErrorRecoverable: typeof DependencyErrorRecoverable;
    DeprecatedApiWarning: typeof DeprecatedApiWarning;
    ExpressError: typeof ExpressError;
    ExpressRouteError: typeof ExpressRouteError;
    ExternalServiceError: typeof ExternalServiceError;
    ExternalServiceErrorFatal: typeof ExternalServiceErrorFatal;
    FallbackSuccessInfo: typeof FallbackSuccessInfo;
    FileProcessingError: typeof FileProcessingError;
    ForbiddenError: typeof ForbiddenError;
    HealthCheckError: typeof HealthCheckError;
    HTTPSClientErrorFatal: typeof HTTPSClientErrorFatal;
    HTTPSServerErrorRecoverable: typeof HTTPSServerErrorRecoverable;
    InsufficientStorageError: typeof InsufficientStorageError;
    InvalidCredentialsError: typeof InvalidCredentialsError;
    InvalidInputError: typeof InvalidInputError;
    InvalidTokenError: typeof InvalidTokenError;
    MiddlewareServiceError: typeof MiddlewareServiceError;
    MissingResourceError: typeof MissingResourceError;
    PassportAuthServiceError: typeof PassportAuthServiceError;
    PartialServiceFailureWarning: typeof PartialServiceFailureWarning;
    PasswordValidationError: typeof PasswordValidationError;
    PermissionDeniedError: typeof PermissionDeniedError;
    QuotaExceededErrorFatal: typeof QuotaExceededErrorFatal;
    QuotaExceededErrorRecoverable: typeof QuotaExceededErrorRecoverable;
    QuotaExceededErrorWarning: typeof QuotaExceededErrorWarning;
    RateLimitErrorFatal: typeof RateLimitErrorFatal;
    RateLimitErrorRecoverable: typeof RateLimitErrorRecoverable;
    RateLimitErrorWarning: typeof RateLimitErrorWarning;
    RedisServiceError: typeof RedisServiceError;
    ResourceManagerError: typeof ResourceManagerError;
    RootMiddlewareError: typeof RootMiddlewareError;
    ServerNotInitializedError: typeof ServerNotInitializedError;
    ServiceDegradedError: typeof ServiceDegradedError;
    ServiceDegradedErrorMinor: typeof ServiceDegradedErrorMinor;
    ServiceUnavailableError: typeof ServiceUnavailableError;
    ServiceUnavailableErrorFatal: typeof ServiceUnavailableErrorFatal;
    SessionExpiredError: typeof SessionExpiredError;
    SlowApiWarning: typeof SlowApiWarning;
    TimeoutError: typeof TimeoutError;
    UserActionInfo: typeof UserActionInfo;
    UserRegistrationError: typeof UserRegistrationError;
    UtilityErrorFatal: typeof UtilityErrorFatal;
    UtilityErrorRecoverable: typeof UtilityErrorRecoverable;
    ValidationError: typeof ValidationError;
};
//# sourceMappingURL=ErrorClasses.d.ts.map