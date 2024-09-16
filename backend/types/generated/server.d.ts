import { constants as cryptoConstants } from 'crypto';
import { Application } from 'express';
import { RedisClientType } from 'redis';
import { Sequelize } from 'sequelize';
import { Logger } from './utils/logger';
import { FeatureFlags } from './config/envConfig';
import SopsDependencies from './environment/sops';
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
