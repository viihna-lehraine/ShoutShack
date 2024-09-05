import {
	Model,
	InferAttributes,
	InferCreationAttributes,
	CreationOptional,
	DataTypes,
	Sequelize
} from 'sequelize';
import { validateDependencies } from '../utils/validateDependencies';
import { processError } from '../utils/processError';
import { Logger } from '../config/logger';

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
	sequelize: Sequelize,
	logger: Logger
): typeof FeatureRequest {
	try {
		validateDependencies(
			[
				{ name: 'sequelize', instance: sequelize },
				{ name: 'logger', instance: logger }
			],
			logger || console
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
	} catch (error) {
		processError(error, logger || console);
		throw error;
	}
}

export { FeatureRequest };
