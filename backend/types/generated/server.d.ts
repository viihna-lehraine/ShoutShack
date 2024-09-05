import { constants as cryptoConstants } from 'crypto';
import { Application } from 'express';
import { Sequelize } from 'sequelize';
import SopsDependencies from './utils/sops';
import { FeatureFlags } from './config/environmentConfig';
import { Logger } from './config/logger';
import { RedisClientType } from 'redis';
interface SetupHttpServerParams {
    app: Application;
    sops: typeof SopsDependencies;
    fs: typeof import('fs').promises;
    logger: Logger;
    constants: typeof cryptoConstants;
    featureFlags: FeatureFlags;
    getRedisClient: () => RedisClientType | null;
    getSequelizeInstance: () => Sequelize;
}
interface SetupHttpServerReturn {
    startServer: () => Promise<void>;
}
export declare function setupHttpServer({ app, sops, fs: fsPromises, logger, constants, featureFlags, getRedisClient, getSequelizeInstance }: SetupHttpServerParams): Promise<SetupHttpServerReturn | undefined>;
export {};
//# sourceMappingURL=server.d.ts.map