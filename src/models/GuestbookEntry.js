// Guestbook - version 0.0.0 (initial development)
// Licensed under GNU GPLv3 (https://www.gnu.org/licenses/gpl-3.0.html)
// Author: Viihna Lehraine (viihna@viihnatech.com || viihna.78 (Signal) || Viihna-Lehraine (Github))



const { Sequelize, DataTypes, Model } = require('sequelize');
const initializeDatabase = require('../config/db');


class GuestbookEntry extends Model {};


async function initializeGuestbookEntryModel() {
    const sequelize = await initializeDatabase();

    GuestbookEntry.init({
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
    }, {
        sequelize,
        modelName: 'GuestbookEntry',
        timestamps: false
    });

    await GuestbookEntry.sync();
}


initializeDatabase();


module.exports = GuestbookEntry;