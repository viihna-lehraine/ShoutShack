import { CSRFMiddlewareServiceInterface, HelmetMiddlewareServiceInterface, JWTAuthMiddlewareServiceInterface, PassportAuthMiddlewareServiceInterface } from '../../interfaces/main';
export declare class MiddlewareFactory {
    static getCSRFMiddleware(): Promise<CSRFMiddlewareServiceInterface>;
    static getHelmetMiddleware(): Promise<HelmetMiddlewareServiceInterface>;
    static getJWTAuthMiddleware(): Promise<JWTAuthMiddlewareServiceInterface>;
    static getPassportAuthMiddleware(): Promise<PassportAuthMiddlewareServiceInterface>;
}
//# sourceMappingURL=MiddlewareFactory.d.ts.map