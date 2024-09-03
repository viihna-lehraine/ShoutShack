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
	id: string; // UUID for guestbook entry, primary key (from User model)
	guestName?: string | null; // name of the guest
	guestEmail?: string | null; // email of the guest
	guestMessage: string; // message left by the guest
	guestMessageStyles?: object | null; // styles for the message
	entryDate: Date; // date the entry was made
}

class GuestbookEntry
	extends Model<
		InferAttributes<GuestbookEntry>,
		InferCreationAttributes<GuestbookEntry>
	>
	implements GuestbookEntryAttributes
{
	id!: string; // initialized as a non-nullable string (UUID)
	guestName!: string | null; // nullable, may contain string or null
	guestEmail!: string | null; // nullable, may contain string or null
	guestMessage!: string; // initialized as a non-nullable string
	guestMessageStyles!: object | null; // nullable, may contain object or null
	entryDate!: CreationOptional<Date>; // optional field, defaults to current date
}

export default function createGuestbookEntryModel(
	sequelize: Sequelize
): typeof GuestbookEntry {
	GuestbookEntry.init(
		{
			id: {
				type: DataTypes.UUID,
				defaultValue: DataTypes.UUIDV4, // default to a generated UUID from the User model
				primaryKey: true,
				allowNull: false,
				unique: true,
				references: {
					model: User,
					key: 'id'
				}
			},
			guestName: {
				// name of the guest
				type: DataTypes.STRING,
				allowNull: true,
				unique: false,
				validate: {
					len: [0, 255] // max length validation
				}
			},
			guestEmail: {
				type: DataTypes.STRING,
				allowNull: true, // email is optional
				unique: false,
				validate: {
					isEmail: true // validates email format
				}
			},
			guestMessage: {
				type: DataTypes.TEXT,
				allowNull: false, // message is required to submit
				unique: false,
				validate: {
					notEmpty: true // ensures message is not empty
				}
			},
			guestMessageStyles: {
				type: DataTypes.JSON,
				allowNull: true, // styles are optional
				unique: false
			},
			entryDate: {
				type: DataTypes.DATE,
				defaultValue: DataTypes.NOW,
				allowNull: false, // entry date is required
				unique: false
			}
		},
		{
			sequelize,
			modelName: 'GuestbookEntry',
			timestamps: true // automatically manage createdAt and updatedAt fields
		}
	);

	return GuestbookEntry;
}
