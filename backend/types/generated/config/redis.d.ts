import { createClient, RedisClientType } from 'redis';
import { FeatureFlags } from './envConfig';
import { Logger } from '../utils/logger';
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
