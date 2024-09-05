import { NextFunction, Request, Response } from 'express';
import { Logger } from '../config/logger';
interface JwtAuthMiddlewareDependencies {
    logger: Logger;
    verifyJwt: (token: string) => Promise<string | object | null>;
}
export declare function initializeJwtAuthMiddleware({ logger, verifyJwt }: JwtAuthMiddlewareDependencies): (req: Request, res: Response, next: NextFunction) => Promise<void>;
export {};
//# sourceMappingURL=jwtAuth.d.ts.map