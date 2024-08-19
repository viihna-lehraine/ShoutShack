import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import initializeDatabase from '../config/db.js';

interface RecoveryMethodAttributes {
	recoveryId: string;
	userId: string;
	methodType: 'email' | 'phone' | 'backupCodes';
	contactDetail?: string | null;
	backupCodes?: string[] | null;
	isActive: boolean;
	createdAt: Date;
	updatedAt: Date;
}

class RecoveryMethod extends Model<InferAttributes<RecoveryMethod>, InferCreationAttributes<RecoveryMethod>> implements RecoveryMethodAttributes {
	recoveryId!: string;
	userId!: string;
	methodType!: 'email' | 'phone' | 'backupCodes';
	contactDetail!: string | null;
	backupCodes!: string[] | null;
	isActive!: boolean;
	createdAt!: CreationOptional<Date>;
	updatedAt!: CreationOptional<Date>;
}

async function initializeRecoveryMethodModel(): Promise<typeof RecoveryMethod> {
	const sequelize = await initializeDatabase();

	RecoveryMethod.init(
		{
			recoveryId: {
				type: DataTypes.UUID,
				defaultValue: DataTypes.UUIDV4,
				primaryKey: true,
				allowNull: false,
				unique: true,
			},
			userId: {
				type: DataTypes.UUID,
				allowNull: false,
			},
			methodType: {
				type: DataTypes.ENUM('email', 'phone', 'backupCodes'),
				allowNull: false,
			},
			contactDetail: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			backupCodes: {
				type: DataTypes.ARRAY(DataTypes.STRING),
				allowNull: true,
			},
			isActive: {
				type: DataTypes.BOOLEAN,
				defaultValue: true,
				allowNull: false,
			},
			createdAt: {
				type: DataTypes.DATE,
				defaultValue: DataTypes.NOW,
				allowNull: false,
			},
			updatedAt: {
				type: DataTypes.DATE,
				defaultValue: DataTypes.NOW,
				allowNull: false,
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
