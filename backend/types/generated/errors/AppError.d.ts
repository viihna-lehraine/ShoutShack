declare class AppError extends Error {
    statusCode: number;
    isOperational: boolean;
    constructor(message: string, statusCode?: number, isOperational?: boolean);
}
export default AppError;
//# sourceMappingURL=AppError.d.ts.map