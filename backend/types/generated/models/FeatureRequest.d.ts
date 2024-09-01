import { Model, InferAttributes, InferCreationAttributes, CreationOptional, Sequelize } from 'sequelize';
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
declare class FeatureRequest extends Model<InferAttributes<FeatureRequest>, InferCreationAttributes<FeatureRequest>> implements FeatureRequestAttributes {
    featureRequestNumber: number;
    id: string;
    email: string | null;
    featureRequestType: string;
    featureRequestContent: string;
    canFollowUpFeatureRequest: boolean;
    featureRequestOpenDate: CreationOptional<Date>;
    featureRequestCloseDate: Date | null;
}
export default function createFeatureRequestModel(sequelize: Sequelize): typeof FeatureRequest;
export {};
//# sourceMappingURL=FeatureRequest.d.ts.map