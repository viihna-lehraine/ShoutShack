import {
	CreationOptional,
	InferAttributes,
	InferCreationAttributes,
	Model
} from 'sequelize';

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

class FeatureRequest
	extends Model<
		InferAttributes<FeatureRequest>,
		InferCreationAttributes<FeatureRequest>
	>
	implements FeatureRequestAttributes
{
	featureRequestNumber!: number;
	id!: string;
	email!: string | null;
	featureRequestType!: string;
	featureRequestContent!: string;
	canFollowUpFeatureRequest!: boolean;
	featureRequestOpenDate!: CreationOptional<Date>;
	featureRequestCloseDate!: Date | null;
}

export default FeatureRequest;
