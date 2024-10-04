import {
	CreationOptional,
	DataTypes,
	Model,
	InferAttributes,
	InferCreationAttributes
} from 'sequelize';
import { validateDependencies } from '../utils/helpers';
import { ServiceFactory } from '../index/factory';
import { FeedbackSurveyAttributes } from '../index/interfaces/models';

export class FeedbackSurvey
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

export async function createFeedbackSurveyModel(): Promise<
	typeof FeedbackSurvey | null
> {
	const logger = await ServiceFactory.getLoggerService();
	const errorLogger = await ServiceFactory.getErrorLoggerService();
	const errorHandler = await ServiceFactory.getErrorHandlerService();

	try {
		const databaseController = await ServiceFactory.getDatabaseController();
		const sequelize = databaseController.getSequelizeInstance();

		if (!sequelize) {
			const databaseError =
				new errorHandler.ErrorClasses.DatabaseErrorRecoverable(
					'Failed to initialize FeedbackSurvey model: Sequelize instance not found',
					{ exposeToClient: false }
				);
			errorLogger.logError(databaseError.message);
			errorHandler.handleError({ error: databaseError });
			return null;
		}

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
		errorLogger.logError(databaseError.message);
		errorHandler.handleError({ error: databaseError });
		return null;
	}
}
