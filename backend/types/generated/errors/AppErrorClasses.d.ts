import { AppError, ErrorDetails } from './ErrorClasses';
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
export declare const AppErrorClasses: {
    AppAuthenticationError: typeof AppAuthenticationError;
    AuthControllerError: typeof AuthControllerError;
    CacheServiceError: typeof CacheServiceError;
    ConfigurationError: typeof ConfigurationError;
    ConfigurationErrorFatal: typeof ConfigurationErrorFatal;
    ConcurrencyError: typeof ConcurrencyError;
    ConflictError: typeof ConflictError;
    DatabaseErrorFatal: typeof DatabaseErrorFatal;
    DatabaseErrorRecoverable: typeof DatabaseErrorRecoverable;
    DataIntegrityError: typeof DataIntegrityError;
    DependencyErrorFatal: typeof DependencyErrorFatal;
    DependencyErrorRecoverable: typeof DependencyErrorRecoverable;
    ExpressError: typeof ExpressError;
    ExpressRouteError: typeof ExpressRouteError;
    ExternalServiceErrorFatal: typeof ExternalServiceErrorFatal;
    HealthCheckError: typeof HealthCheckError;
    HTTPSClientErrorFatal: typeof HTTPSClientErrorFatal;
    HTTPSServerErrorRecoverable: typeof HTTPSServerErrorRecoverable;
    InsufficientStorageError: typeof InsufficientStorageError;
    MiddlewareServiceError: typeof MiddlewareServiceError;
    MissingResourceError: typeof MissingResourceError;
    PassportAuthServiceError: typeof PassportAuthServiceError;
    PartialServiceFailureWarning: typeof PartialServiceFailureWarning;
    QuotaExceededErrorFatal: typeof QuotaExceededErrorFatal;
    RateLimitErrorFatal: typeof RateLimitErrorFatal;
    RedisServiceError: typeof RedisServiceError;
    ResourceManagerError: typeof ResourceManagerError;
    RootMiddlewareError: typeof RootMiddlewareError;
    ServerNotInitializedError: typeof ServerNotInitializedError;
    ServiceDegradedError: typeof ServiceDegradedError;
    ServiceDegradedErrorMinor: typeof ServiceDegradedErrorMinor;
    ServiceUnavailableError: typeof ServiceUnavailableError;
    ServiceUnavailableErrorFatal: typeof ServiceUnavailableErrorFatal;
    SlowApiWarning: typeof SlowApiWarning;
    UserActionInfo: typeof UserActionInfo;
    UtilityErrorFatal: typeof UtilityErrorFatal;
    UtilityErrorRecoverable: typeof UtilityErrorRecoverable;
    ValidationError: typeof ValidationError;
};
//# sourceMappingURL=AppErrorClasses.d.ts.map