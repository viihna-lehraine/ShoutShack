import { AppLoggerServiceInterface } from '../index/interfaces/services';
import { DependencyInterface } from '../index/interfaces/serviceComponents';
export declare function getCallerInfo(): string;
export declare function isAppLogger(logger: AppLoggerServiceInterface | Console | undefined): logger is AppLoggerServiceInterface;
export declare function validateDependencies(dependencies: DependencyInterface[], logger: AppLoggerServiceInterface): void;
export declare function withRetry<T>(operation: () => Promise<T> | T, maxRetries: number, delayMs: number, exponentialBackoff?: boolean): Promise<T>;
//# sourceMappingURL=helpers.d.ts.map