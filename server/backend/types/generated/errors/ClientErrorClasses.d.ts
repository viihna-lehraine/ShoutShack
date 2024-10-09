import { FallbackSuccessInfo } from './AppErrorClasses';
import { ClientError, ErrorDetails } from './ErrorClasses';
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
export declare const ClientErrorClasses: {
    AutoCorrectedInputWarning: typeof AutoCorrectedInputWarning;
    ClientAuthenticationError: typeof ClientAuthenticationError;
    DeprecatedApiWarning: typeof DeprecatedApiWarning;
    ExternalServiceError: typeof ExternalServiceError;
    FallbackSuccessInfo: typeof FallbackSuccessInfo;
    FileProcessingError: typeof FileProcessingError;
    ForbiddenError: typeof ForbiddenError;
    InvalidCredentialsError: typeof InvalidCredentialsError;
    InvalidInputError: typeof InvalidInputError;
    InvalidTokenError: typeof InvalidTokenError;
    PasswordValidationError: typeof PasswordValidationError;
    PermissionDeniedError: typeof PermissionDeniedError;
    QuotaExceededErrorRecoverable: typeof QuotaExceededErrorRecoverable;
    QuotaExceededErrorWarning: typeof QuotaExceededErrorWarning;
    RateLimitErrorRecoverable: typeof RateLimitErrorRecoverable;
    RateLimitErrorWarning: typeof RateLimitErrorWarning;
    SessionExpiredError: typeof SessionExpiredError;
    TimeoutError: typeof TimeoutError;
    UserRegistrationError: typeof UserRegistrationError;
};
//# sourceMappingURL=ClientErrorClasses.d.ts.map