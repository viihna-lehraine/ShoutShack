import { NextFunction, Request, Response } from 'express';
import { Session } from 'express-session';
import { Logger } from '../config/logger';
interface SlowdownConfig {
    slowdownThreshold: number;
    logger: Logger;
}
interface SlowdownSession extends Session {
    lastRequestTime?: number;
}
export declare function initializeSlowdownMiddleware({ slowdownThreshold, // in ms
logger }: SlowdownConfig): (req: Request & {
    session: SlowdownSession;
}, res: Response, next: NextFunction) => void;
export {};
//# sourceMappingURL=slowdown.d.ts.map