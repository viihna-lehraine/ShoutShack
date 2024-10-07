import {
	DataTypes,
	Model,
	InferAttributes,
	InferCreationAttributes
} from 'sequelize';
import { User } from './User';
import { ServiceFactory } from '../index/factory/ServiceFactory';
import { validateDependencies } from '../utils/helpers';
import { FailedLoginAttemptsAttributes } from '../index/interfaces/models';

export class FailedLoginAttempts
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

export async function createFailedLoginAttemptsModel(): Promise<
	typeof FailedLoginAttempts | null
> {
	const logger = await ServiceFactory.getLoggerService();
	const errorLogger = await ServiceFactory.getErrorLoggerService();
	const errorHandler = await ServiceFactory.getErrorHandlerService();

	try {
		const databaseController = await ServiceFactory.getDatabaseController();
		const sequelize = databaseController.getSequelizeInstance();

		if (!sequelize) {
			const databaseError =
				new errorHandler.ErrorClasses.DatabaseErrorRecoverable(
					'Failed to initialize FailedLoginAttempts model: Sequelize instance not found',
					{ exposeToClient: false }
				);
			errorLogger.logError(databaseError.message);
			errorHandler.handleError({ error: databaseError });
			return null;
		}

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
				{ exposeToClient: false }
			);
		errorLogger.logError(databaseError.message);
		errorHandler.handleError({ error: databaseError });
		return null;
	}
}
