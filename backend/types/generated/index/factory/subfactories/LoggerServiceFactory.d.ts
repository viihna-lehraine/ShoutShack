import { AppLoggerServiceInterface, ErrorLoggerServiceInterface } from '../../interfaces/main';
export declare class LoggerServiceFactory {
    static getLoggerService(): Promise<AppLoggerServiceInterface>;
    static getErrorLoggerService(): Promise<ErrorLoggerServiceInterface>;
}
//# sourceMappingURL=LoggerServiceFactory.d.ts.map