import { Application } from 'express';
import { Sequelize } from 'sequelize';
import { SecureContextOptions } from 'tls';
import { constants as cryptoConstants } from 'crypto';
interface SetupHttpParams {
    app: Application;
    sops: any;
    fs: typeof import('fs').promises;
    logger: any;
    constants: typeof cryptoConstants;
    getFeatureFlags: () => any;
    getRedisClient: () => any;
    getSequelizeInstance: () => Sequelize;
    initializeDatabase: () => Promise<Sequelize>;
    SERVER_PORT: number;
    SSL_FLAG: boolean;
    REDIS_FLAG: boolean;
}
interface SetupHttpReturn {
    options?: SecureContextOptions;
    startServer?: () => void;
}
type Options = SecureContextOptions;
export declare function declareOptions({ sops, fs, logger, constants, DECRYPT_KEYS, SSL_KEY, SSL_CERT, ciphers }: {
    sops: any;
    fs: typeof import('fs').promises;
    logger: any;
    constants: typeof import('crypto').constants;
    DECRYPT_KEYS: boolean;
    SSL_KEY: string | null;
    SSL_CERT: string | null;
    ciphers: string[];
}): Promise<Options>;
export declare function setupHttp({ app, sops, fs: fsPromises, logger, constants, getFeatureFlags, getRedisClient, getSequelizeInstance, SERVER_PORT, SSL_FLAG, REDIS_FLAG }: SetupHttpParams): Promise<SetupHttpReturn>;
export {};
//# sourceMappingURL=http.d.ts.map