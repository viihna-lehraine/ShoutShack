import {
	CreationOptional,
	DataTypes,
	InferAttributes,
	InferCreationAttributes,
	Model
} from 'sequelize';
import { ServiceFactory } from '../index/factory';
import { ErrorLogAttributes } from '../index/interfaces/models';

export class ErrorLog
	extends Model<InferAttributes<ErrorLog>, InferCreationAttributes<ErrorLog>>
	implements ErrorLogAttributes
{
	public id!: CreationOptional<number>;
	public name!: string;
	public message!: string;
	public statusCode!: number | null;
	public severity!: string;
	public errorCode!: string | null;
	public details!: string | Record<string, unknown> | null;
	public timestamp!: CreationOptional<Date>;
	public count!: number;
}

export async function createErrorLogModel(): Promise<typeof ErrorLog | null> {
	const logger = await ServiceFactory.getLoggerService();
	const errorLogger = await ServiceFactory.getErrorLoggerService();
	const errorHandler = await ServiceFactory.getErrorHandlerService();

	try {
		const databaseController = await ServiceFactory.getDatabaseController();
		const sequelize = databaseController.getSequelizeInstance();

		if (!sequelize) {
			const databaseError =
				new errorHandler.ErrorClasses.DatabaseErrorRecoverable(
					'Failed to initialize ErrorLog model: Sequelize instance not found',
					{ exposeToClient: false }
				);
			errorLogger.logError(databaseError.message);
			errorHandler.handleError({ error: databaseError });
			return null;
		}

		ErrorLog.init(
			{
				id: {
					type: DataTypes.INTEGER,
					autoIncrement: true,
					primaryKey: true,
					unique: true
				},
				name: {
					type: DataTypes.STRING,
					allowNull: false
				},
				message: {
					type: DataTypes.TEXT,
					allowNull: false
				},
				statusCode: {
					type: DataTypes.INTEGER,
					allowNull: true
				},
				severity: {
					type: DataTypes.STRING,
					allowNull: false,
					validate: {
						isIn: [['info', 'recoverable', 'warning', 'fatal']]
					}
				},
				errorCode: {
					type: DataTypes.STRING,
					allowNull: true
				},
				details: {
					type: DataTypes.JSONB,
					allowNull: true
				},
				timestamp: {
					type: DataTypes.DATE,
					allowNull: false,
					defaultValue: DataTypes.NOW
				},
				count: {
					type: DataTypes.INTEGER,
					allowNull: false,
					defaultValue: 0
				}
			},
			{
				sequelize,
				modelName: 'ErrorLog',
				tableName: 'error_logs',
				timestamps: false
			}
		);

		logger.info('ErrorLog model initialized successfully');
		return ErrorLog;
	} catch (loadModelError) {
		const loadErrorLogModelError =
			new errorHandler.ErrorClasses.DatabaseErrorRecoverable(
				`Failed to initialize ErrorLog model: ${loadModelError instanceof Error ? loadModelError.message : 'Unknown error'}`,
				{
					exposeToClient: false
				}
			);
		errorLogger.logError(loadErrorLogModelError.message);
		errorHandler.handleError({ error: loadErrorLogModelError });
		return null;
	}
}
