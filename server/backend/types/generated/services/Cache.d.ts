import { CacheMetrics, CacheServiceInterface } from '../index/interfaces/main';
export declare class CacheService implements CacheServiceInterface {
    private static instance;
    private logger;
    private errorLogger;
    private errorHandler;
    private memoryCache;
    private memoryCacheLRU;
    private serviceMetrics;
    private constructor();
    static getInstance(): Promise<CacheService>;
    private getServiceTTL;
    private getNamespacedKey;
    private updateMetrics;
    getCacheMetrics(service: string): CacheMetrics;
    getMemoryCache(service: string): Map<string, {
        value: unknown;
        expiration: number | undefined;
    }> | null;
    get<T>(key: string, service: string): Promise<T | null>;
    set<T>(key: string, value: T, service: string, expirationInSeconds?: string | number): Promise<void>;
    exists(key: string, service: string): Promise<boolean>;
    del(key: string, service: string): Promise<void>;
    increment(key: string, service: string, expirationInSeconds?: number): Promise<number | null>;
    flushCache(service: string): Promise<void>;
    cleanupExpiredEntries(): void;
    clearNamespace(service: string): Promise<void>;
    closeConnection(): Promise<void>;
    shutdown(): Promise<void>;
    private handleCacheError;
}
//# sourceMappingURL=Cache.d.ts.map