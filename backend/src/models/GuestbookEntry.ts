import {
	CreationOptional,
	InferAttributes,
	InferCreationAttributes,
	Model,
	DataTypes,
	Sequelize
} from 'sequelize';
import { User } from './User';

interface GuestbookEntryAttributes {
	id: string;
	guestName?: string | null;
	guestEmail?: string | null;
	guestMessage: string;
	guestMessageStyles?: object | null;
	entryDate: Date;
}

class GuestbookEntry
	extends Model<
		InferAttributes<GuestbookEntry>,
		InferCreationAttributes<GuestbookEntry>
	>
	implements GuestbookEntryAttributes
{
	id!: string;
	guestName!: string | null;
	guestEmail!: string | null;
	guestMessage!: string;
	guestMessageStyles!: object | null;
	entryDate!: CreationOptional<Date>;
}

export default function createGuestbookEntryModel(
	sequelize: Sequelize
): typeof GuestbookEntry {
	GuestbookEntry.init(
		{
			id: {
				type: DataTypes.UUID,
				defaultValue: DataTypes.UUIDV4,
				primaryKey: true,
				allowNull: false,
				unique: true,
				references: {
					model: User,
					key: 'id'
				}
			},
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
				defaultValue: DataTypes.NOW,
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

	return GuestbookEntry;
}
