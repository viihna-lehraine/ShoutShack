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

interface SupportRequestAttributes {
	id: string; // UUID for support request, primary key (from user model)
	email: string;
	supportTicketNumber: number; // unique support ticket number, auto-incremented
	supportType: string;
	supportContent: string;
	isSupportTicketOpen: boolean;
	supportTicketOpenDate: CreationOptional<Date>;
	supportTicketCloseDate?: Date | null;
}

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

export default function createSupportRequestModel(
	sequelize: Sequelize,
	logger: Logger
): typeof SupportRequest | null {
	try {
		validateDependencies(
			[{ name: 'sequelize', instance: sequelize }],
			logger || console
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
		const databaseError = new errorClasses.DatabaseErrorRecoverable(
			`Failed to initialize SupportRequest model: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`,
			{
				exposeToClient: false
			}
		);
		ErrorLogger.logInfo(databaseError.message, logger);
		processError(databaseError, logger);
		return null;
	}
}

export { SupportRequest };
