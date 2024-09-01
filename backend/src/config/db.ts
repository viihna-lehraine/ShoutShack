import { Sequelize, Options } from 'sequelize';
import { getFeatureFlags } from '../utils/featureFlags';
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

export async function initializeDatabase({
	logger,
	getFeatureFlags,
	getSecrets
}: DBDependencies): Promise<Sequelize> {
	const featureFlags = getFeatureFlags(logger);
	const secrets: DBSecrets = await getSecrets();

	const SEQUELIZE_LOGGING = featureFlags.sequelizeLoggingFlag;

	if (!sequelize) {
		logger.info(
			`Sequelize logging set to ${SEQUELIZE_LOGGING}`
		);

		const sequelizeOptions: Options = {
			host: secrets.DB_HOST,
			dialect: secrets.DB_DIALECT,
			logging: SEQUELIZE_LOGGING ? (msg: string) => logger.info(msg) : false,
		}

		sequelize = new Sequelize(
			secrets.DB_NAME,
			secrets.DB_USER,
			secrets.DB_PASSWORD,
			sequelizeOptions
		);

		try {
			await sequelize.authenticate();
			logger.info('Connection has been established successfully.');
		} catch (error) {
			const errorMessage =
				error instanceof Error
					? `Unable to connect to the database: ${error.message}`
					: 'Unable to connect to the database due to an unknown error';

			logger.error(errorMessage);

			throw new AppError({
				message: errorMessage,
				statusCode: 500,
				isOperational: true,
				errorCode: 'DB_CONNECTION_FAILED',
			}, { logger });
		}
	}

	return sequelize;
}

export function getSequelizeInstance({
	logger
}: Pick<DBDependencies, 'logger'>): Sequelize {
    logger.info('getSequelizeInstance() executing');

    if (!sequelize) {
		const error = new AppError({
			message:
				'Sequelize instance is not initialized. Call initializeDatabase() before attempting to retrieve the Sequelize instance.',
			statusCode: 500,
			isOperational: true,
			errorCode: 'SEQUELIZE_NOT_INITIALIZED',
		}, { logger });

		logger.error(error.message);
		throw error;
	}

    return sequelize;
}
