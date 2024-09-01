import { Logger } from 'winston';
export interface LoggerDependencies {
    logLevel?: string | undefined;
    logDirectory?: string | undefined;
    serviceName?: string | undefined;
    isProduction?: boolean | undefined;
}
declare function setupLogger({ logLevel, logDirectory, serviceName, isProduction }?: LoggerDependencies): Logger;
export default setupLogger;
//# sourceMappingURL=logger.d.ts.map