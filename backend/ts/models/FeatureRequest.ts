import {
	DataTypes,
	InferAttributes,
	InferCreationAttributes,
	Model,
	CreationOptional
} from 'sequelize';
import initializeDatabase from '../config/db';
import UserModelPromise from './User';

interface FeatureRequestAttributes {
	id: string;
	email?: string | null;
	featureRequestNumber: number;
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
	id!: string;
	email!: string | null;
	featureRequestNumber!: number;
	featureRequestType!: string;
	featureRequestContent!: string;
	canFollowUpFeatureRequest!: boolean;
	featureRequestOpenDate!: CreationOptional<Date>;
	featureRequestCloseDate!: Date | null;
}

async function initializeFeatureRequestModel(): Promise<typeof FeatureRequest> {
	const sequelize = await initializeDatabase();

	FeatureRequest.init(
		{
			id: {
				type: DataTypes.UUID,
				defaultValue: DataTypes.UUIDV4,
				primaryKey: true,
				allowNull: false,
				unique: true,
				references: {
					model: await UserModelPromise,
					key: 'id'
				}
			},
			email: {
				type: DataTypes.STRING,
				allowNull: true,
				defaultValue: null
			},
			featureRequestNumber: {
				type: DataTypes.INTEGER,
				autoIncrement: true,
				allowNull: true,
				unique: true
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

	await FeatureRequest.sync();
	return FeatureRequest;
}

// Export the initialized model
const FeatureRequestModelPromise = initializeFeatureRequestModel();
export default FeatureRequestModelPromise;
