import {
	CreationOptional,
	DataTypes,
	InferAttributes,
	InferCreationAttributes,
	Model,
	Sequelize
} from 'sequelize';
import { Logger } from '../config/logger';
import {
	handleGeneralError,
	validateDependencies
} from '../middleware/errorHandler';
import { User } from './User';

interface DataShareOptionsAttributes {
	id: string;
	trackingPixelOption: boolean;
	featureUsageOption: boolean;
	pageViewsOption: boolean;
	interactionDataOption: boolean;
	deviceTypeOption: boolean;
	browserInfoOption: boolean;
	operatingSystemOption: boolean;
	randomAnonSurveyOption: boolean;
	lastUpdated: Date;
}

class DataShareOptions
	extends Model<
		InferAttributes<DataShareOptions>,
		InferCreationAttributes<DataShareOptions>
	>
	implements DataShareOptionsAttributes
{
	id!: string;
	trackingPixelOption!: boolean;
	featureUsageOption!: boolean;
	pageViewsOption!: boolean;
	interactionDataOption!: boolean;
	deviceTypeOption!: boolean;
	browserInfoOption!: boolean;
	operatingSystemOption!: boolean;
	randomAnonSurveyOption!: boolean;
	lastUpdated!: CreationOptional<Date>;
}

export default function createDataShareOptionsModel(
	sequelize: Sequelize,
	logger: Logger
): typeof DataShareOptions {
	try {
		validateDependencies(
			[
				{ name: 'sequelize', instance: sequelize },
				{ name: 'logger', instance: logger }
			],
			logger || console
		);

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
	} catch (error) {
		handleGeneralError(error, logger || console);
		throw error;
	}
}
