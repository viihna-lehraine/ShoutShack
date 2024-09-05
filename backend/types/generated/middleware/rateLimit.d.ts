import { NextFunction, Request, Response } from 'express';
import { Logger } from '../config/logger';
export interface RateLimitMiddlewareDependencies {
    logger: Logger;
    points?: number;
    duration?: number;
}
export declare const initializeRateLimitMiddleware: ({ logger, points, duration }: RateLimitMiddlewareDependencies) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=rateLimit.d.ts.map