import {
	CreationOptional,
	Model,
	InferAttributes,
	InferCreationAttributes,
	DataTypes,
	Sequelize
} from 'sequelize';

interface FeedbackSurveyAttributes {
	surveyId: number; // primary key, auto-incremented
	questionGeneralApproval?: number | null; // optional rating from 1 to 5
	questionServiceQuality?: number | null; // optional rating from 1 to 5
	questionEaseOfUse?: number | null; // optional rating from 1 to 5
	questionUserSupport?: number | null; // optional rating from 0 to 5 (0 allows for N/A)
	questionHelpGuides?: number | null; // optional rating from 0 to 5 (0 allows for N/A)
	questionIsPremiumUser?: boolean | null; // optional boolean to indicate premium user status
	questionPremiumValue?: number | null; // optional rating from 0 to 5 for premium value
	questionLikelihoodToRecommend?: number | null; // optional rating from 1 to 5 for likelihood to recommend
	questionUsefulFeaturesAndAspects?: object | null; // optional JSON object for useful features
	questionFeaturesThatNeedImprovement?: object | null; // optional JSON object for features needing improvement
	questionOpenEndedLikeTheMost?: string | null; // optional text for what the user liked the most
	questionOpenEndedWhatCanWeImprove?: string | null; // optional text for suggestions for improvement
	questionDemoHeardAboutUs?: number | null; // optional integer representing how the user heard about us
	questionDemoAgeGroup?: number | null; // optional integer representing the user's age group
	questionDemoGender?: string | null; // optional string representing the user's gender
	questionDemoRegion?: string | null; // optional string representing the user's region
	questionDemoLangPref?: string | null; // optional string representing the user's language preference
	questionFinalThoughts?: string | null; // optional text for any final thoughts
	hasOptedInForFollowUp?: boolean | null; // optional boolean to indicate if the user opted in for follow-up
	email?: string | null; // optional email of the user
	surveyDate?: Date; // date when the survey was submitted
}

class FeedbackSurvey
	extends Model<
		InferAttributes<FeedbackSurvey>,
		InferCreationAttributes<FeedbackSurvey>
	>
	implements FeedbackSurveyAttributes
{
	surveyId!: number; // primary key, auto-incremented
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
	surveyDate!: CreationOptional<Date>; // CreationOptional to allow for Sequelize's default value
}

export default function createFeedbackSurveyModel(
	sequelize: Sequelize
): typeof FeedbackSurvey {
	FeedbackSurvey.init(
		{
			surveyId: {
				type: DataTypes.INTEGER,
				primaryKey: true, // primary key for the feedback survey record
				autoIncrement: true, // auto-increment for unique feedback surveys
				allowNull: false,
				unique: true // ensure uniqueness
			},
			questionGeneralApproval: {
				type: DataTypes.INTEGER,
				allowNull: true,
				validate: {
					min: 1,
					max: 5 // rating from 1 to 5
				}
			},
			questionServiceQuality: {
				type: DataTypes.INTEGER,
				allowNull: true,
				validate: {
					min: 1,
					max: 5 // rating from 1 to 5
				}
			},
			questionEaseOfUse: {
				type: DataTypes.INTEGER,
				allowNull: true,
				validate: {
					min: 1,
					max: 5 // rating from 1 to 5
				}
			},
			questionUserSupport: {
				type: DataTypes.INTEGER,
				allowNull: true,
				validate: {
					min: 0, // allows for N/A (0)
					max: 5 // rating from 0 to 5
				}
			},
			questionHelpGuides: {
				type: DataTypes.INTEGER,
				allowNull: true,
				validate: {
					min: 0, // allows for N/A (0)
					max: 5 // rating from 0 to 5
				}
			},
			questionIsPremiumUser: {
				type: DataTypes.BOOLEAN,
				allowNull: true // optional boolean for premium user status
			},
			questionPremiumValue: {
				type: DataTypes.INTEGER,
				allowNull: true,
				validate: {
					min: 0, // allows for N/A (0)
					max: 5 // rating from 0 to 5
				}
			},
			questionLikelihoodToRecommend: {
				type: DataTypes.INTEGER,
				allowNull: true,
				validate: {
					min: 1,
					max: 5 // rating from 1 to 5
				}
			},
			questionUsefulFeaturesAndAspects: {
				type: DataTypes.JSON,
				allowNull: true,
				defaultValue: [] // default to empty array if no features are selected
			},
			questionFeaturesThatNeedImprovement: {
				type: DataTypes.JSON,
				allowNull: true,
				defaultValue: [] // default to empty array if no features are selected
			},
			questionOpenEndedLikeTheMost: {
				type: DataTypes.TEXT,
				allowNull: true,
				defaultValue: '' // default to empty string if no feedback is provided
			},
			questionOpenEndedWhatCanWeImprove: {
				type: DataTypes.TEXT,
				allowNull: true,
				defaultValue: '' // default to empty string if no feedback is provided
			},
			questionDemoHeardAboutUs: {
				type: DataTypes.INTEGER,
				allowNull: true,
				validate: {
					min: 1,
					max: 5 // rating from 1 to 5
				}
			},
			questionDemoAgeGroup: {
				type: DataTypes.INTEGER,
				allowNull: true,
				validate: {
					min: 1,
					max: 7 // age group from 1 to 7
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
				defaultValue: '' // default to empty string if no feedback is provided
			},
			hasOptedInForFollowUp: {
				type: DataTypes.BOOLEAN,
				allowNull: true,
				defaultValue: false // default to false if no follow-up is requested
			},
			email: {
				type: DataTypes.STRING,
				allowNull: true,
				defaultValue: '' // default to empty string if no email is provided
			},
			surveyDate: {
				type: DataTypes.DATE,
				defaultValue: DataTypes.NOW,
				allowNull: false // defaults to current date/time
			}
		},
		{
			sequelize,
			modelName: 'FeedbackSurvey',
			timestamps: true // automatically manage createdAt and updatedAt timestamps
		}
	);

	return FeedbackSurvey;
}
