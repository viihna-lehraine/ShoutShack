import { Sequelize } from 'sequelize';
import createUserModel from './User';
import createAuditLogModel from './AuditLog';
import createDataShareOptionsModel from './DataShareOptions';
import createDeviceModel from './Device';
import createFailedLoginAttemptsModel from './FailedLoginAttempts';
import createFeatureRequestModel from './FeatureRequest';
import createFeedbackSurveyModel from './FeedbackSurvey';
import createGuestbookEntryModel from './GuestbookEntry';
import createMultiFactorAuthSetupModel from './MultiFactorAuthSetup';
import createRecoveryMethodModel from './RecoveryMethod';
import createSecurityEventModel from './SecurityEvent';
import createSupportRequestModel from './SupportRequest';
import createUserMfaModel from './UserMfa';
import createUserSessionModel from './UserSession';
interface Models {
    User: ReturnType<typeof createUserModel>;
    AuditLog: ReturnType<typeof createAuditLogModel>;
    DataShareOptions: ReturnType<typeof createDataShareOptionsModel>;
    Device: ReturnType<typeof createDeviceModel>;
    FailedLoginAttempts: ReturnType<typeof createFailedLoginAttemptsModel>;
    FeatureRequest: ReturnType<typeof createFeatureRequestModel>;
    FeedbackSurvey: ReturnType<typeof createFeedbackSurveyModel>;
    GuestbookEntry: ReturnType<typeof createGuestbookEntryModel>;
    MultiFactorAuthSetup: ReturnType<typeof createMultiFactorAuthSetupModel>;
    RecoveryMethod: ReturnType<typeof createRecoveryMethodModel>;
    SecurityEvent: ReturnType<typeof createSecurityEventModel>;
    SupportRequest: ReturnType<typeof createSupportRequestModel>;
    UserMfa: ReturnType<typeof createUserMfaModel>;
    UserSession: ReturnType<typeof createUserSessionModel>;
}
export declare function initializeModels(sequelize: Sequelize): Promise<Models>;
export {};
//# sourceMappingURL=ModelsIndex.d.ts.map