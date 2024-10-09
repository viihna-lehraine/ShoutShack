import { CacheServiceInterface, RedisServiceInterface } from '../interfaces/main';
export declare class CacheLayerServiceFactory {
    private static cacheService;
    private static redisService;
    private static loadRedisDeps;
    static getCacheService(): Promise<CacheServiceInterface>;
    static getRedisService(): Promise<RedisServiceInterface>;
}
//# sourceMappingURL=CacheLayerServiceFactory.d.ts.map
