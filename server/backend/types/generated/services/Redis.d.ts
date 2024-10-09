import { RedisClientType } from 'redis';
import { RedisMetrics, RedisServiceDeps, RedisServiceInterface } from '../index/interfaces/main';
export declare class RedisService implements RedisServiceInterface {
    private readonly createRedisClient;
    private static instance;
    private logger;
    private errorLogger;
    private errorHandler;
    private envConfig;
    private redisClient;
    private constructor();
    static getInstance(deps: RedisServiceDeps): Promise<RedisService>;
    private connectRedisClient;
    getRedisClient(): Promise<RedisClientType | null>;
    get<T>(key: string): Promise<T | null>;
    set<T>(key: string, value: T, expiration?: number): Promise<void>;
    del(key: string): Promise<void>;
    exists(key: string): Promise<boolean>;
    increment(key: string, expiration?: number): Promise<number | null>;
    getKeysByPattern(pattern: string): Promise<string[]>;
    delMultiple(service: string, keys: string[]): Promise<void>;
    flushCacheByService(service: string): Promise<void>;
    flushRedisMemoryCache(): Promise<void>;
    cleanUpRedisClient(): Promise<void>;
    getRedisInfo(): Promise<RedisMetrics>;
    private parseRedisInfo;
    shutdown(): Promise<void>;
    private handleRedisFailure;
    private handleRedisError;
}
//# sourceMappingURL=Redis.d.ts.map
