import { Response } from 'express';
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
import { validateDependencies } from '../utils/helpers';
import { ServiceFactory } from '../index/factory';

let res: Response;

export interface Models {
	AuditLog: ReturnType<typeof createAuditLogModel> | null;
	BlotEntry: ReturnType<typeof createBlotEntryModel> | null;
	DataShareOptions: ReturnType<typeof createDataShareOptionsModel> | null;
	Device: ReturnType<typeof createDeviceModel> | null;
	ErrorLog: ReturnType<typeof createErrorLogModel> | null;
	FailedLoginAttempts: ReturnType<
		typeof createFailedLoginAttemptsModel
	> | null;
	FeatureRequest: ReturnType<typeof createFeatureRequestModel> | null;
	FeedbackSurvey: ReturnType<typeof createFeedbackSurveyModel> | null;
	MFASetup: ReturnType<typeof createMFASetupModel> | null;
	RecoveryMethod: ReturnType<typeof createRecoveryMethodModel>;
	SecurityEvent: ReturnType<typeof createSecurityEventModel>;
	SupportRequest: ReturnType<typeof createSupportRequestModel>;
	User: ReturnType<typeof createUserModel>;
	UserMFA: ReturnType<typeof createUserMFAModel>;
	UserSession: ReturnType<typeof createUserSessionModel>;
}

export async function loadModels(sequelize: Sequelize): Promise<Models | null> {
	const logger = await ServiceFactory.getLoggerService();
	const errorLogger = await ServiceFactory.getErrorLoggerService();
	const errorHandler = await ServiceFactory.getErrorHandlerService();

	validateDependencies([{ name: 'sequelize', instance: sequelize }], logger);
	try {
		const models: Models = {
			AuditLog: createAuditLogModel(),
			BlotEntry: createBlotEntryModel(),
			DataShareOptions: createDataShareOptionsModel(),
			Device: createDeviceModel(),
			ErrorLog: createErrorLogModel(),
			FailedLoginAttempts: createFailedLoginAttemptsModel(),
			FeatureRequest: createFeatureRequestModel(),
			FeedbackSurvey: createFeedbackSurveyModel(),
			MFASetup: createMFASetupModel(),
			RecoveryMethod: createRecoveryMethodModel(),
			SecurityEvent: createSecurityEventModel(),
			SupportRequest: createSupportRequestModel(),
			User: createUserModel(),
			UserMFA: createUserMFAModel(),
			UserSession: createUserSessionModel()
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
		models.User!.hasMany(models.BlotEntry!, {
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
		models.User!.hasOne(models.UserMFA!, { foreignKey: 'id', as: 'user' });

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
		models.BlotEntry!.belongsTo(models.User!, {
			foreignKey: 'id',
			as: 'user'
		});
		models.MFASetup!.belongsTo(models.User!, {
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
		models.UserMFA!.belongsTo(models.User!, {
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
