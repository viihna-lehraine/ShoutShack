interface AppErrorOptions {
    message: string;
    statusCode?: number;
    isOperational?: boolean;
    errorCode?: string;
    details?: unknown;
}
interface AppErrorDependencies {
    logger?: ReturnType<typeof import('../config/logger').default>;
}
declare class AppError extends Error {
    statusCode: number;
    isOperational: boolean;
    errorCode: string;
    details: unknown;
    constructor({ message, statusCode, isOperational, errorCode, details }: AppErrorOptions, { logger }?: AppErrorDependencies);
}
export default AppError;
//# sourceMappingURL=AppError.d.ts.map