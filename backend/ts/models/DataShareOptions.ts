import {
	DataTypes,
	Model,
	InferAttributes,
	InferCreationAttributes,
	CreationOptional
} from 'sequelize';
import { getSequelizeInstance } from '../config/db';
import User from './User';

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

// Initialize the DataShareOptions model
const sequelize = getSequelizeInstance();

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
			allowNull: true
		}
	},
	{
		sequelize,
		modelName: 'DataShareOptions',
		timestamps: true
	}
);

export default DataShareOptions;
