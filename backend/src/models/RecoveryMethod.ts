import {
	CreationOptional,
	InferAttributes,
	InferCreationAttributes,
	Model,
	DataTypes,
	Sequelize
} from 'sequelize';
import { User } from './User';

interface RecoveryMethodAttributes {
	id: string;
	isRecoveryActive: boolean;
	recoveryId: string;
	recoveryMethod: 'email' | 'backupCodes';
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
	id!: string;
	isRecoveryActive!: boolean;
	recoveryId!: string;
	recoveryMethod!: 'email' | 'backupCodes';
	backupCodes!: string[] | null;
	recoveryLastUpdated!: CreationOptional<Date>;
}

export default function createRecoveryMethodModel(
	sequelize: Sequelize
): typeof RecoveryMethod {
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
				allowNull: true
			}
		},
		{
			sequelize,
			modelName: 'RecoveryMethod',
			timestamps: true
		}
	);
	return RecoveryMethod;
}
