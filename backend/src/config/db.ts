import { Sequelize } from 'sequelize';
import setupLogger from './logger';
import { getFeatureFlags } from './featureFlags';
import getSecrets from './sops';
import AppError from '../errors/AppError';

interface DBSecrets {
	DB_NAME: string;
	DB_USER: string;
	DB_PASSWORD: string;
	DB_HOST: string;
	DB_DIALECT: 'mysql' | 'postgres' | 'sqlite' | 'mariadb' | 'mssql';
}
let sequelize: Sequelize | null = null;
const featureFlags = getFeatureFlags();
const logger = setupLogger();
const secrets: DBSecrets = await getSecrets.getSecrets();

const SEQUELIZE_LOGGING = featureFlags.sequelizeLoggingFlag;

export async function initializeDatabase(): Promise<Sequelize> {
	if (!sequelize) {
		logger.info(
			`Sequelize logging set to ${SEQUELIZE_LOGGING}, data type: ${typeof SEQUELIZE_LOGGING}`
		);

		sequelize = new Sequelize(
			secrets.DB_NAME,
			secrets.DB_USER,
			secrets.DB_PASSWORD,
			{
				host: secrets.DB_HOST,
				dialect: secrets.DB_DIALECT,
				logging: SEQUELIZE_LOGGING ? msg => logger.info(msg) : false
			}
		);

		try {
			await sequelize.authenticate();
			logger.info('Connection has been established successfully.');
		} catch (error) {
			if (error instanceof Error) {
				logger.error('Unable to connect to the database:', error);
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

export function getSequelizeInstance(): Sequelize {
	logger.info('getSequelizeInstance() executing');
	if (!sequelize) {
		logger.error('Database has not bee initialized');
		throw new AppError(
			'Database has not been initialized. Call initializeDatabase() before attempting to retrieve the Sequelize instance.',
			400
		);
	}

	return sequelize;
}
