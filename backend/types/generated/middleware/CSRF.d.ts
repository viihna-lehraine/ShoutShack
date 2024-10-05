import { CSRFMiddlewareServiceInterface } from '../index/interfaces/services';
import { Request, Response, NextFunction } from 'express';
import { Options as CSRFOptions } from 'csrf';
export declare class CSRFMiddlewareService implements CSRFMiddlewareServiceInterface {
    private static instance;
    private csrfProtection;
    private logger;
    private errorLogger;
    private errorHandler;
    private constructor();
    static getInstance(options?: CSRFOptions): Promise<CSRFMiddlewareService>;
    initializeCSRFMiddleware(): (req: Request, res: Response, next: NextFunction) => Promise<void>;
    private isWhitelistedRoute;
    shutdown(): Promise<void>;
}
//# sourceMappingURL=CSRF.d.ts.map