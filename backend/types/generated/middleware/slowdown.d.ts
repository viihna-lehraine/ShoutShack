import { NextFunction, Request, Response } from 'express';
import '../../types/custom/express-session';
interface SlowdownConfig {
    slowdownThreshold: number;
}
export declare function createSlowdownMiddleware({ slowdownThreshold }: SlowdownConfig): (req: Request, res: Response, next: NextFunction) => void;
export default createSlowdownMiddleware;
//# sourceMappingURL=slowdown.d.ts.map