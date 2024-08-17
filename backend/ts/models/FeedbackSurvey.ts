import { DataTypes, Model, Sequelize } from 'sequelize';
import { initializeDatabase } from '../index.js';

class FeedbackSurvey extends Model {}

async function initializeFeedbackSurveyModel() {
	const sequelize = await initializeDatabase();

	FeedbackSurvey.init(
		{
			userId: {
				type: DataTypes.UUID,
				defaultValue: DataTypes.UUIDV4,
				primaryKey: true,
				allowNull: false,
				unique: true,
			},
			questionGeneralApproval: {
				type: DataTypes.INTEGER,
				allowNull: true,
				validate: {
					min: 1,
					max: 5,
				},
			},
			questionServiceQuality: {
				type: DataTypes.INTEGER,
				allowNull: true,
				validate: {
					min: 1,
					max: 5,
				},
			},
			questionEaseOfUse: {
				type: DataTypes.INTEGER,
				allowNull: true,
				validate: {
					min: 1,
					max: 5,
				},
			},
			questionUserSupport: {
				type: DataTypes.INTEGER,
				allowNull: true,
				validate: {
					min: 0, // allows for N/A
					max: 5,
				},
			},
			questionHelpGuides: {
				type: DataTypes.INTEGER,
				allowNull: true,
				validate: {
					min: 0, // allows for N/A
					max: 5,
				},
			},
			questionIsPremiumUser: {
				type: DataTypes.BOOLEAN,
				allowNull: true,
			},
			questionPremiumValue: {
				type: DataTypes.INTEGER,
				allowNull: true,
				validate: {
					min: 0,
					max: 5,
				},
			},
			questionLikelihoodToRecommend: {
				type: DataTypes.INTEGER,
				allowNull: true,
				validate: {
					min: 1,
					max: 5,
				},
			},
			questionUsefulFeaturesAndAspects: {
				// checklist; last option is Other and user can define it
				type: DataTypes.JSON,
				allowNull: true,
				defaultValue: [],
			},
			questionFeaturesThatNeedImprovement: {
				type: DataTypes.JSON,
				allowNull: true,
				defaultValue: [],
			},
			questionOpenEndedLikeTheMost: {
				type: DataTypes.TEXT,
				allowNull: true,
				defaultValue: '',
			},
			questionOpenEndedWhatCanWeImprove: {
				type: DataTypes.TEXT,
				allowNull: true,
				defaultValue: '',
			},
			questionDemoHeardAboutUs: {
				type: DataTypes.INTEGER,
				allowNull: true,
				validate: {
					min: 1,
					max: 5,
				},
			},
			questionDemoAgeGroup: {
				type: DataTypes.INTEGER,
				allowNull: true,
				validate: {
					min: 1,
					max: 7,
				},
			},
			questionDemoGender: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			questionDemoRegion: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			questionDemoLangPref: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			questionFinalThoughts: {
				type: DataTypes.TEXT,
				allowNull: true,
				defaultValue: '',
			},
			hasOptedInForFollowUp: {
				type: DataTypes.BOOLEAN,
				allowNull: true,
				defaultValue: false,
			},
			email: {
				type: DataTypes.STRING,
				allowNull: true,
				defaultValue: '',
			},
			created_at: {
				type: DataTypes.DATE,
				defaultValue: Sequelize.NOW,
				allowNull: false,
			},
		},
		{
			sequelize,
			modelName: 'FeedbackSurvey',
			timestamps: true,
		}
	);
}

const FeedbackSurveyModelPromise = (async () => {
	await initializeFeedbackSurveyModel();
	return FeedbackSurvey;
})();

export default FeedbackSurveyModelPromise;
