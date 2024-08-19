import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import initializeDatabase from '../config/db.js';

interface FailedLoginAttemptsAttributes {
	attemptId: string;
	userId: string;
	ipAddress: string;
	userAgent: string;
	attemptedAt: Date;
	isLocked: boolean;
}

class FailedLoginAttempts extends Model<InferAttributes<FailedLoginAttempts>, InferCreationAttributes<FailedLoginAttempts>> implements FailedLoginAttemptsAttributes {
	attemptId!: string;
	userId!: string;
	ipAddress!: string;
	userAgent!: string;
	attemptedAt!: CreationOptional<Date>;
	isLocked!: boolean;
}

// Initialize the FailedLoginAttempt model
async function initializeFailedLoginAttemptsModel(): Promise<typeof FailedLoginAttempts> {
	const sequelize = await initializeDatabase();

	FailedLoginAttempts.init(
		{
			attemptId: {
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
			ipAddress: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			userAgent: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			attemptedAt: {
				type: DataTypes.DATE,
				defaultValue: DataTypes.NOW,
				allowNull: false,
			},
			isLocked: {
				type: DataTypes.BOOLEAN,
				defaultValue: false,
			},
		},
		{
			sequelize,
			modelName: 'FailedLoginAttempts',
			timestamps: false,
		}
	);

	await FailedLoginAttempts.sync();
	return FailedLoginAttempts;
}

// Export the initialized model
const FailedLoginAttemptsModelPromise = initializeFailedLoginAttemptsModel();
export default FailedLoginAttemptsModelPromise;
