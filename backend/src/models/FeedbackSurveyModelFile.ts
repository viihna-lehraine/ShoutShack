import {
	CreationOptional,
	DataTypes,
	Model,
	InferAttributes,
	InferCreationAttributes,
	Sequelize
} from 'sequelize';
import { configService } from '../services/configService';
import { errorHandler } from '../services/errorHandler';
import { validateDependencies } from '../utils/helpers';

interface FeedbackSurveyAttributes {
	surveyId: number;
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
	surveyDate?: CreationOptional<Date>;
}

class FeedbackSurvey
	extends Model<
		InferAttributes<FeedbackSurvey>,
		InferCreationAttributes<FeedbackSurvey>
	>
	implements FeedbackSurveyAttributes
{
	public surveyId!: number;
	public questionGeneralApproval?: number | null;
	public questionServiceQuality?: number | null;
	public questionEaseOfUse?: number | null;
	public questionUserSupport?: number | null;
	public questionHelpGuides?: number | null;
	public questionIsPremiumUser?: boolean | null;
	public questionPremiumValue?: number | null;
	public questionLikelihoodToRecommend?: number | null;
	public questionUsefulFeaturesAndAspects?: object | null;
	public questionFeaturesThatNeedImprovement?: object | null;
	public questionOpenEndedLikeTheMost?: string | null;
	public questionOpenEndedWhatCanWeImprove?: string | null;
	public questionDemoHeardAboutUs?: number | null;
	public questionDemoAgeGroup?: number | null;
	public questionDemoGender?: string | null;
	public questionDemoRegion?: string | null;
	public questionDemoLangPref?: string | null;
	public questionFinalThoughts?: string | null;
	public hasOptedInForFollowUp?: boolean | null;
	public email?: string | null;
	public surveyDate!: CreationOptional<Date>;
}

export default function createFeedbackSurveyModel(
	sequelize: Sequelize
): typeof FeedbackSurvey | null {
	const logger = configService.getAppLogger();
	const errorLogger = configService.getErrorLogger();

	try {
		validateDependencies(
			[{ name: 'sequelize', instance: sequelize }],
			logger
		);

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
						min: 0,
						max: 5
					}
				},
				questionHelpGuides: {
					type: DataTypes.INTEGER,
					allowNull: true,
					validate: {
						min: 0,
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

		logger.info('FeedbackSurvey model initialized successfully');
		return FeedbackSurvey;
	} catch (dbError) {
		const databaseError =
			new errorHandler.ErrorClasses.DatabaseErrorRecoverable(
				`Failed to initialize FeedbackSurvey model: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`,
				{
					exposeToClient: false
				}
			);
		errorLogger.logInfo(databaseError.message);
		errorHandler.handleError({ error: databaseError });
		return null;
	}
}

export { FeedbackSurvey };
