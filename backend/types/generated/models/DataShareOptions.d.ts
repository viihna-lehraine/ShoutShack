import { CreationOptional, InferAttributes, InferCreationAttributes, Model, Sequelize } from 'sequelize';
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
declare class DataShareOptions extends Model<InferAttributes<DataShareOptions>, InferCreationAttributes<DataShareOptions>> implements DataShareOptionsAttributes {
    id: string;
    trackingPixelOption: boolean;
    featureUsageOption: boolean;
    pageViewsOption: boolean;
    interactionDataOption: boolean;
    deviceTypeOption: boolean;
    browserInfoOption: boolean;
    operatingSystemOption: boolean;
    randomAnonSurveyOption: boolean;
    lastUpdated: CreationOptional<Date>;
}
export default function createDataShareOptionsModel(sequelize: Sequelize): typeof DataShareOptions;
export {};
//# sourceMappingURL=DataShareOptions.d.ts.map