// Guestbook - version 0.0.0 (initial development)
// Licensed under GNU GPLv3 (https://www.gnu.org/licenses/gpl-3.0.html)
// Author: Viihna Lehraine (viihna@viihnatech.com || viihna.78 (Signal) || Viihna-Lehraine (Github))



const { Sequelize } = require('sequelize');
const { getSecrets } = require('./sops');
const setupLogger = require('./logger');


async function initializeDatabase() {
    const secrets = await getSecrets();
    const logger = await setupLogger();

    if (secrets) {
        logger.info('db.js - secrets retrieved');
    }

    const dbUrl = secrets.DB_URL;

    if (!dbUrl) {
        logger.error('db.js - Datbase URL not found in secrets');
        throw new Error('db.js - Database URL not found in secrets');
    }

    const dialectOptions = secrets.USE_SSL ? {
        ssl: {
            require: true,
            rejectUnauthorized: false, // *DEV_NOTE*
            key: secrets.DB_SSL_KEY,
            cert: secrets.DB_SSL_CERT,
        }
    } : {};

    const sequelize = new Sequelize(dbUrl, {
        dialect: secrets.DB_DIALECT,
        protocol: secrets.DB_PROTOCOL,
        dialectOptions,
        define: {
            timestamps: true,
            underscored: true
        },
        logging: (msg) => logger.debug(`Sequelize: ${msg}`)
    })

    try {
        await sequelize.authenticate();
        logger.info('db.js - Connection has been established successfully.');
    } catch (error) {
        logger.error('db.js - Unable to connect to the database: ', error);
    }

    return sequelize;
}


module.exports = initializeDatabase;