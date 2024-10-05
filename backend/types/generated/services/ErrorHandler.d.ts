import { AppError, ClientError, ErrorSeverityType } from '../errors/ErrorClasses';
import { NextFunction, Request, Response } from 'express';
import { AppLoggerServiceInterface, ErrorHandlerServiceInterface, ErrorLoggerServiceInterface } from '../index/interfaces/services';
import { Sequelize } from 'sequelize';
export declare class ErrorHandlerService implements ErrorHandlerServiceInterface {
    private static instance;
    ErrorClasses: {
        AutoCorrectedInputWarning: typeof import("../errors/ClientErrorClasses").AutoCorrectedInputWarning;
        ClientAuthenticationError: typeof import("../errors/ClientErrorClasses").ClientAuthenticationError;
        DeprecatedApiWarning: typeof import("../errors/ClientErrorClasses").DeprecatedApiWarning;
        ExternalServiceError: typeof import("../errors/ClientErrorClasses").ExternalServiceError;
        FallbackSuccessInfo: typeof import("../errors/AppErrorClasses").FallbackSuccessInfo;
        FileProcessingError: typeof import("../errors/ClientErrorClasses").FileProcessingError;
        ForbiddenError: typeof import("../errors/ClientErrorClasses").ForbiddenError;
        InvalidCredentialsError: typeof import("../errors/ClientErrorClasses").InvalidCredentialsError;
        InvalidInputError: typeof import("../errors/ClientErrorClasses").InvalidInputError;
        InvalidTokenError: typeof import("../errors/ClientErrorClasses").InvalidTokenError;
        PasswordValidationError: typeof import("../errors/ClientErrorClasses").PasswordValidationError;
        PermissionDeniedError: typeof import("../errors/ClientErrorClasses").PermissionDeniedError;
        QuotaExceededErrorRecoverable: typeof import("../errors/ClientErrorClasses").QuotaExceededErrorRecoverable;
        QuotaExceededErrorWarning: typeof import("../errors/ClientErrorClasses").QuotaExceededErrorWarning;
        RateLimitErrorRecoverable: typeof import("../errors/ClientErrorClasses").RateLimitErrorRecoverable;
        RateLimitErrorWarning: typeof import("../errors/ClientErrorClasses").RateLimitErrorWarning;
        SessionExpiredError: typeof import("../errors/ClientErrorClasses").SessionExpiredError;
        TimeoutError: typeof import("../errors/ClientErrorClasses").TimeoutError;
        UserRegistrationError: typeof import("../errors/ClientErrorClasses").UserRegistrationError;
        AppAuthenticationError: typeof import("../errors/AppErrorClasses").AppAuthenticationError;
        AuthControllerError: typeof import("../errors/AppErrorClasses").AuthControllerError;
        CacheServiceError: typeof import("../errors/AppErrorClasses").CacheServiceError;
        ConfigurationError: typeof import("../errors/AppErrorClasses").ConfigurationError;
        ConfigurationErrorFatal: typeof import("../errors/AppErrorClasses").ConfigurationErrorFatal;
        ConcurrencyError: typeof import("../errors/AppErrorClasses").ConcurrencyError;
        ConflictError: typeof import("../errors/AppErrorClasses").ConflictError;
        DatabaseErrorFatal: typeof import("../errors/AppErrorClasses").DatabaseErrorFatal;
        DatabaseErrorRecoverable: typeof import("../errors/AppErrorClasses").DatabaseErrorRecoverable;
        DataIntegrityError: typeof import("../errors/AppErrorClasses").DataIntegrityError;
        DependencyErrorFatal: typeof import("../errors/AppErrorClasses").DependencyErrorFatal;
        DependencyErrorRecoverable: typeof import("../errors/AppErrorClasses").DependencyErrorRecoverable;
        ExpressError: typeof import("../errors/AppErrorClasses").ExpressError;
        ExpressRouteError: typeof import("../errors/AppErrorClasses").ExpressRouteError;
        ExternalServiceErrorFatal: typeof import("../errors/AppErrorClasses").ExternalServiceErrorFatal;
        HealthCheckError: typeof import("../errors/AppErrorClasses").HealthCheckError;
        HTTPSClientErrorFatal: typeof import("../errors/AppErrorClasses").HTTPSClientErrorFatal;
        HTTPSServerErrorRecoverable: typeof import("../errors/AppErrorClasses").HTTPSServerErrorRecoverable;
        InsufficientStorageError: typeof import("../errors/AppErrorClasses").InsufficientStorageError;
        MiddlewareServiceError: typeof import("../errors/AppErrorClasses").MiddlewareServiceError;
        MissingResourceError: typeof import("../errors/AppErrorClasses").MissingResourceError;
        PassportAuthServiceError: typeof import("../errors/AppErrorClasses").PassportAuthServiceError;
        PartialServiceFailureWarning: typeof import("../errors/AppErrorClasses").PartialServiceFailureWarning;
        QuotaExceededErrorFatal: typeof import("../errors/AppErrorClasses").QuotaExceededErrorFatal;
        RateLimitErrorFatal: typeof import("../errors/AppErrorClasses").RateLimitErrorFatal;
        RedisServiceError: typeof import("../errors/AppErrorClasses").RedisServiceError;
        ResourceManagerError: typeof import("../errors/AppErrorClasses").ResourceManagerError;
        RootMiddlewareError: typeof import("../errors/AppErrorClasses").RootMiddlewareError;
        ServerNotInitializedError: typeof import("../errors/AppErrorClasses").ServerNotInitializedError;
        ServiceDegradedError: typeof import("../errors/AppErrorClasses").ServiceDegradedError;
        ServiceDegradedErrorMinor: typeof import("../errors/AppErrorClasses").ServiceDegradedErrorMinor;
        ServiceUnavailableError: typeof import("../errors/AppErrorClasses").ServiceUnavailableError;
        ServiceUnavailableErrorFatal: typeof import("../errors/AppErrorClasses").ServiceUnavailableErrorFatal;
        SlowApiWarning: typeof import("../errors/AppErrorClasses").SlowApiWarning;
        UserActionInfo: typeof import("../errors/AppErrorClasses").UserActionInfo;
        UtilityErrorFatal: typeof import("../errors/AppErrorClasses").UtilityErrorFatal;
        UtilityErrorRecoverable: typeof import("../errors/AppErrorClasses").UtilityErrorRecoverable;
        ValidationError: typeof import("../errors/AppErrorClasses").ValidationError;
    };
    ErrorSeverity: {
        readonly FATAL: "fatal";
        readonly RECOVERABLE: "recoverable";
        readonly WARNING: "warning";
        readonly INFO: "info";
    };
    private logger;
    private errorLogger;
    private shutdownFunction;
    private constructor();
    static getInstance(logger: AppLoggerServiceInterface, errorLogger: ErrorLoggerServiceInterface): Promise<ErrorHandlerService>;
    handleError(params: {
        error: unknown;
        req?: Request;
        details?: Record<string, unknown>;
        severity?: ErrorSeverityType;
        action?: string;
        userId?: string;
        sequelize?: Sequelize;
    }): void;
    expressErrorHandler(): (err: AppError | ClientError | Error | Record<string, unknown>, req: Request, res: Response, next: NextFunction) => void;
    handleCriticalError(params: {
        error: unknown;
        req?: Request;
        details?: Record<string, unknown>;
    }): void;
    sendClientErrorResponse({ message, res, responseId, statusCode }: {
        message: string;
        statusCode?: number;
        res: Response;
        responseId?: string;
    }): Promise<void>;
    initializeGlobalErrorHandlers(): void;
    setShutdownHandler(shutdownFn: () => Promise<void>): void;
    private performGracefulShutdown;
    shutdown(): Promise<void>;
}
//# sourceMappingURL=ErrorHandler.d.ts.map