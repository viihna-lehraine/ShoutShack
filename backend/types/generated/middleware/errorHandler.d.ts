import { Request, Response, NextFunction } from 'express';
import AppError from '../errors/AppError';
interface ErrorHandlerDependencies {
    logger: ReturnType<typeof import('../utils/logger').default>;
    featureFlags: ReturnType<typeof import('../utils/featureFlags').getFeatureFlags>;
}
export declare function createErrorHandler({ logger, featureFlags }: ErrorHandlerDependencies): (err: AppError | Error, req: Request, res: Response, next: NextFunction) => void;
export default createErrorHandler;
//# sourceMappingURL=errorHandler.d.ts.map
