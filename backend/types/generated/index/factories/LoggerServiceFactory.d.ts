import { AppLoggerServiceInterface } from '../interfaces/main';
import { ErrorLoggerServiceInterface } from '../interfaces/main';
export declare class LoggerServiceFactory {
    private static logger;
    private static errorLogger;
    private static loadDeps;
    static getLoggerService(logLevel?: string, serviceName?: string): Promise<AppLoggerServiceInterface>;
    static getErrorLoggerService(logLevel?: string, serviceName?: string): Promise<ErrorLoggerServiceInterface>;
}
//# sourceMappingURL=LoggerServiceFactory.d.ts.map
