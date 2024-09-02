import {
	Model,
	InferAttributes,
	InferCreationAttributes,
	CreationOptional,
	DataTypes,
	Sequelize
} from 'sequelize';
import { User } from './User';

interface FeatureRequestAttributes {
	featureRequestNumber: number; // primary key, auto-incremented
	id: string; // foreign key referencing a user (if applicable)
	email?: string | null; // optional email of the user submitting the request
	featureRequestType: string; // type of feature request
	featureRequestContent: string; // detailed content of the feature request
	canFollowUpFeatureRequest: boolean; // indicates if follow-up is allowed
	featureRequestOpenDate: Date; // date when the request was opened
	featureRequestCloseDate?: Date | null; // optional date when the request was closed
}

class FeatureRequest
	extends Model<
		InferAttributes<FeatureRequest>,
		InferCreationAttributes<FeatureRequest>
	>
	implements FeatureRequestAttributes
{
	featureRequestNumber!: number; // initialized as a non-nullable number, auto-incremented
	id!: string; // initialized as a non-nullable string (UUID)
	email!: string | null; // initialized as a nullable string
	featureRequestType!: string; // initialized as a non-nullable string
	featureRequestContent!: string; // initialized as a non-nullable string
	canFollowUpFeatureRequest!: boolean; // initialized as a non-nullable boolean
	featureRequestOpenDate!: CreationOptional<Date>; // initialized as a non-nullable date
	featureRequestCloseDate!: Date | null; // initialized as a nullable date
}

export default function createFeatureRequestModel(
	sequelize: Sequelize
): typeof FeatureRequest {
	FeatureRequest.init(
		{
			featureRequestNumber: {
				type: DataTypes.INTEGER,
				allowNull: false, // feature request number is required
				primaryKey: true, // primary key for the feature request record
				autoIncrement: true // auto-increment for unique feature requests
			},
			id: {
				type: DataTypes.STRING,
				allowNull: false // foreign key rom the user table, should not be null
			},
			email: {
				type: DataTypes.STRING,
				allowNull: true // email is optional
			},
			featureRequestType: {
				type: DataTypes.STRING,
				allowNull: false // feature request type is required
			},
			featureRequestContent: {
				type: DataTypes.TEXT,
				allowNull: false // detailed content of the feature request is required
			},
			canFollowUpFeatureRequest: {
				type: DataTypes.BOOLEAN,
				allowNull: false // whether follow-up is allowed must be explicitly defined by user
			},
			featureRequestOpenDate: {
				type: DataTypes.DATE,
				allowNull: false,
				defaultValue: DataTypes.NOW // defaults to current date/time
			},
			featureRequestCloseDate: {
				type: DataTypes.DATE,
				allowNull: true // close date for the feature request is optional, but should be set to true if closed
			}
		},
		{
			sequelize,
			tableName: 'FeatureRequests',
			timestamps: true // automatically include createdAt and updatedAt timestamps
		}
	);

	// define associations
	FeatureRequest.belongsTo(User, {
		foreignKey: 'id',
		as: 'user',
		onDelete: 'CASCADE'
	});

	return FeatureRequest;
}
