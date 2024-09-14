import { NextFunction, Request, Response } from 'express';
import { FeatureFlags } from '../config/environmentConfig';
import { AppError } from '../errors/errorClasses';
import { Logger } from '../utils/logger';
interface ExpressErrorHandlerDependencies {
    logger: Logger;
    featureFlags: FeatureFlags;
}
export declare function expressErrorHandler({ logger, featureFlags }: ExpressErrorHandlerDependencies): (err: AppError | Error, req: Request, res: Response, _next: NextFunction) => void;
export {};
//# sourceMappingURL=expressErrorHandler.d.ts.map
