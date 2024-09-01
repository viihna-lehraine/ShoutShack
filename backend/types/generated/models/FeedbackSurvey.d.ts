import { Model, InferAttributes, InferCreationAttributes, Sequelize } from 'sequelize';
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
declare class FeedbackSurvey extends Model<InferAttributes<FeedbackSurvey>, InferCreationAttributes<FeedbackSurvey>> implements FeedbackSurveyAttributes {
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
export default function createFeedbackSurveyModel(sequelize: Sequelize): typeof FeedbackSurvey;
export {};
//# sourceMappingURL=FeedbackSurvey.d.ts.map