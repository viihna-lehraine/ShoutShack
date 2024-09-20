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

interface RecoveryMethodAttributes {
	id: string; // UUID for recovery method, primary key (from User model)
	isRecoveryActive: boolean;
	recoveryId: string; // UUID for recovery method, primary key
	recoveryMethod?: 'email' | 'backupCodes' | null;
	backupCodes?: string[] | null;
	recoveryLastUpdated: Date;
}

class RecoveryMethod
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

export default function createRecoveryMethodModel(
	sequelize: Sequelize,
	logger: Logger
): typeof RecoveryMethod | null {
	try {
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
		const databaseError = new errorClasses.DatabaseErrorRecoverable(
			`Failed to initialize RecoveryMethod model: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`,
			{
				exposeToClient: false
			}
		);
		ErrorLogger.logInfo(databaseError.message, logger);
		processError(databaseError, logger);
		return null;
	}
}

export { RecoveryMethod };
