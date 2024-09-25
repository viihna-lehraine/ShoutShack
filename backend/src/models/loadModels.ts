import { Response } from 'express';
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
import { createUserModel } from './UserModelFile';
import createUserSessionModel from './UserSessionModelFile';
import { configService } from '../services/configService';
import { errorHandler } from '../services/errorHandler';
import { validateDependencies } from '../utils/helpers';

let res: Response;

export interface Models {
	AuditLog: ReturnType<typeof createAuditLogModel> | null;
	DataShareOptions: ReturnType<typeof createDataShareOptionsModel> | null;
	Device: ReturnType<typeof createDeviceModel> | null;
	ErrorLog: ReturnType<typeof createErrorLogModel> | null;
	FailedLoginAttempts: ReturnType<
		typeof createFailedLoginAttemptsModel
	> | null;
	FeatureRequest: ReturnType<typeof createFeatureRequestModel> | null;
	FeedbackSurvey: ReturnType<typeof createFeedbackSurveyModel> | null;
	GuestbookEntry: ReturnType<typeof createGuestbookEntryModel> | null;
	MultiFactorAuthSetup: ReturnType<
		typeof createMultiFactorAuthSetupModel
	> | null;
	RecoveryMethod: ReturnType<typeof createRecoveryMethodModel>;
	SecurityEvent: ReturnType<typeof createSecurityEventModel>;
	SupportRequest: ReturnType<typeof createSupportRequestModel>;
	User: ReturnType<typeof createUserModel>;
	UserMfa: ReturnType<typeof createUserMfaModel>;
	UserSession: ReturnType<typeof createUserSessionModel>;
}

export async function loadModels(sequelize: Sequelize): Promise<Models | null> {
	const logger = configService.getAppLogger();
	const errorLogger = configService.getErrorLogger();

	validateDependencies([{ name: 'sequelize', instance: sequelize }], logger);
	try {
		const models: Models = {
			AuditLog: createAuditLogModel(sequelize),
			DataShareOptions: createDataShareOptionsModel(sequelize),
			Device: createDeviceModel(sequelize),
			ErrorLog: createErrorLogModel(sequelize),
			FailedLoginAttempts: createFailedLoginAttemptsModel(sequelize),
			FeatureRequest: createFeatureRequestModel(sequelize),
			FeedbackSurvey: createFeedbackSurveyModel(sequelize),
			GuestbookEntry: createGuestbookEntryModel(sequelize),
			MultiFactorAuthSetup: createMultiFactorAuthSetupModel(sequelize),
			RecoveryMethod: createRecoveryMethodModel(sequelize),
			SecurityEvent: createSecurityEventModel(sequelize),
			SupportRequest: createSupportRequestModel(sequelize),
			User: createUserModel(sequelize),
			UserMfa: createUserMfaModel(sequelize),
			UserSession: createUserSessionModel(sequelize)
		};

		for (const [modelName, modelInstance] of Object.entries(models)) {
			if (modelInstance === null) {
				const errorMessage = `Model ${modelName} failed to initialize`;
				logger.error(errorMessage);
				return null;
			}
		}

		models.User!.hasMany(models.AuditLog!, {
			foreignKey: 'id',
			as: 'auditLogs'
		});
		models.User!.hasMany(models.FailedLoginAttempts!, {
			foreignKey: 'id',
			as: 'failedLoginAttempts'
		});
		models.User!.hasMany(models.GuestbookEntry!, {
			foreignKey: 'id',
			as: 'guestbookEntries'
		});
		models.User!.hasMany(models.RecoveryMethod!, {
			foreignKey: 'id',
			as: 'recoveryMethods'
		});
		models.User!.hasMany(models.SecurityEvent!, {
			foreignKey: 'id',
			as: 'securityEvents'
		});
		models.User!.hasMany(models.SupportRequest!, {
			foreignKey: 'id',
			as: 'supportRequests'
		});
		models.User!.hasMany(models.UserSession!, {
			foreignKey: 'id',
			as: 'sessions'
		});
		models.User!.hasOne(models.UserMfa!, { foreignKey: 'id', as: 'user' });

		models.AuditLog!.belongsTo(models.User!, {
			foreignKey: 'id',
			as: 'user'
		});
		models.DataShareOptions!.belongsTo(models.User!, {
			foreignKey: 'id',
			as: 'user'
		});
		models.Device!.belongsTo(models.User!, {
			foreignKey: 'id',
			as: 'user'
		});
		models.FailedLoginAttempts!.belongsTo(models.User!, {
			foreignKey: 'id',
			as: 'user'
		});
		models.FeatureRequest!.belongsTo(models.User!, {
			foreignKey: 'id',
			as: 'user'
		});
		models.GuestbookEntry!.belongsTo(models.User!, {
			foreignKey: 'id',
			as: 'user'
		});
		models.MultiFactorAuthSetup!.belongsTo(models.User!, {
			foreignKey: 'id',
			as: 'user'
		});
		models.RecoveryMethod!.belongsTo(models.User!, {
			foreignKey: 'id',
			as: 'user'
		});
		models.SecurityEvent!.belongsTo(models.User!, {
			foreignKey: 'id',
			as: 'user'
		});
		models.SupportRequest!.belongsTo(models.User!, {
			foreignKey: 'id',
			as: 'user'
		});
		models.UserMfa!.belongsTo(models.User!, {
			foreignKey: 'id',
			as: 'user'
		});
		models.UserSession!.belongsTo(models.User!, {
			foreignKey: 'id',
			as: 'user'
		});

		return models;
	} catch (dbError) {
		const dbUtil = 'loadModels()';
		const databaseRecoverableError =
			new errorHandler.ErrorClasses.DatabaseErrorRecoverable(
				`Error occurred when attempting to execute ${dbUtil}: ${dbError instanceof Error ? dbError.message : 'Unknown error'};`,
				{ exposeToClient: false }
			);
		errorLogger.logError(databaseRecoverableError.message);

		await errorHandler.sendClientErrorResponse({
			message: 'Internal Server Error',
			statusCode: 500,
			res
		});
		errorHandler.handleError({
			error:
				databaseRecoverableError || dbError || Error || 'Unknown error'
		});

		return null;
	}
}
