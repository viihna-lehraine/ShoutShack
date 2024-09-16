import { Sequelize } from 'sequelize';
import createAuditLogModel from './AuditLogModel';
import createDataShareOptionsModel from './DataShareOptionsModel';
import createDeviceModel from './DeviceModelFile';
import createFailedLoginAttemptsModel from './FailedLoginAttemptsModelFile';
import createFeatureRequestModel from './FeatureRequestModelFile';
import createFeedbackSurveyModel from './FeedbackSurveyModelFile';
import createGuestbookEntryModel from './GuestbookEntryModelFile';
import createMultiFactorAuthSetupModel from './MultiFactorAuthSetupModelFile';
import createRecoveryMethodModel from './RecoveryMethodModelFile';
import createSecurityEventModel from './SecurityEventModelFile';
import createSupportRequestModel from './SupportRequestModelFile';
import createUserMfaModel from './UserMfaModelFile';
import createUserModel from './UserModelFile';
import createUserSessionModel from './UserSessionModelFile';
import { Logger } from '../utils/logger';
export interface Models {
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
    User: ReturnType<typeof createUserModel>;
    UserMfa: ReturnType<typeof createUserMfaModel>;
    UserSession: ReturnType<typeof createUserSessionModel>;
}
export declare function loadModels(sequelize: Sequelize, logger: Logger): Promise<Models>;
//# sourceMappingURL=loadModels.d.ts.map
