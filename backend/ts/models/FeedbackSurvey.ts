import {
	DataTypes,
	Model,
	InferAttributes,
	InferCreationAttributes,
	CreationOptional
} from 'sequelize';
import { getSequelizeInstance } from '../config/db';

interface FeedbackSurveyAttributes {
	surveyId: string;
	questionGeneralApproval?: number | null;
	questionServiceQuality?: number | null;
	questionEaseOfUse?: number | null;
	questionUserSupport?: number | null;
	questionHelpGuides?: number | null;
	questionIsPremiumUser?: boolean | null;
	questionPremiumValue?: number | null;
	questionLikelihoodToRecommend?: number | null;
	questionUsefulFeaturesAndAspects?: object | null;
	questionFeaturesThatNeedImprovement?: object | null;
	questionOpenEndedLikeTheMost?: string | null;
	questionOpenEndedWhatCanWeImprove?: string | null;
	questionDemoHeardAboutUs?: number | null;
	questionDemoAgeGroup?: number | null;
	questionDemoGender?: string | null;
	questionDemoRegion?: string | null;
	questionDemoLangPref?: string | null;
	questionFinalThoughts?: string | null;
	hasOptedInForFollowUp?: boolean | null;
	email?: string | null;
	surveyDate: Date;
}

class FeedbackSurvey
	extends Model<
		InferAttributes<FeedbackSurvey>,
		InferCreationAttributes<FeedbackSurvey>
	>
	implements FeedbackSurveyAttributes
{
	surveyId!: string;
	questionGeneralApproval?: number | null;
	questionServiceQuality?: number | null;
	questionEaseOfUse?: number | null;
	questionUserSupport?: number | null;
	questionHelpGuides?: number | null;
	questionIsPremiumUser?: boolean | null;
	questionPremiumValue?: number | null;
	questionLikelihoodToRecommend?: number | null;
	questionUsefulFeaturesAndAspects?: object | null;
	questionFeaturesThatNeedImprovement?: object | null;
	questionOpenEndedLikeTheMost?: string | null;
	questionOpenEndedWhatCanWeImprove?: string | null;
	questionDemoHeardAboutUs?: number | null;
	questionDemoAgeGroup?: number | null;
	questionDemoGender?: string | null;
	questionDemoRegion?: string | null;
	questionDemoLangPref?: string | null;
	questionFinalThoughts?: string | null;
	hasOptedInForFollowUp?: boolean | null;
	email?: string | null;
	surveyDate!: Date;
}

// Get the Sequelize instance
const sequelize = getSequelizeInstance();

// Initialize the FeedbackSurvey model
FeedbackSurvey.init(
	{
		surveyId: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
			allowNull: false,
			unique: true
		},
		questionGeneralApproval: {
			type: DataTypes.INTEGER,
			allowNull: true,
			validate: {
				min: 1,
				max: 5
			}
		},
		questionServiceQuality: {
			type: DataTypes.INTEGER,
			allowNull: true,
			validate: {
				min: 1,
				max: 5
			}
		},
		questionEaseOfUse: {
			type: DataTypes.INTEGER,
			allowNull: true,
			validate: {
				min: 1,
				max: 5
			}
		},
		questionUserSupport: {
			type: DataTypes.INTEGER,
			allowNull: true,
			validate: {
				min: 0, // allows for N/A
				max: 5
			}
		},
		questionHelpGuides: {
			type: DataTypes.INTEGER,
			allowNull: true,
			validate: {
				min: 0, // allows for N/A
				max: 5
			}
		},
		questionIsPremiumUser: {
			type: DataTypes.BOOLEAN,
			allowNull: true
		},
		questionPremiumValue: {
			type: DataTypes.INTEGER,
			allowNull: true,
			validate: {
				min: 0,
				max: 5
			}
		},
		questionLikelihoodToRecommend: {
			type: DataTypes.INTEGER,
			allowNull: true,
			validate: {
				min: 1,
				max: 5
			}
		},
		questionUsefulFeaturesAndAspects: {
			type: DataTypes.JSON,
			allowNull: true,
			defaultValue: []
		},
		questionFeaturesThatNeedImprovement: {
			type: DataTypes.JSON,
			allowNull: true,
			defaultValue: []
		},
		questionOpenEndedLikeTheMost: {
			type: DataTypes.TEXT,
			allowNull: true,
			defaultValue: ''
		},
		questionOpenEndedWhatCanWeImprove: {
			type: DataTypes.TEXT,
			allowNull: true,
			defaultValue: ''
		},
		questionDemoHeardAboutUs: {
			type: DataTypes.INTEGER,
			allowNull: true,
			validate: {
				min: 1,
				max: 5
			}
		},
		questionDemoAgeGroup: {
			type: DataTypes.INTEGER,
			allowNull: true,
			validate: {
				min: 1,
				max: 7
			}
		},
		questionDemoGender: {
			type: DataTypes.STRING,
			allowNull: true
		},
		questionDemoRegion: {
			type: DataTypes.STRING,
			allowNull: true
		},
		questionDemoLangPref: {
			type: DataTypes.STRING,
			allowNull: true
		},
		questionFinalThoughts: {
			type: DataTypes.TEXT,
			allowNull: true,
			defaultValue: ''
		},
		hasOptedInForFollowUp: {
			type: DataTypes.BOOLEAN,
			allowNull: true,
			defaultValue: false
		},
		email: {
			type: DataTypes.STRING,
			allowNull: true,
			defaultValue: ''
		},
		surveyDate: {
			type: DataTypes.DATE,
			defaultValue: DataTypes.NOW,
			allowNull: false
		}
	},
	{
		sequelize,
		modelName: 'FeedbackSurvey',
		timestamps: true
	}
);

export default FeedbackSurvey;
