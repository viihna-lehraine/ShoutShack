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
	AuditLog: Awaited<ReturnType<typeof createAuditLogModel>> | null;
	BlotEntry: Awaited<ReturnType<typeof createBlotEntryModel>> | null;
	DataShareOptions: Awaited<
		ReturnType<typeof createDataShareOptionsModel>
	> | null;
	Device: Awaited<ReturnType<typeof createDeviceModel>> | null;
	ErrorLog: Awaited<ReturnType<typeof createErrorLogModel>> | null;
	FailedLoginAttempts: Awaited<
		ReturnType<typeof createFailedLoginAttemptsModel>
	> | null;
	FeatureRequest: Awaited<
		ReturnType<typeof createFeatureRequestModel>
	> | null;
	FeedbackSurvey: Awaited<
		ReturnType<typeof createFeedbackSurveyModel>
	> | null;
	MFASetup: Awaited<ReturnType<typeof createMFASetupModel>> | null;
	RecoveryMethod: Awaited<
		ReturnType<typeof createRecoveryMethodModel>
	> | null;
	SecurityEvent: Awaited<ReturnType<typeof createSecurityEventModel>> | null;
	SupportRequest: Awaited<
		ReturnType<typeof createSupportRequestModel>
	> | null;
	User: Awaited<ReturnType<typeof createUserModel>> | null;
	UserMFA: Awaited<ReturnType<typeof createUserMFAModel>> | null;
	UserSession: Awaited<ReturnType<typeof createUserSessionModel>> | null;
}

export async function loadModels(sequelize: Sequelize): Promise<Models | null> {
	const logger = await ServiceFactory.getLoggerService();
	const errorLogger = await ServiceFactory.getErrorLoggerService();
	const errorHandler = await ServiceFactory.getErrorHandlerService();

	validateDependencies([{ name: 'sequelize', instance: sequelize }], logger);

	try {
		const models: Models = {
			AuditLog: await createAuditLogModel(),
			BlotEntry: await createBlotEntryModel(),
			DataShareOptions: await createDataShareOptionsModel(),
			Device: await createDeviceModel(),
			ErrorLog: await createErrorLogModel(),
			FailedLoginAttempts: await createFailedLoginAttemptsModel(),
			FeatureRequest: await createFeatureRequestModel(),
			FeedbackSurvey: await createFeedbackSurveyModel(),
			MFASetup: await createMFASetupModel(),
			RecoveryMethod: await createRecoveryMethodModel(),
			SecurityEvent: await createSecurityEventModel(),
			SupportRequest: await createSupportRequestModel(),
			User: await createUserModel(),
			UserMFA: await createUserMFAModel(),
			UserSession: await createUserSessionModel()
		};

		for (const [modelName, modelInstance] of Object.entries(models)) {
			if (!modelInstance) {
				const errorMessage = `Model ${modelName} failed to initialize`;
				logger.error(errorMessage);
				return null;
			}
		}

		const User = models.User!;
		const AuditLog = models.AuditLog!;
		const FailedLoginAttempts = models.FailedLoginAttempts!;
		const BlotEntry = models.BlotEntry!;
		const RecoveryMethod = models.RecoveryMethod!;
		const SecurityEvent = models.SecurityEvent!;
		const SupportRequest = models.SupportRequest!;
		const UserSession = models.UserSession!;
		const UserMFA = models.UserMFA!;

		User.hasMany(AuditLog, { foreignKey: 'id', as: 'auditLogs' });
		User.hasMany(FailedLoginAttempts, {
			foreignKey: 'id',
			as: 'failedLoginAttempts'
		});
		User.hasMany(BlotEntry, { foreignKey: 'id', as: 'guestbookEntries' });
		User.hasMany(RecoveryMethod, {
			foreignKey: 'id',
			as: 'recoveryMethods'
		});
		User.hasMany(SecurityEvent, { foreignKey: 'id', as: 'securityEvents' });
		User.hasMany(SupportRequest, {
			foreignKey: 'id',
			as: 'supportRequests'
		});
		User.hasMany(UserSession, { foreignKey: 'id', as: 'sessions' });
		User.hasOne(UserMFA, { foreignKey: 'id', as: 'user' });
		AuditLog.belongsTo(User, { foreignKey: 'id', as: 'user' });
		models.DataShareOptions!.belongsTo(User, {
			foreignKey: 'id',
			as: 'user'
		});
		models.Device!.belongsTo(User, { foreignKey: 'id', as: 'user' });
		FailedLoginAttempts.belongsTo(User, { foreignKey: 'id', as: 'user' });
		models.FeatureRequest!.belongsTo(User, {
			foreignKey: 'id',
			as: 'user'
		});
		BlotEntry.belongsTo(User, { foreignKey: 'id', as: 'user' });
		models.MFASetup!.belongsTo(User, { foreignKey: 'id', as: 'user' });
		RecoveryMethod.belongsTo(User, { foreignKey: 'id', as: 'user' });
		SecurityEvent.belongsTo(User, { foreignKey: 'id', as: 'user' });
		SupportRequest.belongsTo(User, { foreignKey: 'id', as: 'user' });
		UserMFA.belongsTo(User, { foreignKey: 'id', as: 'user' });
		UserSession.belongsTo(User, { foreignKey: 'id', as: 'user' });

		return models;
	} catch (dbError) {
		const dbUtil = 'loadModels()';
		const databaseRecoverableError =
			new errorHandler.ErrorClasses.DatabaseErrorRecoverable(
				`Error occurred when attempting to execute ${dbUtil}: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`,
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
