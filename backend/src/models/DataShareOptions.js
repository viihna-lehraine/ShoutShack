import { DataTypes, Model, Sequelize } from 'sequelize';
import { initializeDatabase } from '../index.js';

class DataShareOptions extends Model {}

async function initializeDataShareOptionsModel() {
	const sequelize = await initializeDatabase();

	DataShareOptions.init(
		{
			trackingPixelOption: {
				type: DataTypes.BOOLEAN,
				allowNull: false,
				defaultValue: false,
			},
			featureUsageOption: {
				type: DataTypes.BOOLEAN,
				allowNull: false,
				defaultValue: false,
			},
            pageViewsOption: {
                type: DataTypes.BOOLEAN,
				allowNull: false,
				defaultValue: false,
            },
            interactionDataOption: {
                type: DataTypes.BOOLEAN,
				allowNull: false,
				defaultValue: false,
            },
            deviceTypeOption: {
                type: DataTypes.BOOLEAN,
				allowNull: false,
				defaultValue: false,
            },
            browserInfoOption: {
                type: DataTypes.BOOLEAN,
				allowNull: false,
				defaultValue: false,
            },
            operatingSystemOption: {
                type: DataTypes.BOOLEAN,
				allowNull: false,
				defaultValue: false,
            },
            randomAnonSurveyOption: {
                type: DataTypes.BOOLEAN,
				allowNull: false,
				defaultValue: false,
            },
			lastUpdated: {
                type: DataTypes.DATE,
				defaultValue: Sequelize.NOW,
				allowNull: true,
            }
		},
		{
			sequelize,
			modelName: 'DataShareOptions',
			timestamps: false,
		}
	);
}

const DataShareOptionsModelPromise = (async () => {
	await initializeDataShareOptionsModel();
	return DataShareOptions;
})();

export default DataShareOptionsModelPromise;
