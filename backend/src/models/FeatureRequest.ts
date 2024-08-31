import {
	Model,
	InferAttributes,
	InferCreationAttributes,
	CreationOptional,
	DataTypes,
	Sequelize
} from 'sequelize';

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

export default function createFeatureRequestModel(
	sequelize: Sequelize
): typeof FeatureRequest {
	FeatureRequest.init(
		{
			featureRequestNumber: {
				type: DataTypes.INTEGER,
				allowNull: false,
				primaryKey: true,
				autoIncrement: true // Assuming this should be auto-incremented
			},
			id: {
				type: DataTypes.STRING,
				allowNull: false
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
			timestamps: false
		}
	);

	return FeatureRequest;
}
