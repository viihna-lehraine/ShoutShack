// Guestbook - version 0.0.0 (initial development)
// Licensed under GNU GPLv3 (https://www.gnu.org/licenses/gpl-3.0.html)
// Author: Viihna Lehraine (viihna@viihnatech.com || viihna.78 (Signal) || Viihna-Lehraine (Github))



const { Sequelize } = require('sequelize');
const getSecrets = require('./sops');


async function initializeDatabase() {
    const secrets = await getSecrets();

    if (secrets) {
        console.log('db.js - secrets retrieved');
    }

    const dbUrl = secrets.DB_URL;

    if (!dbUrl) {
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
    });

    try {
        await sequelize.authenticate();
        console.log('db.js - Connection has been established successfully.');
    } catch (error) {
        console.error('db.js - Unable to connect to the database: ', error);
    }

    return sequelize;
}


module.exports = initializeDatabase;