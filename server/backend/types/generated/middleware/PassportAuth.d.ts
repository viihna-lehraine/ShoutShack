import { RequestHandler } from 'express';
import { PassportAuthMiddlewareServiceDeps, PassportAuthMiddlewareServiceInterface } from '../index/interfaces/main';
export declare class PassportAuthMiddlewareService implements PassportAuthMiddlewareServiceInterface {
    private static instance;
    private logger;
    private errorLogger;
    private errorHandler;
    private constructor();
    static getInstance(): Promise<PassportAuthMiddlewareService>;
    initializePassportAuthMiddleware({ passport, authenticateOptions, validateDependencies }: PassportAuthMiddlewareServiceDeps): RequestHandler;
    shutdown(): Promise<void>;
    private handleError;
}
//# sourceMappingURL=PassportAuth.d.ts.map