import { NextFunction, Request, Response } from 'express';
import { AuthenticateOptions, PassportStatic } from 'passport';
interface PassportAuthMiddlewareDependencies {
    passport: PassportStatic;
    authenticateOptions: AuthenticateOptions;
}
export declare const createPassportAuthMiddleware: ({ passport, authenticateOptions }: PassportAuthMiddlewareDependencies) => (req: Request, res: Response, next: NextFunction) => void;
export {};
//# sourceMappingURL=passportAuthMiddleware.d.ts.map