import { CreationOptional, InferAttributes, InferCreationAttributes, Model, Sequelize } from 'sequelize';
import { Logger } from '../config/logger';
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
export default function createDataShareOptionsModel(sequelize: Sequelize, logger: Logger): typeof DataShareOptions;
export { DataShareOptions };
//# sourceMappingURL=DataShareOptions.d.ts.map