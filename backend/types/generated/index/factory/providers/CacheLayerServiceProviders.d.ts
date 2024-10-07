import { CacheServiceInterface, RedisServiceInterface } from '../../interfaces/main';
export declare class CacheServiceProvider {
    private static instance;
    static getCacheService(): Promise<CacheServiceInterface>;
}
export declare class RedisServiceProvider {
    private static instance;
    private static loadRedisDeps;
    static getRedisService(): Promise<RedisServiceInterface>;
}
//# sourceMappingURL=CacheLayerServiceProviders.d.ts.map