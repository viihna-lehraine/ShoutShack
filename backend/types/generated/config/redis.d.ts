import { createClient, RedisClientType } from 'redis';
import { FeatureFlags } from './environmentConfig';
import { Logger } from './logger';
interface RedisDependencies {
    logger: Logger;
    featureFlags: FeatureFlags;
    createRedisClient: typeof createClient;
    redisUrl: string;
}
export declare function connectRedis({ logger, featureFlags, createRedisClient, redisUrl }: RedisDependencies): Promise<RedisClientType | null>;
export declare function getRedisClient(): Promise<RedisClientType | null>;
export {};
//# sourceMappingURL=redis.d.ts.map