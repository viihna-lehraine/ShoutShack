import { CreationOptional, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import { DataShareOptionsAttributes } from '../index/interfaces/models';
export declare class DataShareOptions extends Model<InferAttributes<DataShareOptions>, InferCreationAttributes<DataShareOptions>> implements DataShareOptionsAttributes {
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
export declare function createDataShareOptionsModel(): Promise<typeof DataShareOptions | null>;
//# sourceMappingURL=DataShareOptions.d.ts.map