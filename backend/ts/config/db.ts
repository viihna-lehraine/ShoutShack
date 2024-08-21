import { Sequelize } from 'sequelize';
import setupLogger from '../middleware/logger';
import featureFlags from './featureFlags';
import getSecrets from './secrets';

let sequelize: Sequelize | null = null;

export async function initializeDatabase(): Promise<Sequelize> {
	if (!sequelize) {
		let secrets = await getSecrets();
		let logger = await setupLogger();

		console.log(
			'Sequelize logging is set to ',
			featureFlags.sequelizeLoggingFlag,
			' data type: ',
			typeof featureFlags.sequelizeLoggingFlag
		);

		sequelize = new Sequelize(
			secrets.DB_NAME,
			secrets.DB_USER,
			secrets.DB_PASSWORD,
			{
				host: secrets.DB_HOST,
				dialect: secrets.DB_DIALECT,
				logging: process.env.FEATURE_SEQUELIZE_LOGGING
					? (msg) => logger.info(msg)
					: false
			}
		);

		try {
			await sequelize.authenticate();
			logger.info('Connection has been established successfully.');
		} catch (error) {
			logger.error('Unable to connect to the database:', error);
			throw error;
		}
	}

	return sequelize;
}

export function getSequelizeInstance(): Sequelize {
	if (!sequelize) {
		throw new Error(
			'Database has not been initialized. Call initializeDatabase() first.'
		);
	}
	return sequelize;
}
