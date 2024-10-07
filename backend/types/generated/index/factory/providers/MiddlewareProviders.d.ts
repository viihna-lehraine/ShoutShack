import { CSRFMiddlewareServiceInterface, HelmetMiddlewareServiceInterface, JWTAuthMiddlewareServiceInterface, PassportAuthMiddlewareServiceInterface } from '../../interfaces/main';
export declare class CSRFMiddlewareProvider {
    private static instance;
    static getCSRFMiddleware(): Promise<CSRFMiddlewareServiceInterface>;
}
export declare class HelmetMiddlewareProvider {
    private static instance;
    static getHelmetMiddleware(): Promise<HelmetMiddlewareServiceInterface>;
}
export declare class JWTAuthMiddlewareProvider {
    private static instance;
    static getJWTAuthMiddleware(): Promise<JWTAuthMiddlewareServiceInterface>;
}
export declare class PassportAuthMiddlewareProvider {
    private static instance;
    static getPassportAuthMiddleware(): Promise<PassportAuthMiddlewareServiceInterface>;
}
//# sourceMappingURL=MiddlewareProviders.d.ts.map