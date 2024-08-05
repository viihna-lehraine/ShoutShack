const { Sequelize, DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');
const getSecrets = require('../config/sops');

const secrets = getSecrets();


Guestbook.init({
    guestName: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: false
    },
    guestEmail: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: false
    },
    guestMessage: {
        type: DataTypes.TEXT,
        allowNull: false,
        unique: false
    },
    guestMessageStyles: {
        type: DataTypes.JSON,
        allowNull: true,
        unique: false
    },
    entryDate: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false,
        unique: false
    }
});


module.exports = Guestbook;