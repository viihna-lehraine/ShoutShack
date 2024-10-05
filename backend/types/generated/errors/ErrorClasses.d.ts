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
export declare const ErrorClasses: {
    AutoCorrectedInputWarning: typeof import("./ClientErrorClasses").AutoCorrectedInputWarning;
    ClientAuthenticationError: typeof import("./ClientErrorClasses").ClientAuthenticationError;
    DeprecatedApiWarning: typeof import("./ClientErrorClasses").DeprecatedApiWarning;
    ExternalServiceError: typeof import("./ClientErrorClasses").ExternalServiceError;
    FallbackSuccessInfo: typeof import("./AppErrorClasses").FallbackSuccessInfo;
    FileProcessingError: typeof import("./ClientErrorClasses").FileProcessingError;
    ForbiddenError: typeof import("./ClientErrorClasses").ForbiddenError;
    InvalidCredentialsError: typeof import("./ClientErrorClasses").InvalidCredentialsError;
    InvalidInputError: typeof import("./ClientErrorClasses").InvalidInputError;
    InvalidTokenError: typeof import("./ClientErrorClasses").InvalidTokenError;
    PasswordValidationError: typeof import("./ClientErrorClasses").PasswordValidationError;
    PermissionDeniedError: typeof import("./ClientErrorClasses").PermissionDeniedError;
    QuotaExceededErrorRecoverable: typeof import("./ClientErrorClasses").QuotaExceededErrorRecoverable;
    QuotaExceededErrorWarning: typeof import("./ClientErrorClasses").QuotaExceededErrorWarning;
    RateLimitErrorRecoverable: typeof import("./ClientErrorClasses").RateLimitErrorRecoverable;
    RateLimitErrorWarning: typeof import("./ClientErrorClasses").RateLimitErrorWarning;
    SessionExpiredError: typeof import("./ClientErrorClasses").SessionExpiredError;
    TimeoutError: typeof import("./ClientErrorClasses").TimeoutError;
    UserRegistrationError: typeof import("./ClientErrorClasses").UserRegistrationError;
    AppAuthenticationError: typeof import("./AppErrorClasses").AppAuthenticationError;
    AuthControllerError: typeof import("./AppErrorClasses").AuthControllerError;
    CacheServiceError: typeof import("./AppErrorClasses").CacheServiceError;
    ConfigurationError: typeof import("./AppErrorClasses").ConfigurationError;
    ConfigurationErrorFatal: typeof import("./AppErrorClasses").ConfigurationErrorFatal;
    ConcurrencyError: typeof import("./AppErrorClasses").ConcurrencyError;
    ConflictError: typeof import("./AppErrorClasses").ConflictError;
    DatabaseErrorFatal: typeof import("./AppErrorClasses").DatabaseErrorFatal;
    DatabaseErrorRecoverable: typeof import("./AppErrorClasses").DatabaseErrorRecoverable;
    DataIntegrityError: typeof import("./AppErrorClasses").DataIntegrityError;
    DependencyErrorFatal: typeof import("./AppErrorClasses").DependencyErrorFatal;
    DependencyErrorRecoverable: typeof import("./AppErrorClasses").DependencyErrorRecoverable;
    ExpressError: typeof import("./AppErrorClasses").ExpressError;
    ExpressRouteError: typeof import("./AppErrorClasses").ExpressRouteError;
    ExternalServiceErrorFatal: typeof import("./AppErrorClasses").ExternalServiceErrorFatal;
    HealthCheckError: typeof import("./AppErrorClasses").HealthCheckError;
    HTTPSClientErrorFatal: typeof import("./AppErrorClasses").HTTPSClientErrorFatal;
    HTTPSServerErrorRecoverable: typeof import("./AppErrorClasses").HTTPSServerErrorRecoverable;
    InsufficientStorageError: typeof import("./AppErrorClasses").InsufficientStorageError;
    MiddlewareServiceError: typeof import("./AppErrorClasses").MiddlewareServiceError;
    MissingResourceError: typeof import("./AppErrorClasses").MissingResourceError;
    PassportAuthServiceError: typeof import("./AppErrorClasses").PassportAuthServiceError;
    PartialServiceFailureWarning: typeof import("./AppErrorClasses").PartialServiceFailureWarning;
    QuotaExceededErrorFatal: typeof import("./AppErrorClasses").QuotaExceededErrorFatal;
    RateLimitErrorFatal: typeof import("./AppErrorClasses").RateLimitErrorFatal;
    RedisServiceError: typeof import("./AppErrorClasses").RedisServiceError;
    ResourceManagerError: typeof import("./AppErrorClasses").ResourceManagerError;
    RootMiddlewareError: typeof import("./AppErrorClasses").RootMiddlewareError;
    ServerNotInitializedError: typeof import("./AppErrorClasses").ServerNotInitializedError;
    ServiceDegradedError: typeof import("./AppErrorClasses").ServiceDegradedError;
    ServiceDegradedErrorMinor: typeof import("./AppErrorClasses").ServiceDegradedErrorMinor;
    ServiceUnavailableError: typeof import("./AppErrorClasses").ServiceUnavailableError;
    ServiceUnavailableErrorFatal: typeof import("./AppErrorClasses").ServiceUnavailableErrorFatal;
    SlowApiWarning: typeof import("./AppErrorClasses").SlowApiWarning;
    UserActionInfo: typeof import("./AppErrorClasses").UserActionInfo;
    UtilityErrorFatal: typeof import("./AppErrorClasses").UtilityErrorFatal;
    UtilityErrorRecoverable: typeof import("./AppErrorClasses").UtilityErrorRecoverable;
    ValidationError: typeof import("./AppErrorClasses").ValidationError;
};
export declare const defaultRetryAfter = 60;
export declare function setDefaultDetails(details?: ErrorDetails): ErrorDetails;
export declare function createRetryMessage(retryAfter?: number): string;
export declare function createQuotaExceededMessage(quotaName?: string, limit?: number, retryAfter?: number): string;
//# sourceMappingURL=ErrorClasses.d.ts.map