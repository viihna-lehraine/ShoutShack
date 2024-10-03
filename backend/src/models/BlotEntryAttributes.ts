import {
	CreationOptional,
	DataTypes,
	InferAttributes,
	InferCreationAttributes,
	Model
} from 'sequelize';
import { User } from './User';
import { ServiceFactory } from '../index/factory';
import { BlotEntryAttributes } from '../index/interfaces/models';

export class BlotEntry
	extends Model<
		InferAttributes<BlotEntry>,
		InferCreationAttributes<BlotEntry>
	>
	implements BlotEntryAttributes
{
	public id!: string;
	public guestName!: string | null;
	public guestEmail!: string | null;
	public guestMessage!: string;
	public guestMessageStyles!: object | null;
	public entryDate!: CreationOptional<Date>;
}

export function createBlotEntryModel(): typeof BlotEntry | null {
	const logger = ServiceFactory.getLoggerService();
	const errorLogger = ServiceFactory.getErrorLoggerService();
	const errorHandler = ServiceFactory.getErrorHandlerService();

	try {
		const sequelize =
			ServiceFactory.getDatabaseController().getSequelizeInstance();

		if (!sequelize) {
			const databaseError =
				new errorHandler.ErrorClasses.DatabaseErrorRecoverable(
					'Failed to initialize BlotEntry model: Sequelize instance not found',
					{ exposeToClient: false }
				);
			errorLogger.logError(databaseError.message);
			errorHandler.handleError({ error: databaseError });
			return null;
		}

		BlotEntry.init(
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
				modelName: 'BlotEntry',
				timestamps: true
			}
		);

		logger.info('BlotEntry model initialized successfully');
		return BlotEntry;
	} catch (dbError) {
		const databaseError =
			new errorHandler.ErrorClasses.DatabaseErrorRecoverable(
				`Failed to initialize BlotEntry model: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`,
				{
					exposeToClient: false
				}
			);
		errorLogger.logError(databaseError.message);
		errorHandler.handleError({ error: databaseError });
		return null;
	}
}
