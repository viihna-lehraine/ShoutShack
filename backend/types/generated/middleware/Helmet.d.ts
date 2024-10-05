import { Application } from 'express';
import { HelmetMiddlewareServiceInterface } from '../index/interfaces/services';
export declare class HelmetMiddlewareService implements HelmetMiddlewareServiceInterface {
    private static instance;
    private logger;
    private errorLogger;
    private errorHandler;
    private constructor();
    static getInstance(): Promise<HelmetMiddlewareService>;
    initializeHelmetMiddleware(app: Application): Promise<void>;
    applyHelmet(app: Application): Promise<void>;
    applyCSP(app: Application): Promise<void>;
    applyExpectCT(app: Application): Promise<void>;
    applyPermissionsPolicy(app: Application): Promise<void>;
    applyCrossOriginPolicies(app: Application): Promise<void>;
    applyReferrerPolicy(app: Application): Promise<void>;
    applyXssFilter(app: Application): Promise<void>;
    shutdown(): Promise<void>;
    private handleHelmetError;
    private handleHelmetExpressError;
}
//# sourceMappingURL=Helmet.d.ts.map