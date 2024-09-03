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
	id: string; // UUID for recovery method, primary key (from User model)
	isRecoveryActive: boolean; // indicates if the recovery method is active
	recoveryId: string; // UUID for recovery method, primary key
	recoveryMethod?: 'email' | 'backupCodes' | null; // type of recovery method
	backupCodes?: string[] | null; // optional array of backup codes
	recoveryLastUpdated: Date; // date when the recovery method was last updated
}

class RecoveryMethod
	extends Model<
		InferAttributes<RecoveryMethod>,
		InferCreationAttributes<RecoveryMethod>
	>
	implements RecoveryMethodAttributes
{
	id!: string; // initialized as a non-nullable string (UUID)
	isRecoveryActive!: boolean; // initialized as a non-nullable boolean
	recoveryId!: string; // initialized as a non-nullable string (UUID)
	recoveryMethod?: 'email' | 'backupCodes'; // initialized as a nullable string with two possible values
	backupCodes!: string[] | null; // nullable, may contain an array of strings or null
	recoveryLastUpdated!: CreationOptional<Date>; // optional field, defaults to current date
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
}
