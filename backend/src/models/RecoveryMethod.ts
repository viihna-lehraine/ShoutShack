import {
	CreationOptional,
	InferAttributes,
	InferCreationAttributes,
	Model,
	DataTypes,
	Sequelize
} from 'sequelize';
import { Logger } from '../config/logger';
import {
	handleGeneralError,
	validateDependencies
} from '../middleware/errorHandler';
import { User } from './User';

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
): typeof RecoveryMethod {
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
	} catch (error) {
		handleGeneralError(error, logger || console);
		throw error;
	}
}

export { RecoveryMethod };
