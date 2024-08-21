import {
	DataTypes,
	InferAttributes,
	InferCreationAttributes,
	Model,
	CreationOptional
} from 'sequelize';
import { getSequelizeInstance } from '../config/db';
import User from './User';

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
	featureRequestNumber!: number;
	id!: string;
	email!: string | null;
	featureRequestType!: string;
	featureRequestContent!: string;
	canFollowUpFeatureRequest!: boolean;
	featureRequestOpenDate!: CreationOptional<Date>;
	featureRequestCloseDate!: Date | null;
}

// Get the Sequelize instance
const sequelize = getSequelizeInstance();

// Initialize the FeatureRequest model
FeatureRequest.init(
	{
		featureRequestNumber: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
			allowNull: true,
			unique: true
		},
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			allowNull: false,
			unique: true,
			references: {
				model: User,
				key: 'id'
			}
		},
		email: {
			type: DataTypes.STRING,
			allowNull: true,
			defaultValue: null
		},
		featureRequestType: {
			type: DataTypes.TEXT,
			allowNull: false,
			defaultValue: null
		},
		featureRequestContent: {
			type: DataTypes.TEXT,
			allowNull: false,
			defaultValue: null
		},
		canFollowUpFeatureRequest: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false
		},
		featureRequestOpenDate: {
			type: DataTypes.DATE,
			defaultValue: DataTypes.NOW,
			allowNull: false
		},
		featureRequestCloseDate: {
			type: DataTypes.DATE,
			allowNull: true,
			defaultValue: null
		}
	},
	{
		sequelize,
		modelName: 'FeatureRequest',
		timestamps: true
	}
);

export default FeatureRequest;
