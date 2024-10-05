import { NextFunction, Request, Response, Router } from 'express';
import { AppLoggerServiceInterface, BaseRouterInterface, CacheServiceInterface, EnvConfigServiceInterface, ErrorHandlerServiceInterface, ErrorLoggerServiceInterface, GatekeeperServiceInterface, HelmetMiddlewareServiceInterface, JWTAuthMiddlewareServiceInterface, PassportAuthMiddlewareServiceInterface } from '../index/interfaces/services';
export declare class BaseRouter implements BaseRouterInterface {
    private static instance;
    protected router: Router;
    protected logger: AppLoggerServiceInterface;
    protected errorLogger: ErrorLoggerServiceInterface;
    protected errorHandler: ErrorHandlerServiceInterface;
    protected envConfig: EnvConfigServiceInterface;
    protected cacheService: CacheServiceInterface;
    protected gatekeeperService: GatekeeperServiceInterface;
    protected helmetService: HelmetMiddlewareServiceInterface;
    protected JWTMiddleware: JWTAuthMiddlewareServiceInterface;
    protected passportMiddleware: PassportAuthMiddlewareServiceInterface;
    protected apiRouteTable: Record<string, Record<string, string>>;
    protected healthRouteTable: Record<string, Record<string, string>>;
    protected staticRouteTable: Record<string, Record<string, string>>;
    protected testRouteTable: Record<string, Record<string, string>>;
    protected constructor(logger: AppLoggerServiceInterface, errorLogger: ErrorLoggerServiceInterface, errorHandler: ErrorHandlerServiceInterface, envConfig: EnvConfigServiceInterface, cacheService: CacheServiceInterface, gatekeeperService: GatekeeperServiceInterface, helmetService: HelmetMiddlewareServiceInterface, JWTMiddleware: JWTAuthMiddlewareServiceInterface, passportMiddleware: PassportAuthMiddlewareServiceInterface);
    static getInstance(): Promise<BaseRouter>;
    getRouter(): Router;
    private initializeBaseRouter;
    private loadRouteTables;
    private setUpRoutes;
    private routeHandler;
    private handleRoute;
    private applyMiddlewares;
    private applyCompression;
    private applyGatekeeper;
    private applyPassportAndJWTAuth;
    private applySanitization;
    private applySecurityHeaders;
    protected asyncHandler: (fn: (req: Request, res: Response, next: NextFunction) => Promise<void | Response>) => ((req: Request, res: Response, next: NextFunction) => void);
    shutdown(): Promise<void>;
    protected handleRouteError(error: unknown, req: Request, res: Response, next: NextFunction): void;
    private applyErrorHandler;
}
//# sourceMappingURL=BaseRouter.d.ts.map