import {
	Model,
	InferAttributes,
	InferCreationAttributes,
	DataTypes,
	Sequelize
} from 'sequelize';
import { User } from './User';
import { Logger } from '../config/logger';
import { validateDependencies } from '../utils/validateDependencies';
import { processError } from '../utils/processError';

interface FailedLoginAttemptsAttributes {
	attemptId: string; // primary key for the failed login attempt record
	id: string; // foreign key referencing the User model
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
	public attemptId!: string;
	public id!: string;
	public ipAddress!: string;
	public userAgent!: string;
	public attemptDate!: Date;
	public isLocked!: boolean;
}

export default function createFailedLoginAttemptsModel(
	sequelize: Sequelize,
	logger: Logger
): typeof FailedLoginAttempts {
	try {
		validateDependencies(
			[
				{ name: 'sequelize', instance: sequelize },
				{ name: 'logger', instance: logger },
				{ name: 'UserModel', instance: User }
			],
			logger || console
		);

		FailedLoginAttempts.init(
			{
				attemptId: {
					type: DataTypes.UUID,
					defaultValue: DataTypes.UUIDV4,
					primaryKey: true,
					allowNull: false,
					unique: true
				},
				id: {
					type: DataTypes.UUID,
					defaultValue: DataTypes.UUIDV4,
					allowNull: false,
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

		logger.info('FailedLoginAttempts model initialized successfully');
		return FailedLoginAttempts;
	} catch (error) {
		processError(error, logger || console);
		throw error;
	}
}

export { FailedLoginAttempts };
