import { InferAttributes, InferCreationAttributes, Model, CreationOptional } from 'sequelize';
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
declare class FeatureRequest extends Model<InferAttributes<FeatureRequest>, InferCreationAttributes<FeatureRequest>> implements FeatureRequestAttributes {
    id: string;
    email: string | null;
    featureRequestNumber: number;
    featureRequestType: string;
    featureRequestContent: string;
    canFollowUpFeatureRequest: boolean;
    featureRequestOpenDate: CreationOptional<Date>;
    featureRequestCloseDate: Date | null;
}
declare const FeatureRequestModelPromise: Promise<typeof FeatureRequest>;
export default FeatureRequestModelPromise;
//# sourceMappingURL=FeatureRequest.d.ts.map