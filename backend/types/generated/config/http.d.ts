import { Application } from 'express';
import { Sequelize } from 'sequelize';
import { constants as cryptoConstants } from 'crypto';
import SopsDependencies from './utils/sops';
import { Logger } from 'winston';
import { FeatureFlags } from './utils/featureFlags';
import { RedisClientType } from 'redis';
interface SetupHttpParams {
    app: Application;
    sops: typeof SopsDependencies;
    fs: typeof import('fs').promises;
    logger: Logger;
    constants: typeof cryptoConstants;
    getFeatureFlags: () => FeatureFlags;
    getRedisClient: () => RedisClientType | null;
    getSequelizeInstance: () => Sequelize;
}
interface SetupHttpReturn {
    startServer: () => void;
}
export declare function setupHttp({ app, sops, fs: fsPromises, logger, constants, getFeatureFlags, getRedisClient, getSequelizeInstance }: SetupHttpParams): Promise<SetupHttpReturn>;
export {};
//# sourceMappingURL=http.d.ts.map
