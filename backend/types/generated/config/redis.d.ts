import { createClient, RedisClientType } from 'redis';
interface RedisDependencies {
    logger: ReturnType<typeof import('./logger').default>;
    getFeatureFlags: () => {
        enableRedisFlag: boolean;
    };
    createRedisClient: typeof createClient;
    redisUrl: string;
}
export declare function connectRedis({ logger, getFeatureFlags, createRedisClient, redisUrl }: RedisDependencies): Promise<RedisClientType | null>;
export declare function getRedisClient(): RedisClientType | null;
export {};
//# sourceMappingURL=redis.d.ts.map