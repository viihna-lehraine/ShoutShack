const { Sequelize, DataTypes, Model } = require("sequelize");
const initializeDatabase = require("../config/db");


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
    modelName: "GuestbookEntry",
    timestamps: false
  });

  await GuestbookEntry.sync();
}


initializeDatabase();


module.exports = GuestbookEntry;