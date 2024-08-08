const { Sequelize } = require('sequelize');
const { getSecrets } = require('./sops');
const setupLogger = require('./logger');

async function initializeDatabase() {
  const secrets = await getSecrets();
  const logger = await setupLogger();

  if (secrets) {
    logger.info('initializeDatabase() - secrets retrieved');
  }

  const dbUrl = secrets.DB_URL;

  if (!dbUrl) {
    logger.error('initializeDatabase() - Datbase URL not found in secrets');
    throw new Error('initializeDatabase() - Database URL not found in secrets');
  }

  const dialectOptions = secrets.USE_SSL
    ? {
        ssl: {
          require: true,
          rejectUnauthorized: false, // *DEV_NOTE*
          key: secrets.DB_SSL_KEY,
          cert: secrets.DB_SSL_CERT,
        },
      }
    : {};

  const sequelize = new Sequelize(dbUrl, {
    dialect: secrets.DB_DIALECT,
    protocol: secrets.DB_PROTOCOL,
    dialectOptions,
    define: {
      timestamps: true,
      underscored: true,
    },
    logging: (msg) => logger.debug(`initializeDatabase() - Sequelize: ${msg}`),
  });

  try {
    await sequelize.authenticate();
    logger.info(
      'initializeDatabase() - Connection has been established successfully.',
    );
  } catch (error) {
    logger.error(
      'initializeDatabase() - Unable to connect to the database: ',
      error,
    );
  }

  return sequelize;
}

module.exports = initializeDatabase;
