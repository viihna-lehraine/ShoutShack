import {
	DataTypes,
	Model,
	InferAttributes,
	InferCreationAttributes,
	CreationOptional,
	Sequelize
} from 'sequelize';
import { configService } from '../services/configService';
import { errorHandler } from '../services/errorHandler';
import { validateDependencies } from '../utils/helpers';

interface FeatureRequestAttributes {
	featureRequestNumber: number;
	id: string;
	email?: string | null;
	featureRequestType: string;
	featureRequestContent: string;
	canFollowUpFeatureRequest: boolean;
	featureRequestOpenDate: Date;
	featureRequestCloseDate?: Date | null;
}

class FeatureRequest
	extends Model<
		InferAttributes<FeatureRequest>,
		InferCreationAttributes<FeatureRequest>
	>
	implements FeatureRequestAttributes
{
	public featureRequestNumber!: number;
	public id!: string;
	public email!: string | null;
	public featureRequestType!: string;
	public featureRequestContent!: string;
	public canFollowUpFeatureRequest!: boolean;
	public featureRequestOpenDate!: CreationOptional<Date>;
	public featureRequestCloseDate!: Date | null;
}

export default function createFeatureRequestModel(
	sequelize: Sequelize
): typeof FeatureRequest | null {
	const logger = configService.getAppLogger();
	const errorLogger = configService.getErrorLogger();

	try {
		validateDependencies(
			[{ name: 'sequelize', instance: sequelize }],
			logger
		);

		FeatureRequest.init(
			{
				featureRequestNumber: {
					type: DataTypes.INTEGER,
					allowNull: false,
					primaryKey: true,
					autoIncrement: true
				},
				id: {
					type: DataTypes.STRING,
					allowNull: true
				},
				email: {
					type: DataTypes.STRING,
					allowNull: true
				},
				featureRequestType: {
					type: DataTypes.STRING,
					allowNull: false
				},
				featureRequestContent: {
					type: DataTypes.TEXT,
					allowNull: false
				},
				canFollowUpFeatureRequest: {
					type: DataTypes.BOOLEAN,
					allowNull: false
				},
				featureRequestOpenDate: {
					type: DataTypes.DATE,
					allowNull: false,
					defaultValue: DataTypes.NOW
				},
				featureRequestCloseDate: {
					type: DataTypes.DATE,
					allowNull: true
				}
			},
			{
				sequelize,
				tableName: 'FeatureRequests',
				timestamps: true
			}
		);

		logger.info('FeatureRequest model initialized successfully');
		return FeatureRequest;
	} catch (dbError) {
		const databaseError =
			new errorHandler.ErrorClasses.DatabaseErrorRecoverable(
				`Failed to initialize FeatureRequest model: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`,
				{
					exposeToClient: false
				}
			);
		errorLogger.logInfo(databaseError.message);
		errorHandler.handleError({ error: databaseError });
		return null;
	}
}

export { FeatureRequest };
