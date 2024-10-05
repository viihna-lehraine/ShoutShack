import { Request, Response, NextFunction } from 'express';
import { Session } from 'express-session';
import { GatekeeperServiceInterface } from '../index/interfaces/services';
export declare class GatekeeperService implements GatekeeperServiceInterface {
    private static instance;
    private logger;
    private errorLogger;
    private errorHandler;
    private envConfig;
    private cacheService;
    private redisService;
    private resourceManager;
    private RATE_LIMIT_BASE_POINTS;
    private RATE_LIMIT_BASE_DURATION;
    private SYNC_INTERVAL;
    private rateLimiter;
    private blacklistKey;
    private whitelistKey;
    private rateLimitPrefix;
    private blacklist;
    private whitelist;
    private globalRateLimitStats;
    private constructor();
    static getInstance(): Promise<GatekeeperService>;
    initialize(): Promise<void>;
    dynamicRateLimiter(): Promise<void>;
    private updateGlobalRateLimitStats;
    private resetGlobalRateLimitStats;
    private calculateCpuUsage;
    private adjustRateLimitBasedOnResources;
    rateLimitMiddleware(): (req: Request, res: Response, next: NextFunction) => Promise<void>;
    private triggerRateLimitWarning;
    private incrementRateLimit;
    slowdownMiddleware(): (req: Request & {
        session: Session & {
            lastRequestTime?: number;
        };
    }, res: Response, next: NextFunction) => void;
    private handleSlowdown;
    throttleRequests(): (req: Request, res: Response, next: NextFunction) => Promise<void | Response>;
    ipBlacklistMiddleware(): (req: Request, res: Response, next: NextFunction) => Promise<void>;
    loadIpBlacklist(): Promise<void>;
    private loadWhitelist;
    private saveIpBlacklist;
    private loadIpBlacklistFromFile;
    private saveIpBlacklistToFile;
    addIpToBlacklist(ip: string): Promise<void>;
    removeIpFromBlacklist(ip: string): Promise<void>;
    temporaryBlacklist(ip: string): Promise<void>;
    isTemporarilyBlacklisted(ip: string): Promise<boolean>;
    isBlacklisted(ip: string): Promise<boolean>;
    isBlacklistedOrTemporarilyBlacklisted(ip: string): Promise<{
        isBlacklisted: boolean;
        isTemporarilyBlacklisted: boolean;
    }>;
    preInitIpBlacklist(): Promise<void>;
    private preInitIpWhitelist;
    private syncBlacklistFromRedisToFile;
    private handleDependencyError;
    private getFilePath;
    private concurrentFileAccessSafety;
    shutdown(): Promise<void>;
}
//# sourceMappingURL=Gatekeeper.d.ts.map