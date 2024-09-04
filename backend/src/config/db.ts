import { Sequelize, Options } from 'sequelize';
import { AppError } from '../config/errorClasses';
import { FeatureFlags } from './environmentConfig';
import { Logger } from './logger';
import { handleGeneralError, validateDependencies } from '../middleware/errorHandler';

export interface DBSecrets {
	DB_NAME: string;
	DB_USER: string;
	DB_PASSWORD: string;
	DB_HOST: string;
	DB_DIALECT: 'mysql' | 'postgres' | 'sqlite' | 'mariadb' | 'mssql';
}

export interface DBDependencies {
	logger: Logger;
	featureFlags: FeatureFlags,
	getSecrets: () => Promise<DBSecrets>;
}

let sequelize: Sequelize | null = null;

export async function initializeDatabase({
	logger,
	featureFlags,
	getSecrets
}: DBDependencies): Promise<Sequelize | undefined> {
	try {
		validateDependencies(
			[
				{ name: 'logger', instance: logger },
				{ name: 'featureFlags', instance: featureFlags },
				{ name: 'getSecrets', instance: getSecrets }
			],
			logger || console
		);

		const secrets: DBSecrets = await getSecrets();

		if (!sequelize) {
			logger.info(
				`Sequelize logging set to ${featureFlags.sequelizeLoggingFlag}`
			);

			const sequelizeOptions: Options = {
				host: secrets.DB_HOST,
				dialect: secrets.DB_DIALECT,
				logging: featureFlags.sequelizeLoggingFlag ? (msg: string) => logger.info(msg) : false,
			}

			sequelize = new Sequelize(
				secrets.DB_NAME,
				secrets.DB_USER,
				secrets.DB_PASSWORD,
				sequelizeOptions
			);

			await sequelize.authenticate();
			logger.info('Connection has been established successfully.');
		}

		return sequelize;
	} catch (error) {
		handleGeneralError(error as Error, logger || console);
		return undefined;
	}
}

export function getSequelizeInstance({
	logger
}: Pick<DBDependencies, 'logger'>): Sequelize {
    logger.info('getSequelizeInstance() executing');

    if (!sequelize) {
		const error = new AppError(
			'Sequelize instance is not initialized. Call initializeDatabase() before attempting to retrieve the Sequelize instance.',
			500,
			'SEQUELIZE_NOT_INITIALIZED'
		);

		handleGeneralError(error, logger || console);
		throw error;
	}

    return sequelize;
}
