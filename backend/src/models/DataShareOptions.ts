import {
	CreationOptional,
	DataTypes,
	InferAttributes,
	InferCreationAttributes,
	Model,
	Sequelize
} from 'sequelize';

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
				type: DataTypes.STRING,
				allowNull: false,
				primaryKey: true
			},
			trackingPixelOption: {
				type: DataTypes.BOOLEAN,
				allowNull: false
			},
			featureUsageOption: {
				type: DataTypes.BOOLEAN,
				allowNull: false
			},
			pageViewsOption: {
				type: DataTypes.BOOLEAN,
				allowNull: false
			},
			interactionDataOption: {
				type: DataTypes.BOOLEAN,
				allowNull: false
			},
			deviceTypeOption: {
				type: DataTypes.BOOLEAN,
				allowNull: false
			},
			browserInfoOption: {
				type: DataTypes.BOOLEAN,
				allowNull: false
			},
			operatingSystemOption: {
				type: DataTypes.BOOLEAN,
				allowNull: false
			},
			randomAnonSurveyOption: {
				type: DataTypes.BOOLEAN,
				allowNull: false
			},
			lastUpdated: {
				type: DataTypes.DATE,
				allowNull: true,
				defaultValue: DataTypes.NOW
			}
		},
		{
			sequelize,
			tableName: 'DataShareOptions',
			timestamps: false
		}
	);

	return DataShareOptions;
}
