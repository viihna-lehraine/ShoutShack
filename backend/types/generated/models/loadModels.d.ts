import { Sequelize } from 'sequelize';
import { createAuditLogModel } from './AuditLog';
import { createBlotEntryModel } from './BlotEntryAttributes';
import { createDataShareOptionsModel } from './DataShareOptions';
import { createDeviceModel } from './Device';
import { createErrorLogModel } from './ErrorLog';
import { createFailedLoginAttemptsModel } from './FailedLoginAttempts';
import { createFeatureRequestModel } from './FeatureRequest';
import { createFeedbackSurveyModel } from './FeedbackSurvey';
import { createMFASetupModel } from './MFASetup';
import { createRecoveryMethodModel } from './RecoveryMethod';
import { createSecurityEventModel } from './SecurityEvent';
import { createSupportRequestModel } from './SupportRequest';
import { createUserMFAModel } from './UserMFA';
import { createUserModel } from './User';
import { createUserSessionModel } from './UserSession';
export interface Models {
    AuditLog: Awaited<ReturnType<typeof createAuditLogModel>> | null;
    BlotEntry: Awaited<ReturnType<typeof createBlotEntryModel>> | null;
    DataShareOptions: Awaited<ReturnType<typeof createDataShareOptionsModel>> | null;
    Device: Awaited<ReturnType<typeof createDeviceModel>> | null;
    ErrorLog: Awaited<ReturnType<typeof createErrorLogModel>> | null;
    FailedLoginAttempts: Awaited<ReturnType<typeof createFailedLoginAttemptsModel>> | null;
    FeatureRequest: Awaited<ReturnType<typeof createFeatureRequestModel>> | null;
    FeedbackSurvey: Awaited<ReturnType<typeof createFeedbackSurveyModel>> | null;
    MFASetup: Awaited<ReturnType<typeof createMFASetupModel>> | null;
    RecoveryMethod: Awaited<ReturnType<typeof createRecoveryMethodModel>> | null;
    SecurityEvent: Awaited<ReturnType<typeof createSecurityEventModel>> | null;
    SupportRequest: Awaited<ReturnType<typeof createSupportRequestModel>> | null;
    User: Awaited<ReturnType<typeof createUserModel>> | null;
    UserMFA: Awaited<ReturnType<typeof createUserMFAModel>> | null;
    UserSession: Awaited<ReturnType<typeof createUserSessionModel>> | null;
}
export declare function loadModels(sequelize: Sequelize): Promise<Models | null>;
//# sourceMappingURL=loadModels.d.ts.map