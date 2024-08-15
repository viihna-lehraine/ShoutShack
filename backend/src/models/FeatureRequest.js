import { DataTypes, Model, Sequelize } from 'sequelize';
import initializeDatabase from '../config/db.js';

class FeatureRequest extends Model {}

async function initializeFeatureRequestModel() {
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
				defaultValue: Sequelize.NOW,
				allowNull: false,
            },
            closedAt: {
                type: DataTypes.DATE,
                defaultValue: null,
            },
		},
		{
			sequelize,
			modelName: 'FeatureRequest',
			timestamps: true,
		}
	);
}

const FeatureRequestModelPromise = (async () => {
	await initializeFeatureRequestModel();
	return FeatureRequest;
})();

export default FeatureRequestModelPromise;
