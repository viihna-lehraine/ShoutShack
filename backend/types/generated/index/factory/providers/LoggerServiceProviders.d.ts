import { AppLoggerServiceInterface, ErrorLoggerServiceInterface } from '../../interfaces/main';
export declare class LoggerServiceProvider {
    private static instance;
    static getLoggerService(logLevel?: string, serviceName?: string): Promise<AppLoggerServiceInterface>;
}
export declare class ErrorLoggerServiceProvider {
    private static instance;
    static getErrorLoggerService(logLevel?: string, serviceName?: string): Promise<ErrorLoggerServiceInterface>;
}
//# sourceMappingURL=LoggerServiceProviders.d.ts.map