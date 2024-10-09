import * as Interfaces from '../interfaces/main';
export declare class MiddlewareFactory {
    private static csrfMiddleware;
    private static helmetMiddleware;
    private static jwtAuthMiddleware;
    private static passportAuthMiddleware;
    static getCSRFMiddleware(): Promise<Interfaces.CSRFMiddlewareServiceInterface>;
    static getHelmetMiddleware(): Promise<Interfaces.HelmetMiddlewareServiceInterface>;
    static getJWTAuthMiddleware(): Promise<Interfaces.JWTAuthMiddlewareServiceInterface>;
    static getPassportAuthMiddleware(): Promise<Interfaces.PassportAuthMiddlewareServiceInterface>;
}
//# sourceMappingURL=MiddlewareFactory.d.ts.map
