import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import initializeDatabase from '../config/db.js';
import UserModelPromise from './User.js';

interface RecoveryMethodAttributes {
	id: string;
	isRecoveryActive: boolean
	recoveryId: string;
	recoveryMethod: 'email' | 'backupCodes';
	backupCodes?: string[] | null;
	recoveryLastUpdated: Date;
}

class RecoveryMethod extends Model<InferAttributes<RecoveryMethod>, InferCreationAttributes<RecoveryMethod>> implements RecoveryMethodAttributes {
	id!: string;
	isRecoveryActive!: boolean;
	recoveryId!: string;
	recoveryMethod!: 'email' | 'backupCodes';
	backupCodes!: string[] | null;
	recoveryLastUpdated!: Date;
}

async function initializeRecoveryMethodModel(): Promise<typeof RecoveryMethod> {
	const sequelize = await initializeDatabase();

	RecoveryMethod.init(
		{
			id: {
				type: DataTypes.UUID,
				defaultValue: DataTypes.UUIDV4,
				primaryKey: true,
				allowNull: false,
				unique: true,
				references: {
					model: await UserModelPromise,
					key: 'id',
				}
			},
			isRecoveryActive: {
				type: DataTypes.BOOLEAN,
				defaultValue: false,
				allowNull: false,
			},
			recoveryId: {
				type: DataTypes.UUID,
				defaultValue: DataTypes.UUIDV4,
				primaryKey: true,
				allowNull: false,
				unique: true,
			},
			recoveryMethod: {
				type: DataTypes.ENUM('email', 'backupCodes'),
				allowNull: true,
			},
			backupCodes: {
				type: DataTypes.ARRAY(DataTypes.STRING),
				allowNull: true,
			},
			recoveryLastUpdated: {
				type: DataTypes.DATE,
				defaultValue: DataTypes.NOW,
				allowNull: true,
			},
		},
		{
			sequelize,
			modelName: 'RecoveryMethod',
			timestamps: true,
		}
	);

	await RecoveryMethod.sync();
	return RecoveryMethod;
}

const RecoveryMethodModelPromise = initializeRecoveryMethodModel();
export default RecoveryMethodModelPromise;
