import {
	CreationOptional,
	DataTypes,
	InferAttributes,
	InferCreationAttributes,
	Model,
	Sequelize
} from 'sequelize';
import { Logger } from '../config/logger';
import { validateDependencies } from '../utils/validateDependencies';
import { processError } from '../utils/processError';
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
		processError(error, logger || console);
		throw error;
	}
}

export { DataShareOptions };
