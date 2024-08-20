import { DataTypes, Model, Sequelize } from 'sequelize';
import { initializeDatabase } from '../index.js';

class GuestbookEntry extends Model {}

async function initializeGuestbookEntryModel() {
	const sequelize = await initializeDatabase();

	GuestbookEntry.init(
		{
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
		},
		{
			sequelize,
			modelName: 'GuestbookEntry',
			timestamps: false
		}
	);

	await GuestbookEntry.sync();
}

// Export a promise that resolves to the GuestbookEntry model
const GuestbookEntryModelPromise = (async () => {
	await initializeGuestbookEntryModel();
	return GuestbookEntry;
})();

export default GuestbookEntryModelPromise;
