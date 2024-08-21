import {
	DataTypes,
	Model,
	InferAttributes,
	InferCreationAttributes
} from 'sequelize';
import { getSequelizeInstance } from '../config/db';
import User from './User';

interface FailedLoginAttemptsAttributes {
	attemptId: string;
	id: string;
	ipAddress: string;
	userAgent: string;
	attemptDate: Date;
	isLocked: boolean;
}

class FailedLoginAttempts
	extends Model<
		InferAttributes<FailedLoginAttempts>,
		InferCreationAttributes<FailedLoginAttempts>
	>
	implements FailedLoginAttemptsAttributes
{
	attemptId!: string;
	id!: string;
	ipAddress!: string;
	userAgent!: string;
	attemptDate!: Date;
	isLocked!: boolean;
}

// Initialize the FailedLoginAttempt model
const sequelize = getSequelizeInstance(); // Get the Sequelize instance

FailedLoginAttempts.init(
	{
		attemptId: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
			allowNull: true,
			unique: true
		},
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			allowNull: false,
			unique: true,
			references: {
				model: User,
				key: 'id'
			}
		},
		ipAddress: {
			type: DataTypes.STRING,
			allowNull: false
		},
		userAgent: {
			type: DataTypes.STRING,
			allowNull: false
		},
		attemptDate: {
			type: DataTypes.DATE,
			defaultValue: DataTypes.NOW,
			allowNull: false
		},
		isLocked: {
			type: DataTypes.BOOLEAN,
			defaultValue: false
		}
	},
	{
		sequelize,
		modelName: 'FailedLoginAttempts',
		timestamps: true
	}
);

export default FailedLoginAttempts;
