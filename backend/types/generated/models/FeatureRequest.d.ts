import { Model, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
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
export declare class FeatureRequest extends Model<InferAttributes<FeatureRequest>, InferCreationAttributes<FeatureRequest>> implements FeatureRequestAttributes {
    featureRequestNumber: number;
    id: string;
    email: string | null;
    featureRequestType: string;
    featureRequestContent: string;
    canFollowUpFeatureRequest: boolean;
    featureRequestOpenDate: CreationOptional<Date>;
    featureRequestCloseDate: Date | null;
}
export declare function createFeatureRequestModel(): Promise<typeof FeatureRequest | null>;
export {};
//# sourceMappingURL=FeatureRequest.d.ts.map