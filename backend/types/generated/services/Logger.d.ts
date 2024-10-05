import { AppLoggerServiceInterface, ErrorHandlerServiceInterface, ErrorLoggerServiceInterface, VaultServiceInterface } from '../index/interfaces/services';
import { AppLoggerServiceDeps } from '../index/interfaces/serviceDeps';
import { Logger as WinstonLogger } from 'winston';
import { Request } from 'express';
export declare class AppLoggerService extends WinstonLogger implements AppLoggerServiceInterface {
    static instance: AppLoggerService | null;
    protected _deps: AppLoggerServiceDeps;
    private adminId;
    private redactedLogger;
    protected errorHandler: ErrorHandlerServiceInterface | null;
    private secrets;
    constructor(deps: AppLoggerServiceDeps, logLevel?: string, serviceName?: string);
    static getInstance(deps: AppLoggerServiceDeps, logLevel?: string, serviceName?: string): Promise<AppLoggerServiceInterface>;
    private initializeAsyncParts;
    static getCustomLogLevels(): {
        levels: Record<string, number>;
        colors: Record<string, string>;
    };
    setErrorHandler(errorHandler: ErrorHandlerServiceInterface): void;
    setUpSecrets(secrets: VaultServiceInterface): void;
    private setupRedactedLogger;
    private createRedactedLogger;
    getLogger(): AppLoggerServiceInterface;
    getRedactedLogger(): AppLoggerServiceInterface;
    private addLogstashTransport;
    private createLogstashTransport;
    logDebug(message: string, details?: Record<string, unknown>): void;
    logInfo(message: string, details?: Record<string, unknown>): void;
    logNotice(message: string, details?: Record<string, unknown>): void;
    logWarn(message: string, details?: Record<string, unknown>): void;
    logError(message: string, details?: Record<string, unknown>): void;
    logCritical(message: string, details?: Record<string, unknown>): void;
    cleanUpOldLogs(sequelize: import('sequelize').Sequelize, retentionPeriodDays?: number): Promise<void>;
    setAdminId(adminId: number): void;
    getErrorDetails(getCallerInfo: () => string, action?: string, req?: Request, userId?: string | null, additionalData?: Record<string, unknown>): Record<string, unknown>;
    protected get __deps(): AppLoggerServiceDeps;
    private sanitizeRequestBody;
    shutdown(): Promise<void>;
    protected handleError(message: string, error: Error): void;
}
export declare class ErrorLoggerService extends AppLoggerService implements ErrorLoggerServiceInterface {
    static instance: ErrorLoggerService;
    private errorCounts;
    constructor(deps: AppLoggerServiceDeps, logLevel?: string, serviceName?: string);
    static getInstance(deps: AppLoggerServiceDeps, logLevel?: string, serviceName?: string): Promise<ErrorLoggerServiceInterface>;
    logAppError(error: import('../errors/ErrorClasses').AppError, sequelize?: import('sequelize').Sequelize, details?: Record<string, unknown>): void;
    logToDatabase(error: import('../errors/ErrorClasses').AppError, sequelize: import('sequelize').Sequelize, retryCount?: number): Promise<void>;
    getErrorCount(errorName: string): number;
}
//# sourceMappingURL=Logger.d.ts.map