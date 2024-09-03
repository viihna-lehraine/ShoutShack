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
	// create the models
	const models: Models = {
		AuditLog: createAuditLogModel(sequelize),
		DataShareOptions: createDataShareOptionsModel(sequelize),
		Device: createDeviceModel(sequelize),
		FailedLoginAttempts: createFailedLoginAttemptsModel(sequelize),
		FeatureRequest: createFeatureRequestModel(sequelize),
		FeedbackSurvey: createFeedbackSurveyModel(sequelize),
		GuestbookEntry: createGuestbookEntryModel(sequelize),
		MultiFactorAuthSetup: createMultiFactorAuthSetupModel(sequelize),
		RecoveryMethod: createRecoveryMethodModel(sequelize),
		SecurityEvent: createSecurityEventModel(sequelize),
		SupportRequest: createSupportRequestModel(sequelize),
		UserMfa: createUserMfaModel(sequelize),
		User: createUserModel(sequelize),
		UserSession: createUserSessionModel(sequelize)
	};

	// define associations
	models.User.hasMany(models.AuditLog, { foreignKey: 'id', as: 'auditLogs' });
	models.User.hasMany(models.FailedLoginAttempts, {
		foreignKey: 'id',
		as: 'failedLoginAttempts'
	});
	models.User.hasMany(models.GuestbookEntry, {
		foreignKey: 'id',
		as: 'guestbookEntries'
	});
	models.User.hasMany(models.RecoveryMethod, {
		foreignKey: 'id',
		as: 'recoveryMethods'
	});
	models.User.hasMany(models.SecurityEvent, {
		foreignKey: 'id',
		as: 'securityEvents'
	});
	models.User.hasMany(models.SupportRequest, {
		foreignKey: 'id',
		as: 'supportRequests'
	});
	models.User.hasMany(models.UserSession, {
		foreignKey: 'id',
		as: 'sessions'
	});

	models.User.hasOne(models.UserMfa, { foreignKey: 'id', as: 'user' });

	models.AuditLog.belongsTo(models.User, { foreignKey: 'id', as: 'user' });
	models.DataShareOptions.belongsTo(models.User, {
		foreignKey: 'id',
		as: 'user'
	});
	models.Device.belongsTo(models.User, { foreignKey: 'id', as: 'user' });
	models.FailedLoginAttempts.belongsTo(models.User, {
		foreignKey: 'id',
		as: 'user'
	});
	models.FeatureRequest.belongsTo(models.User, {
		foreignKey: 'id',
		as: 'user'
	});
	models.GuestbookEntry.belongsTo(models.User, {
		foreignKey: 'id',
		as: 'user'
	});
	models.MultiFactorAuthSetup.belongsTo(models.User, {
		foreignKey: 'id',
		as: 'user'
	});
	models.RecoveryMethod.belongsTo(models.User, {
		foreignKey: 'id',
		as: 'user'
	});
	models.SecurityEvent.belongsTo(models.User, {
		foreignKey: 'id',
		as: 'user'
	});
	models.SupportRequest.belongsTo(models.User, {
		foreignKey: 'id',
		as: 'user'
	});
	models.UserMfa.belongsTo(models.User, { foreignKey: 'id', as: 'user' });
	models.UserSession.belongsTo(models.User, { foreignKey: 'id', as: 'user' });

	return models;
}
