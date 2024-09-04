import {
	CreationOptional,
	InferAttributes,
	InferCreationAttributes,
	Model,
	DataTypes,
	Sequelize
} from 'sequelize';
import {
	handleGeneralError,
	validateDependencies
} from '../middleware/errorHandler';
import { Logger } from '../config/logger';
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
	sequelize: Sequelize,
	logger: Logger
): typeof GuestbookEntry {
	try {
		validateDependencies(
			[
				{ name: 'sequelize', instance: sequelize },
				{ name: 'logger', instance: logger }
			],
			logger || console
		);

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
					validate: {
						len: [0, 255]
					}
				},
				guestEmail: {
					type: DataTypes.STRING,
					allowNull: true,
					validate: {
						isEmail: true
					}
				},
				guestMessage: {
					type: DataTypes.TEXT,
					allowNull: false,
					validate: {
						notEmpty: true
					}
				},
				guestMessageStyles: {
					type: DataTypes.JSON,
					allowNull: true
				},
				entryDate: {
					type: DataTypes.DATE,
					defaultValue: DataTypes.NOW,
					allowNull: false
				}
			},
			{
				sequelize,
				modelName: 'GuestbookEntry',
				timestamps: true
			}
		);

		logger.info('GuestbookEntry model initialized successfully');
		return GuestbookEntry;
	} catch (error) {
		handleGeneralError(error, logger || console);
		throw error;
	}
}
