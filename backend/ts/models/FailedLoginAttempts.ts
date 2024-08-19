import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import initializeDatabase from '../config/db.js';

interface FailedLoginAttemptsAttributes {
	id: string;
	attemptId: string;
	ipAddress: string;
	userAgent: string;
	attemptDate: Date;
	isLocked: boolean;
}

class FailedLoginAttempts extends Model<InferAttributes<FailedLoginAttempts>, InferCreationAttributes<FailedLoginAttempts>> implements FailedLoginAttemptsAttributes {
	id!: string;
	attemptId!: string;
	ipAddress!: string;
	userAgent!: string;
	attemptDate!: Date;
	isLocked!: boolean;
}

// Initialize the FailedLoginAttempt model
async function initializeFailedLoginAttemptsModel(): Promise<typeof FailedLoginAttempts> {
	const sequelize = await initializeDatabase();

	FailedLoginAttempts.init(
		{
			id: {
				type: DataTypes.UUID,
				defaultValue: DataTypes.UUIDV4,
				primaryKey: true,
				allowNull: false,
				unique: true,
			},
			attemptId: {
				type: DataTypes.INTEGER,
				autoIncrement: true, 
				allowNull: true,
				unique: true,
			},
			ipAddress: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			userAgent: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			attemptDate: {
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
			timestamps: true,
		}
	);

	await FailedLoginAttempts.sync();
	return FailedLoginAttempts;
}

// Export the initialized model
const FailedLoginAttemptsModelPromise = initializeFailedLoginAttemptsModel();
export default FailedLoginAttemptsModelPromise;
