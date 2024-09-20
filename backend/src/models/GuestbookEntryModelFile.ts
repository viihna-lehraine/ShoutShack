import {
	CreationOptional,
	DataTypes,
	InferAttributes,
	InferCreationAttributes,
	Model,
	Sequelize
} from 'sequelize';
import { User } from './UserModelFile';
import { errorClasses } from '../errors/errorClasses';
import { ErrorLogger } from '../errors/errorLogger';
import { processError } from '../errors/processError';
import { Logger } from '../utils/appLogger';
import { validateDependencies } from '../utils/validateDependencies';

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
	public id!: string;
	public guestName!: string | null;
	public guestEmail!: string | null;
	public guestMessage!: string;
	public guestMessageStyles!: object | null;
	public entryDate!: CreationOptional<Date>;
}

export default function createGuestbookEntryModel(
	sequelize: Sequelize,
	logger: Logger
): typeof GuestbookEntry | null {
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
	} catch (dbError) {
		const databaseError = new errorClasses.DatabaseErrorRecoverable(
			`Failed to initialize GuestbookEntry model: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`,
			{
				exposeToClient: false
			}
		);
		ErrorLogger.logInfo(databaseError.message, logger);
		processError(databaseError, logger);
		return null;
	}
}

export { GuestbookEntry };
