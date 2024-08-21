import { Sequelize } from 'sequelize';
import setupLogger from '../middleware/logger';
import getSecrets from './secrets';

let sequelize: Sequelize | null = null;

export async function initializeDatabase(): Promise<Sequelize> {
	if (!sequelize) {
		const secrets = await getSecrets();
		const logger = await setupLogger();

		if (!secrets.DB_NAME || !secrets.DB_USER || !secrets.DB_PASSWORD || !secrets.DB_HOST || !secrets.DB_DIALECT) {
			throw new Error('Missing database configuration in secrets.');
		}

		sequelize = new Sequelize(secrets.DB_NAME, secrets.DB_USER, secrets.DB_PASSWORD, {
			host: secrets.DB_HOST,
			dialect: secrets.DB_DIALECT,
			logging: (msg) => logger.info(msg),
		});

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
		throw new Error('Database has not been initialized. Call initializeDatabase() first.');
	}
	return sequelize;
}
