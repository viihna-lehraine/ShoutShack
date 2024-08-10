import Sequelize from 'sequelize';
import setupLogger from './logger.js';
import getSecrets from './secrets.js';

let sequelize;

async function initializeDatabase() {
	const secrets = await getSecrets();
	const logger = await setupLogger();

	if (
		!secrets.DB_NAME ||
		!secrets.DB_USER ||
		!secrets.DB_PASSWORD ||
		!secrets.DB_HOST
	) {
		throw new Error('Missing database configuration in secrets.');
	}

	sequelize = new Sequelize(
		secrets.DB_NAME,
		secrets.DB_USER,
		secrets.DB_PASSWORD,
		{
			host: secrets.DB_HOST,
			dialect: 'postgres',
			logging: (msg) => logger.info(msg),
		}
	);

	try {
		await sequelize.authenticate();
		logger.info('Connection has been established successfully.');
	} catch (error) {
		logger.error('Unable to connect to the database:', error);
	}

	return sequelize;
}

export default initializeDatabase;
