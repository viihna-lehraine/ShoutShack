import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import { initializeDatabase } from '../index.js';

interface DataShareOptionsAttributes {
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

class DataShareOptions extends Model<InferAttributes<DataShareOptions>, InferCreationAttributes<DataShareOptions>> implements DataShareOptionsAttributes {
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

async function initializeDataShareOptionsModel(): Promise<typeof DataShareOptions> {
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
                defaultValue: DataTypes.NOW,
                allowNull: true,
            },
        },
        {
            sequelize,
            modelName: 'DataShareOptions',
            timestamps: false,
        }
    );

    await DataShareOptions.sync();
    return DataShareOptions;
}

const DataShareOptionsModelPromise = initializeDataShareOptionsModel();
export default DataShareOptionsModelPromise;
