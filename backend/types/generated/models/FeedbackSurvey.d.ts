import { CreationOptional, Model, InferAttributes, InferCreationAttributes, Sequelize } from 'sequelize';
import { Logger } from '../config/logger';
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
declare class FeedbackSurvey extends Model<InferAttributes<FeedbackSurvey>, InferCreationAttributes<FeedbackSurvey>> implements FeedbackSurveyAttributes {
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
    surveyDate: CreationOptional<Date>;
}
export default function createFeedbackSurveyModel(sequelize: Sequelize, logger: Logger): typeof FeedbackSurvey;
export { FeedbackSurvey };
//# sourceMappingURL=FeedbackSurvey.d.ts.map