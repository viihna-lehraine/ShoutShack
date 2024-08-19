import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import initializeDatabase from '../config/db.js';
import UserModelPromise from './User.js';

interface GuestbookEntryAttributes {
	id: string;
	guestName?: string | null;
	guestEmail?: string | null;
	guestMessage: string;
	guestMessageStyles?: object | null;
	entryDate: Date;
}

class GuestbookEntry extends Model<InferAttributes<GuestbookEntry>, InferCreationAttributes<GuestbookEntry>> implements GuestbookEntryAttributes {
	id!: string;
	guestName!: string | null;
	guestEmail!: string | null;
	guestMessage!: string;
	guestMessageStyles!: object | null;
	entryDate!: CreationOptional<Date>;
}

async function initializeGuestbookEntryModel(): Promise<typeof GuestbookEntry> {
	const sequelize = await initializeDatabase();

	GuestbookEntry.init(
		{
			id: {
				type: DataTypes.UUID,
				defaultValue: DataTypes.UUIDV4,
				primaryKey: true,
				allowNull: false,
				unique: true,
				references: {
					model: await UserModelPromise,
					key: 'id',
				}
			},
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
				defaultValue: DataTypes.NOW,
				allowNull: false,
				unique: false,
			},
		},
		{
			sequelize,
			modelName: 'GuestbookEntry',
			timestamps: false,
		}
	);

	await GuestbookEntry.sync();
	return GuestbookEntry;
}

// Export the initialized model
const GuestbookEntryModelPromise = initializeGuestbookEntryModel();
export default GuestbookEntryModelPromise;
