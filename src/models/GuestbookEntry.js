import { Sequelize, DataTypes, Model } from 'sequelize';
import initializeDatabase from '../config/db';

class GuestbookEntry extends Model {};

async function initializeGuestbookEntryModel() {
  const sequelize = await initializeDatabase();

  GuestbookEntry.init(
    {
      guestName: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: false,
      },
      guestEmail: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: false,
      },
      guestMessage: {
        type: DataTypes.TEXT,
        allowNull: false,
        unique: false,
      },
      guestMessageStyles: {
        type: DataTypes.JSON,
        allowNull: true,
        unique: false,
      },
      entryDate: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false,
        unique: false,
      },
    },
    {
      sequelize,
      modelName: 'GuestbookEntry',
      timestamps: false,
    },
  );

  await GuestbookEntry.sync();
};

// Initialize and export the GuestbookEntry model
async function initializeAndExportGuestbookEntry() {
  await initializeGuestbookEntryModel();
  return GuestbookEntry;
};

const GuestbookEntryModel = await initializeAndExportGuestbookEntry();
export default GuestbookEntryModel;