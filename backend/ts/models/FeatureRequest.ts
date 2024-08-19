import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import initializeDatabase from '../config/db.js';

interface FeatureRequestAttributes {
	userId: string;
	email?: string | null;
	requestNumber: number;
	requestType: string;
	requestContent: string;
	agreedToFollowUpContact: boolean;
	createdAt: Date;
	closedAt?: Date | null;
}

class FeatureRequest extends Model<InferAttributes<FeatureRequest>, InferCreationAttributes<FeatureRequest>> implements FeatureRequestAttributes {
	userId!: string;
	email!: string | null;
	requestNumber!: number;
	requestType!: string;
	requestContent!: string;
	agreedToFollowUpContact!: boolean;
	createdAt!: CreationOptional<Date>;
	closedAt!: Date | null;
}

async function initializeFeatureRequestModel(): Promise<typeof FeatureRequest> {
	const sequelize = await initializeDatabase();

	FeatureRequest.init(
		{
			userId: {
				type: DataTypes.UUID,
				allowNull: false,
			},
			email: {
				type: DataTypes.STRING,
				allowNull: true,
				defaultValue: null,
			},
			requestNumber: {
				type: DataTypes.INTEGER,
				allowNull: false,
				unique: true,
			},
			requestType: {
				type: DataTypes.TEXT,
				allowNull: false,
				defaultValue: null,
			},
			requestContent: {
				type: DataTypes.TEXT,
				allowNull: false,
				defaultValue: null,
			},
			agreedToFollowUpContact: {
				type: DataTypes.BOOLEAN,
				allowNull: false,
				defaultValue: false,
			},
			createdAt: {
				type: DataTypes.DATE,
				defaultValue: DataTypes.NOW,
				allowNull: false,
			},
			closedAt: {
				type: DataTypes.DATE,
				allowNull: true,
				defaultValue: null,
			},
		},
		{
			sequelize,
			modelName: 'FeatureRequest',
			timestamps: true,
		}
	);

	await FeatureRequest.sync();
	return FeatureRequest;
}

// Export the initialized model
const FeatureRequestModelPromise = initializeFeatureRequestModel();
export default FeatureRequestModelPromise;
