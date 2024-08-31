import {
	CreationOptional,
	InferAttributes,
	InferCreationAttributes,
	Model,
	DataTypes,
	Sequelize
} from 'sequelize';

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
				type: DataTypes.STRING,
				allowNull: false,
				primaryKey: true
			},
			isRecoveryActive: {
				type: DataTypes.BOOLEAN,
				allowNull: false,
				defaultValue: true
			},
			recoveryId: {
				type: DataTypes.STRING,
				allowNull: false
			},
			recoveryMethod: {
				type: DataTypes.ENUM('email', 'backupCodes'),
				allowNull: false
			},
			backupCodes: {
				type: DataTypes.ARRAY(DataTypes.STRING),
				allowNull: true
			},
			recoveryLastUpdated: {
				type: DataTypes.DATE,
				allowNull: false,
				defaultValue: DataTypes.NOW
			}
		},
		{
			sequelize,
			tableName: 'RecoveryMethods',
			timestamps: false
		}
	);

	return RecoveryMethod;
}
