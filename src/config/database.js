// Guestbook - version 0.0.0 (initial development)
// Licensed under GNU GPLv3 (https://www.gnu.org/licenses/gpl-3.0.html)
// Author: Viihna Lehraine (viihna@voidfucker.com || viihna.78 (Signal) || Viihna-Lehraine (Github))



const { Sequelize } = require('sequelize');
const getSecrets = require('./sops');


async function initializeDatabase() {
    const secrets = await getSecrets();
    console.log('database.js - Secrets: ', secrets);
    const dbUrl = secrets.DB_URL;
    if (!dbUrl) {
        throw new Error('database.js - Database URL not found in secrets');
    }

    const sequelize = new Sequelize(databaseUrl, {
        dialect: secrets.DB_DIALECT,
        protocol: secrets.DB_PROTOCOL,
        dialectOptions: {
            ssl: secrets.USE_SSL || false,
        },
        define: {
            timstamps: true,
            underscored: true
        },
    });

    try {
        await sequelize.authenticate();
        console.log('database.js - Connection has been established successfully.');
    } catch (error) {
        console.error('database.js - Unable to connect to the database: ', error);
    }

    return sequelize;
}


module.exports = initializeDatabase;