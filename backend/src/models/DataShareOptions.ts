import {
	CreationOptional,
	DataTypes,
	InferAttributes,
	InferCreationAttributes,
	Model,
	Sequelize
} from 'sequelize';
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
	sequelize: Sequelize
): typeof DataShareOptions {
	DataShareOptions.init(
		{
			id: {
				type: DataTypes.UUID,
				defaultValue: DataTypes.UUIDV4,
				primaryKey: true, // primary key for the data share options record
				allowNull: false, // user ID is required as it references the User model
				unique: true, // ensure uniqueness of the data share options record
				references: {
					model: User,
					key: 'id'
				}
			},
			trackingPixelOption: {
				type: DataTypes.BOOLEAN,
				allowNull: false, // tracking pixel option is required
				defaultValue: false // default to false
			},
			featureUsageOption: {
				type: DataTypes.BOOLEAN,
				allowNull: false, // feature usage option is required
				defaultValue: false // default to false
			},
			pageViewsOption: {
				type: DataTypes.BOOLEAN,
				allowNull: false, // page views option is required
				defaultValue: false // default to false
			},
			interactionDataOption: {
				type: DataTypes.BOOLEAN,
				allowNull: false, // interaction data option is required
				defaultValue: false // default to false
			},
			deviceTypeOption: {
				type: DataTypes.BOOLEAN,
				allowNull: false, // device type option is required
				defaultValue: false // default to false
			},
			browserInfoOption: {
				type: DataTypes.BOOLEAN,
				allowNull: false, // browser info option is required
				defaultValue: false // default to false
			},
			operatingSystemOption: {
				type: DataTypes.BOOLEAN,
				allowNull: false, // operating system option is required
				defaultValue: false // default to false
			},
			randomAnonSurveyOption: {
				type: DataTypes.BOOLEAN,
				allowNull: false, // random anon survey option is required
				defaultValue: false // default to false
			},
			lastUpdated: {
				type: DataTypes.DATE,
				defaultValue: DataTypes.NOW, // default to current date/time
				allowNull: false // last updated date is required
			}
		},
		{
			sequelize,
			modelName: 'DataShareOptions',
			timestamps: true // automatically manage createdAt and updatedAt fields
		}
	);

	return DataShareOptions;
}
