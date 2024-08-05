const { Sequelize } = require('sequelize');
const getSecrets = require('./sops');

const secrets = getSecrets();


const sequelize = new Sequelize(secrets.DB_URL, {
    dialect: secrets.SEQ_DIALECT,
    protocol: secrets.SEQ_PROTOCOL,
    logging: true,
});


sequelize.authenticate()
    .then(() => console.log('Database connected'))
    .catch(err => console.log('Error: ' + err));


module.exports = sequelize;