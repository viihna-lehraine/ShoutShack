import { Sequelize } from 'sequelize';
import { FeatureFlags } from './envConfig';
import { Logger } from '../utils/logger';
export interface DBSecrets {
    DB_NAME: string;
    DB_USER: string;
    DB_PASSWORD: string;
    DB_HOST: string;
    DB_DIALECT: 'mysql' | 'postgres' | 'sqlite' | 'mariadb' | 'mssql';
}
export interface DBDependencies {
    logger: Logger;
    featureFlags: FeatureFlags;
    getSecrets: () => Promise<DBSecrets>;
}
export declare function initializeDatabase({ logger, featureFlags, getSecrets }: DBDependencies): Promise<Sequelize>;
export declare function getSequelizeInstance({ logger }: Pick<DBDependencies, 'logger'>): Sequelize;
//# sourceMappingURL=db.d.ts.map
