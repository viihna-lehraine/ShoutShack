import { Sequelize } from 'sequelize';
import setupLogger from './logger';
import featureFlags from './featureFlags';
import getSecrets from './secrets';

interface DBSecrets {
	DB_NAME: string;
	DB_USER: string;
	DB_PASSWORD: string;
	DB_HOST: string;
	DB_DIALECT: 'mysql' | 'postgres' | 'sqlite' | 'mariadb' | 'mssql';
}

let sequelize: Sequelize | null = null;
const logger = await setupLogger();
const secrets: DBSecrets = await getSecrets();

export async function initializeDatabase(): Promise<Sequelize> {
	if (!sequelize) {
		logger.info(
			`Sequelize logging is set to ${featureFlags.sequelizeLoggingFlag}, data type: ${typeof featureFlags.sequelizeLoggingFlag}`
		);

		sequelize = new Sequelize(
			secrets.DB_NAME,
			secrets.DB_USER,
			secrets.DB_PASSWORD,
			{
				host: secrets.DB_HOST,
				dialect: secrets.DB_DIALECT,
				logging: featureFlags.sequelizeLoggingFlag
					? msg => logger.info(msg)
					: false
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
	if (!sequelize) {
		throw new Error(
			'Database has not been initialized. Call initializeDatabase() before attempting to retrieve the Sequelize instance.'
		);
	}
	return sequelize;
}
