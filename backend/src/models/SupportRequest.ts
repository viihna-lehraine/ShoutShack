import {
	DataTypes,
	InferAttributes,
	InferCreationAttributes,
	Model
} from 'sequelize';
import { User } from './User';
import { validateDependencies } from '../utils/helpers';
import { ServiceFactory } from '../index/factory';
import { SupportRequestAttributes } from '../index/interfaces/models';

class SupportRequest
	extends Model<
		InferAttributes<SupportRequest>,
		InferCreationAttributes<SupportRequest>
	>
	implements SupportRequestAttributes
{
	public id!: string;
	public email!: string;
	public supportTicketNumber!: number;
	public supportType!: string;
	public supportContent!: string;
	public isSupportTicketOpen!: boolean;
	public supportTicketOpenDate!: Date;
	public supportTicketCloseDate?: Date | null;
}

export function createSupportRequestModel(): typeof SupportRequest | null {
	const logger = ServiceFactory.getLoggerService();
	const errorLogger = ServiceFactory.getErrorLoggerService();
	const errorHandler = ServiceFactory.getErrorHandlerService();

	try {
		const sequelize =
			ServiceFactory.getDatabaseController().getSequelizeInstance();

		if (!sequelize) {
			const databaseError =
				new errorHandler.ErrorClasses.DatabaseErrorRecoverable(
					'Failed to initialize SupportRequest model: Sequelize instance not found',
					{ exposeToClient: false }
				);
			errorLogger.logError(databaseError.message);
			errorHandler.handleError({ error: databaseError });
			return null;
		}

		validateDependencies(
			[{ name: 'sequelize', instance: sequelize }],
			logger
		);

		SupportRequest.init(
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
				email: {
					type: DataTypes.STRING,
					allowNull: false
				},
				supportTicketNumber: {
					type: DataTypes.INTEGER,
					autoIncrement: true,
					allowNull: true,
					unique: true
				},
				supportType: {
					type: DataTypes.TEXT,
					allowNull: false
				},
				supportContent: {
					type: DataTypes.TEXT,
					allowNull: false
				},
				isSupportTicketOpen: {
					type: DataTypes.BOOLEAN,
					defaultValue: true,
					allowNull: false
				},
				supportTicketOpenDate: {
					type: DataTypes.DATE,
					defaultValue: DataTypes.NOW,
					allowNull: false
				},
				supportTicketCloseDate: {
					type: DataTypes.DATE,
					allowNull: true
				}
			},
			{
				sequelize,
				modelName: 'SupportRequest',
				timestamps: true
			}
		);

		return SupportRequest;
	} catch (dbError) {
		const databaseError =
			new errorHandler.ErrorClasses.DatabaseErrorRecoverable(
				`Failed to initialize SupportRequest model: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`,
				{
					exposeToClient: false
				}
			);
		errorLogger.logError(databaseError.message);
		errorHandler.handleError({ error: databaseError });
		return null;
	}
}

export { SupportRequest };
