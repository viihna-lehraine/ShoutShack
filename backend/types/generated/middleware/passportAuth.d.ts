import { NextFunction, Request, Response } from 'express';
import { AuthenticateOptions, PassportStatic } from 'passport';
import { Logger } from '../utils/logger';
interface PassportAuthMiddlewareDependencies {
    passport: PassportStatic;
    authenticateOptions: AuthenticateOptions;
    logger: Logger;
}
export declare const initializePassportAuthMiddleware: ({ passport, authenticateOptions, logger }: PassportAuthMiddlewareDependencies) => (req: Request, res: Response, next: NextFunction) => void;
export {};
//# sourceMappingURL=passportAuth.d.ts.map
