import {
	CreationOptional,
	InferAttributes,
	InferCreationAttributes,
	Model,
	DataTypes,
	Sequelize
} from 'sequelize';

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
				type: DataTypes.STRING,
				allowNull: false,
				primaryKey: true
			},
			guestName: {
				type: DataTypes.STRING,
				allowNull: true
			},
			guestEmail: {
				type: DataTypes.STRING,
				allowNull: true
			},
			guestMessage: {
				type: DataTypes.TEXT,
				allowNull: false
			},
			guestMessageStyles: {
				type: DataTypes.JSON,
				allowNull: true
			},
			entryDate: {
				type: DataTypes.DATE,
				allowNull: false,
				defaultValue: DataTypes.NOW
			}
		},
		{
			sequelize,
			tableName: 'GuestbookEntries',
			timestamps: false
		}
	);

	return GuestbookEntry;
}
