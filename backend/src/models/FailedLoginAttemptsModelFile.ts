import {
	DataTypes,
	Model,
	InferAttributes,
	InferCreationAttributes,
	Sequelize
} from 'sequelize';
import { User } from './UserModelFile';
import { configService } from '../services/configService';
import { errorHandler } from '../services/errorHandler';
import { validateDependencies } from '../utils/helpers';

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
	sequelize: Sequelize
): typeof FailedLoginAttempts | null {
	const logger = configService.getAppLogger();

	try {
		validateDependencies(
			[
				{ name: 'sequelize', instance: sequelize },
				{ name: 'UserModel', instance: User }
			],
			logger
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
	} catch (dbError) {
		const databaseError =
			new errorHandler.ErrorClasses.DatabaseErrorRecoverable(
				`Failed to initialize FailedLoginAttempts model: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`,
				{
					exposeToClient: false
				}
			);
		configService.getErrorLogger().logInfo(databaseError.message);
		errorHandler.handleError({ error: databaseError });
		return null;
	}
}

export { FailedLoginAttempts };
