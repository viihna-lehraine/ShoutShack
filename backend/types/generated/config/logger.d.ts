import { Logger as WinstonLogger } from 'winston';
export interface LoggerDependencies {
    logLevel?: string | undefined;
    logDirectory?: string | undefined;
    serviceName?: string | undefined;
    isProduction?: boolean | undefined;
    console?: typeof console;
}
export declare function setupLogger({ logLevel, logDirectory, serviceName, isProduction, }?: LoggerDependencies): WinstonLogger;
export declare function isLogger(logger: Logger | Console | undefined): logger is Logger;
export type Logger = WinstonLogger;
//# sourceMappingURL=logger.d.ts.map