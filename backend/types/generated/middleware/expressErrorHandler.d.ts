import { Request, Response, NextFunction } from 'express';
import { FeatureFlags } from '../config/environmentConfig';
import { Logger } from '../config/logger';
import { AppError } from '../config/errorClasses';
interface ExpressErrorHandlerDependencies {
    logger: Logger;
    featureFlags: FeatureFlags;
}
export declare function expressErrorHandler({ logger, featureFlags }: ExpressErrorHandlerDependencies): (err: AppError | Error, req: Request, res: Response, _next: NextFunction) => void;
export {};
//# sourceMappingURL=expressErrorHandler.d.ts.map