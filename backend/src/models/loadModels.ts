import { Sequelize } from 'sequelize';
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
import createUserModel from './User';
import createUserSessionModel from './UserSession';

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
	UserMfa: ReturnType<typeof createUserMfaModel>;
	User: ReturnType<typeof createUserModel>;
	UserSession: ReturnType<typeof createUserSessionModel>;
}

export async function loadModels(sequelize: Sequelize): Promise<Models> {
	const AuditLog = createAuditLogModel(sequelize);
	const DataShareOptions = createDataShareOptionsModel(sequelize);
	const Device = createDeviceModel(sequelize);
	const FailedLoginAttempts = createFailedLoginAttemptsModel(sequelize);
	const FeatureRequest = createFeatureRequestModel(sequelize);
	const FeedbackSurvey = createFeedbackSurveyModel(sequelize);
	const GuestbookEntry = createGuestbookEntryModel(sequelize);
	const MultiFactorAuthSetup = createMultiFactorAuthSetupModel(sequelize);
	const RecoveryMethod = createRecoveryMethodModel(sequelize);
	const SecurityEvent = createSecurityEventModel(sequelize);
	const SupportRequest = createSupportRequestModel(sequelize);
	const UserMfa = createUserMfaModel(sequelize);
	const User = createUserModel(sequelize);
	const UserSession = createUserSessionModel(sequelize);

	// Define model associations
	User.hasMany(AuditLog, { foreignKey: 'id' });
	User.hasMany(UserSession, { foreignKey: 'userId' });
	UserSession.belongsTo(User, { foreignKey: 'userId' });

	return {
		AuditLog,
		DataShareOptions,
		Device,
		FailedLoginAttempts,
		FeatureRequest,
		FeedbackSurvey,
		GuestbookEntry,
		MultiFactorAuthSetup,
		RecoveryMethod,
		SecurityEvent,
		SupportRequest,
		UserMfa,
		User,
		UserSession
	};
}
