import { Sequelize } from 'sequelize';
import { getFeatureFlags } from './featureFlags';
import { Logger } from 'winston';
export interface DBSecrets {
    DB_NAME: string;
    DB_USER: string;
    DB_PASSWORD: string;
    DB_HOST: string;
    DB_DIALECT: 'mysql' | 'postgres' | 'sqlite' | 'mariadb' | 'mssql';
}
export interface DBDependencies {
    logger: Logger;
    getFeatureFlags: (logger: any) => ReturnType<typeof getFeatureFlags>;
    getSecrets: () => Promise<DBSecrets>;
}
export declare function initializeDatabase({ logger, getFeatureFlags, getSecrets }: DBDependencies): Promise<Sequelize>;
export declare function getSequelizeInstance({ logger }: Pick<DBDependencies, 'logger'>): Sequelize;
//# sourceMappingURL=db.d.ts.map