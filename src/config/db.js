import Sequelize from 'sequelize';
import { getSecrets, setupLogger } from '../index.js';

const initializeDatabase = async () => {
  const secrets = await getSecrets();
  const logger = await setupLogger();

  const sequelize = new Sequelize(
    secrets.DB_NAME,
    secrets.DB_USER,
    secrets.DB_PASSWORD,
    {
      host: secrets.DB_HOST,
      dialect: 'postgres',
      logging: (msg) => logger.info(msg),
    },
  );

  try {
    await sequelize.authenticate();
    logger.info('Connection has been established successfully.');
  } catch (error) {
    logger.error('Unable to connect to the database:', error);
  }

  return sequelize;
};

export default initializeDatabase;
