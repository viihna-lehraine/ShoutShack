import { Sequelize } from 'sequelize';
import createAuditLogModel from './AuditLogModelFile';
import createDataShareOptionsModel from './DataShareOptionsModelFile';
import createDeviceModel from './DeviceModelFile';
import { createErrorLogModel } from './ErrorLogModelFile';
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
import createUserSessionModel from './UserSession';
import { processError } from '../errors/processError';
import { Logger } from '../utils/logger';
import { validateDependencies } from '../utils/validateDependencies';

export interface Models {
	AuditLog: ReturnType<typeof createAuditLogModel>;
	DataShareOptions: ReturnType<typeof createDataShareOptionsModel>;
	Device: ReturnType<typeof createDeviceModel>;
	ErrorLog: ReturnType<typeof createErrorLogModel>;
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

export async function loadModels(
	sequelize: Sequelize,
	logger: Logger
): Promise<Models> {
	validateDependencies(
		[
			{ name: 'sequelize', instance: sequelize },
			{ name: 'logger', instance: logger }
		],
		logger || console
	);
	try {
		const models: Models = {
			AuditLog: createAuditLogModel(sequelize, logger),
			DataShareOptions: createDataShareOptionsModel(sequelize, logger),
			Device: createDeviceModel(sequelize, logger),
			ErrorLog: createErrorLogModel(sequelize, logger),
			FailedLoginAttempts: createFailedLoginAttemptsModel(
				sequelize,
				logger
			),
			FeatureRequest: createFeatureRequestModel(sequelize, logger),
			FeedbackSurvey: createFeedbackSurveyModel(sequelize, logger),
			GuestbookEntry: createGuestbookEntryModel(sequelize, logger),
			MultiFactorAuthSetup: createMultiFactorAuthSetupModel(
				sequelize,
				logger
			),
			RecoveryMethod: createRecoveryMethodModel(sequelize, logger),
			SecurityEvent: createSecurityEventModel(sequelize, logger),
			SupportRequest: createSupportRequestModel(sequelize, logger),
			User: createUserModel(sequelize, logger),
			UserMfa: createUserMfaModel(sequelize, logger),
			UserSession: createUserSessionModel(sequelize, logger)
		};

		models.User.hasMany(models.AuditLog, {
			foreignKey: 'id',
			as: 'auditLogs'
		});
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

		models.AuditLog.belongsTo(models.User, {
			foreignKey: 'id',
			as: 'user'
		});
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
		models.UserSession.belongsTo(models.User, {
			foreignKey: 'id',
			as: 'user'
		});

		return models;
	} catch (error) {
		processError(error, logger || console);
		throw error;
	}
}
