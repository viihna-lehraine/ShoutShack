import {
	CreationOptional,
	DataTypes,
	InferAttributes,
	InferCreationAttributes,
	Model
} from 'sequelize';
import { User } from './User';
import { validateDependencies } from '../utils/helpers';
import { ServiceFactory } from '../index/factory';
import { RecoveryMethodAttributes } from '../index/interfaces/models';

export class RecoveryMethod
	extends Model<
		InferAttributes<RecoveryMethod>,
		InferCreationAttributes<RecoveryMethod>
	>
	implements RecoveryMethodAttributes
{
	public id!: string;
	public isRecoveryActive!: boolean;
	public recoveryId!: string;
	public recoveryMethod?: 'email' | 'backupCodes' | null;
	public backupCodes!: string[] | null;
	public recoveryLastUpdated!: CreationOptional<Date>;
}

export function createRecoveryMethodModel(): typeof RecoveryMethod | null {
	const logger = ServiceFactory.getLoggerService();
	const errorLogger = ServiceFactory.getErrorLoggerService();
	const errorHandler = ServiceFactory.getErrorHandlerService();

	try {
		const sequelize =
			ServiceFactory.getDatabaseController().getSequelizeInstance();

		if (!sequelize) {
			const databaseError =
				new errorHandler.ErrorClasses.DatabaseErrorRecoverable(
					'Failed to initialize RecoveryMethod model: Sequelize instance not found',
					{ exposeToClient: false }
				);
			errorLogger.logError(databaseError.message);
			errorHandler.handleError({ error: databaseError });
			return null;
		}

		validateDependencies(
			[{ name: 'sequelize', instance: sequelize }],
			logger || console
		);

		RecoveryMethod.init(
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
				isRecoveryActive: {
					type: DataTypes.BOOLEAN,
					defaultValue: false,
					allowNull: false
				},
				recoveryId: {
					type: DataTypes.UUID,
					defaultValue: DataTypes.UUIDV4,
					primaryKey: true,
					allowNull: false,
					unique: true
				},
				recoveryMethod: {
					type: DataTypes.ENUM('email', 'backupCodes'),
					allowNull: true
				},
				backupCodes: {
					type: DataTypes.ARRAY(DataTypes.STRING),
					allowNull: true
				},
				recoveryLastUpdated: {
					type: DataTypes.DATE,
					defaultValue: DataTypes.NOW,
					allowNull: false
				}
			},
			{
				sequelize,
				modelName: 'RecoveryMethod',
				timestamps: true
			}
		);

		return RecoveryMethod;
	} catch (dbError) {
		const databaseError =
			new errorHandler.ErrorClasses.DatabaseErrorRecoverable(
				`Failed to initialize RecoveryMethod model: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`,
				{
					exposeToClient: false
				}
			);
		errorLogger.logError(databaseError.message);
		errorHandler.handleError({ error: databaseError });
		return null;
	}
}
