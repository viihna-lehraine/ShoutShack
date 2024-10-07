import {
	CreationOptional,
	DataTypes,
	InferAttributes,
	InferCreationAttributes,
	Model
} from 'sequelize';
import { User } from './User';
import { ServiceFactory } from '../index/factory/ServiceFactory';
import { DataShareOptionsAttributes } from '../index/interfaces/models';

export class DataShareOptions
	extends Model<
		InferAttributes<DataShareOptions>,
		InferCreationAttributes<DataShareOptions>
	>
	implements DataShareOptionsAttributes
{
	public id!: string;
	public trackingPixelOption!: boolean;
	public featureUsageOption!: boolean;
	public pageViewsOption!: boolean;
	public interactionDataOption!: boolean;
	public deviceTypeOption!: boolean;
	public browserInfoOption!: boolean;
	public operatingSystemOption!: boolean;
	public randomAnonSurveyOption!: boolean;
	public lastUpdated!: CreationOptional<Date>;
}

export async function createDataShareOptionsModel(): Promise<
	typeof DataShareOptions | null
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
					'Failed to initialize DataShareOptions model: Sequelize instance not found',
					{ exposeToClient: false }
				);
			errorLogger.logError(databaseError.message);
			errorHandler.handleError({ error: databaseError });
			return null;
		}

		DataShareOptions.init(
			{
				id: {
					type: DataTypes.UUID,
					defaultValue: DataTypes.UUIDV4,
					primaryKey: true,
					allowNull: false,
					unique: true,
					references: {
						model: User,
						key: 'id'
					}
				},
				trackingPixelOption: {
					type: DataTypes.BOOLEAN,
					allowNull: false,
					defaultValue: false
				},
				featureUsageOption: {
					type: DataTypes.BOOLEAN,
					allowNull: false,
					defaultValue: false
				},
				pageViewsOption: {
					type: DataTypes.BOOLEAN,
					allowNull: false,
					defaultValue: false
				},
				interactionDataOption: {
					type: DataTypes.BOOLEAN,
					allowNull: false,
					defaultValue: false
				},
				deviceTypeOption: {
					type: DataTypes.BOOLEAN,
					allowNull: false,
					defaultValue: false
				},
				browserInfoOption: {
					type: DataTypes.BOOLEAN,
					allowNull: false,
					defaultValue: false
				},
				operatingSystemOption: {
					type: DataTypes.BOOLEAN,
					allowNull: false,
					defaultValue: false
				},
				randomAnonSurveyOption: {
					type: DataTypes.BOOLEAN,
					allowNull: false,
					defaultValue: false
				},
				lastUpdated: {
					type: DataTypes.DATE,
					defaultValue: DataTypes.NOW,
					allowNull: false
				}
			},
			{
				sequelize,
				modelName: 'DataShareOptions',
				timestamps: true
			}
		);

		logger.info('DataShareOptions model initialized successfully');
		return DataShareOptions;
	} catch (dbError) {
		const databaseError =
			new errorHandler.ErrorClasses.DatabaseErrorRecoverable(
				`Failed to initialize DataShareOptions model: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`,
				{
					exposeToClient: false
				}
			);
		errorLogger.logError(databaseError.message);
		errorHandler.handleError({ error: databaseError });
		return null;
	}
}
