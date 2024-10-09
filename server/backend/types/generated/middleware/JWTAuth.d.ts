import { NextFunction, Request, Response } from 'express';
import { JWTAuthMiddlewareServiceInterface } from '../index/interfaces/main';
export declare class JWTAuthMiddlewareService implements JWTAuthMiddlewareServiceInterface {
    private static instance;
    private logger;
    private errorLogger;
    private errorHandler;
    private gatekeeperService;
    private cacheService;
    private expiredTokens;
    private revokedTokens;
    private expiryListFilePath;
    private revocationListFilePath;
    private expiryListCacheKey;
    private revocationListCacheKey;
    private cacheDuration;
    private cleanupExpiredTokensInterval;
    private cleanupRevokedTokensInterval;
    private constructor();
    static getInstance(): Promise<JWTAuthMiddlewareService>;
    initializeJWTAuthMiddleware(): (req: Request, res: Response, next: NextFunction) => Promise<void | Response>;
    private isTokenExpired;
    private isTokenRevoked;
    expireToken(token: string, ttl: number): Promise<void>;
    revokeToken(token: string): Promise<void>;
    private getCachedTokenList;
    private loadRevokedTokens;
    private loadExpiredTokens;
    private saveExpiredTokens;
    private saveRevokedTokens;
    private cleanupExpiredTokens;
    private cleanupRevokedTokens;
    private withFileLock;
    shutdown(): Promise<void>;
}
//# sourceMappingURL=JWTAuth.d.ts.map