import { Sequelize } from 'sequelize';
import { getFeatureFlags } from './featureFlags';
import AppError from '../errors/AppError';
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

let sequelize: Sequelize | null = null;

export async function initializeDatabase({ logger, getFeatureFlags, getSecrets }: DBDependencies): Promise<Sequelize> {
	const featureFlags = getFeatureFlags(logger);
	const secrets: DBSecrets = await getSecrets();

	const SEQUELIZE_LOGGING = featureFlags.sequelizeLoggingFlag;

	if (!sequelize) {
		logger.info(
			`Sequelize logging set to ${SEQUELIZE_LOGGING}`
		);

		sequelize = new Sequelize(
			secrets.DB_NAME,
			secrets.DB_USER,
			secrets.DB_PASSWORD,
			{
				host: secrets.DB_HOST,
				dialect: secrets.DB_DIALECT,
				logging: SEQUELIZE_LOGGING ? (msg: string) => logger.info(msg) : false,
			}
		);

		try {
			await sequelize.authenticate();
			logger.info('Connection has been established successfully.');
		} catch (error) {
			if (error instanceof Error) {
				logger.error(`Unable to connect to the database: ${error}`);
			} else {
				logger.error(
					'Unable to connect to the database due to an unknown error'
				);
			}
			throw error;
		}
	}

	return sequelize;
}

export function getSequelizeInstance({ logger }: Pick<DBDependencies, 'logger'>): Sequelize {
    logger.info('getSequelizeInstance() executing');
    if (!sequelize) {
        logger.error('Sequelize instance is not initialized');
        throw new AppError({
            message: 'Sequelize instance is not initialized. Call initializeDatabase() before attempting to retrieve the Sequelize instance.',
            statusCode: 500,
            isOperational: true,
            errorCode: 'SEQUELIZE_NOT_INITIALIZED',
        }, { logger });
    }

    return sequelize;
}
