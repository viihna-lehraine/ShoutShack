import {
	Model,
	InferAttributes,
	InferCreationAttributes,
	DataTypes,
	Sequelize
} from 'sequelize';

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

export default function createFeedbackSurveyModel(
	sequelize: Sequelize
): typeof FeedbackSurvey {
	FeedbackSurvey.init(
		{
			surveyId: {
				type: DataTypes.STRING,
				allowNull: false,
				primaryKey: true
			},
			questionGeneralApproval: {
				type: DataTypes.INTEGER,
				allowNull: true
			},
			questionServiceQuality: {
				type: DataTypes.INTEGER,
				allowNull: true
			},
			questionEaseOfUse: {
				type: DataTypes.INTEGER,
				allowNull: true
			},
			questionUserSupport: {
				type: DataTypes.INTEGER,
				allowNull: true
			},
			questionHelpGuides: {
				type: DataTypes.INTEGER,
				allowNull: true
			},
			questionIsPremiumUser: {
				type: DataTypes.BOOLEAN,
				allowNull: true
			},
			questionPremiumValue: {
				type: DataTypes.INTEGER,
				allowNull: true
			},
			questionLikelihoodToRecommend: {
				type: DataTypes.INTEGER,
				allowNull: true
			},
			questionUsefulFeaturesAndAspects: {
				type: DataTypes.JSON,
				allowNull: true
			},
			questionFeaturesThatNeedImprovement: {
				type: DataTypes.JSON,
				allowNull: true
			},
			questionOpenEndedLikeTheMost: {
				type: DataTypes.TEXT,
				allowNull: true
			},
			questionOpenEndedWhatCanWeImprove: {
				type: DataTypes.TEXT,
				allowNull: true
			},
			questionDemoHeardAboutUs: {
				type: DataTypes.INTEGER,
				allowNull: true
			},
			questionDemoAgeGroup: {
				type: DataTypes.INTEGER,
				allowNull: true
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
				allowNull: true
			},
			hasOptedInForFollowUp: {
				type: DataTypes.BOOLEAN,
				allowNull: true
			},
			email: {
				type: DataTypes.STRING,
				allowNull: true
			},
			surveyDate: {
				type: DataTypes.DATE,
				allowNull: false,
				defaultValue: DataTypes.NOW
			}
		},
		{
			sequelize,
			tableName: 'FeedbackSurveys',
			timestamps: false
		}
	);

	return FeedbackSurvey;
}
