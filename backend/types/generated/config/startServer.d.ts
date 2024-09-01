import { Application } from 'express';
import { Sequelize } from 'sequelize';
export declare function startServer({ app, options, logger, SERVER_PORT, SSL_FLAG, getSequelizeInstance, getRedisClient, REDIS_FLAG, }: {
    app: Application;
    options: any;
    logger: any;
    SERVER_PORT: number;
    SSL_FLAG: boolean;
    getSequelizeInstance: () => Sequelize;
    getRedisClient: () => any;
    REDIS_FLAG: boolean;
}): Promise<void>;
//# sourceMappingURL=startServer.d.ts.map