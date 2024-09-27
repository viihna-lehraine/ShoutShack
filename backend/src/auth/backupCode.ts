import { Response } from 'express';
import {
	AppLoggerServiceInterface,
	BackupCodeInterface,
	BackupCodeServiceInterface,
	ErrorHandlerServiceInterface,
	ErrorLoggerServiceInterface
} from '../index/interfaces';
import { validateDependencies } from '../utils/helpers';
import { ServiceFactory } from '../index/factory';

const logger: AppLoggerServiceInterface = ServiceFactory.getLoggerService();
const errorLogger: ErrorLoggerServiceInterface =
	ServiceFactory.getErrorLoggerService();
const errorHandler: ErrorHandlerServiceInterface =
	ServiceFactory.getErrorHandlerService();

let res: Response;

export default function createBackupCodeService({
	UserMfa,
	bcrypt,
	crypto
}: BackupCodeServiceInterface): {
	generateBackupCodes: (id: string) => Promise<string[]>;
	verifyBackupCode: (id: string, inputCode: string) => Promise<boolean>;
	saveBackupCodesToDatabase: (
		id: string,
		backupCodes: BackupCodeInterface[]
	) => Promise<void>;
	getBackupCodesFromDatabase: (
		id: string
	) => Promise<BackupCodeInterface[] | undefined>;
	updateBackupCodesInDatabase: (
		id: string,
		backupCodes: BackupCodeInterface[]
	) => Promise<void>;
} {
	async function generateBackupCodes(id: string): Promise<string[]> {
		try {
			validateDependencies([{ name: 'id', instance: id }], logger);

			const backupCodes: BackupCodeInterface[] = [];
			for (let i = 0; i < 16; i++) {
				const code = crypto.randomBytes(4).toString('hex');
				const hashedCode = await bcrypt.hash(code, 10);
				backupCodes.push({ code: hashedCode, used: false });
			}

			await saveBackupCodesToDatabase(id, backupCodes);

			return backupCodes.map(backupCode => backupCode.code);
		} catch (utilError) {
			const utility: string = 'generateBackupCodes()';
			const utilityError =
				new errorHandler.ErrorClasses.UtilityErrorRecoverable(
					`Error occured with dependency ${utility}. Failed to generate backup codes for user ${id}: ${utilError instanceof Error ? utilError.message : utilError}`,
					{ exposeToClient: false }
				);
			errorLogger.logError(utilityError.message);
			errorHandler.handleError({ error: utilityError });
			return [''];
		}
	}

	async function verifyBackupCode(
		id: string,
		inputCode: string
	): Promise<boolean> {
		try {
			validateDependencies(
				[
					{ name: 'id', instance: id },
					{ name: 'inputCode', instance: inputCode }
				],
				logger
			);

			const storedCodes = await getBackupCodesFromDatabase(id);

			if (!storedCodes || storedCodes.length === 0) {
				logger.logInfo(`No backup codes found for user ${id}`);
				const message = 'No backup codes found';
				const clientAuthError =
					new errorHandler.ErrorClasses.ClientAuthenticationError(
						`Client Auth Error: No backup codes found for user ${id}\n${Error instanceof Error ? Error.message : Error}`,
						{ originalError: Error || 'Unknown error occurred' }
					);
				errorHandler.sendClientErrorResponse({ message, res });
				errorLogger.logError(clientAuthError.message);
				errorHandler.handleError({ error: clientAuthError });
				return false;
			}

			for (const storedCode of storedCodes) {
				const match = await bcrypt.compare(inputCode, storedCode.code);
				if (match && !storedCode.used) {
					storedCode.used = true;
					await updateBackupCodesInDatabase(id, storedCodes);
					return true;
				} else {
					const message = 'Invalid backup code';
					const clientAuthError =
						new errorHandler.ErrorClasses.ClientAuthenticationError(
							`Client Auth Error: Invalid backup code for user ${id}\n${Error instanceof Error ? Error.message : Error}`,
							{ originalError: Error || 'Unknown error occurred' }
						);
					errorHandler.sendClientErrorResponse({ message, res });
					errorLogger.logError(clientAuthError.message);
					errorHandler.handleError({ error: clientAuthError });
					return false;
				}
			}

			logger.logDebug(`Backup code verification failed for user ${id}`);
			return false;
		} catch (utilError) {
			const utilityError =
				new errorHandler.ErrorClasses.DependencyErrorRecoverable(
					`Error occured with dependency 'verifyBackupCode()': Failed to verify backup code for user ${id}: ${utilError instanceof Error ? utilError.message : utilError}`,
					{ originalError: utilError }
				);
			errorLogger.logError(utilityError.message);
			errorHandler.handleError({ error: utilityError });
			return false;
		}
	}

	async function saveBackupCodesToDatabase(
		id: string,
		backupCodes: BackupCodeInterface[]
	): Promise<void> {
		try {
			validateDependencies(
				[
					{ name: 'id', instance: id },
					{ name: 'backupCodes', instance: backupCodes }
				],
				logger
			);

			const user = await UserMfa.findByPk(id);

			if (!user) {
				const clientAuthError =
					new errorHandler.ErrorClasses.ClientAuthenticationError(
						'User with ID not found.',
						{
							orginalError: String(Error),
							message: `Client Auth Error: User with ID ${id} not found.`
						}
					);
				errorLogger.logError(clientAuthError.message);
				errorHandler.sendClientErrorResponse({
					message: clientAuthError.message,
					res
				});
				return;
			}

			const backupCodesAsStrings = backupCodes.map(
				codeObj => codeObj.code
			);
			user.backupCodes = backupCodesAsStrings;
			await user.save();
		} catch (utilError) {
			const utility: string = 'saveBackupCodesToDatabase()';
			const utilityError =
				new errorHandler.ErrorClasses.UtilityErrorRecoverable(
					`Error occured with dependency ${utility}. Failed to save backup codes for user ${id}: ${utilError instanceof Error ? utilError.message : utilError}`,
					{ exposeToClient: false }
				);
			errorLogger.logError(utilityError.message);
			errorHandler.handleError({ error: utilityError });
		}
	}

	async function getBackupCodesFromDatabase(
		id: string
	): Promise<BackupCodeInterface[] | undefined> {
		try {
			validateDependencies([{ name: 'id', instance: id }], logger);

			const user = await UserMfa.findByPk(id);

			if (!user) {
				const clientAuthError =
					new errorHandler.ErrorClasses.ClientAuthenticationError(
						`User not found.`,
						{
							exposeToClient: true,
							message: `Client Auth Error: User with ID ${id} not found.`
						}
					);
				errorLogger.logError(clientAuthError.message);
				errorHandler.sendClientErrorResponse({
					message: clientAuthError.message,
					res
				});
				return undefined;
			}
			const backupCodes = user.backupCodes;
			if (!backupCodes) {
				const clientAuthError =
					new errorHandler.ErrorClasses.ClientAuthenticationError(
						`No backup codes found`,
						{
							message: `Client Auth Error: No backup codes found for user ${id}`
						}
					);
				errorLogger.logError(clientAuthError.message);
				errorHandler.sendClientErrorResponse({
					message: clientAuthError.message,
					res
				});
				return;
			}

			return backupCodes.map(
				(code: string) => ({ code, used: false }) as BackupCodeInterface
			);
		} catch (utilError) {
			const utility: string = 'getBackupCodesFromDatabase()';
			const utilityError =
				new errorHandler.ErrorClasses.UtilityErrorRecoverable(
					`Error occured with dependency ${utility}. Failed to get backup codes for user ${id}: ${utilError instanceof Error ? utilError.message : utilError}`,
					{ exposeToClient: false }
				);
			errorLogger.logError(utilityError.message);
			errorHandler.handleError({ error: utilityError });
			return [];
		}
	}

	async function updateBackupCodesInDatabase(
		id: string,
		backupCodes: BackupCodeInterface[]
	): Promise<void> {
		try {
			validateDependencies(
				[
					{ name: 'id', instance: id },
					{ name: 'backupCodes', instance: backupCodes }
				],
				logger
			);

			const user = await UserMfa.findByPk(id);

			if (!user) {
				const clientAuthError =
					new errorHandler.ErrorClasses.ClientAuthenticationError(
						`Client Auth Error: User with ID ${id} not found.`
					);
				errorLogger.logError(clientAuthError.message);
				errorHandler.sendClientErrorResponse({
					message: clientAuthError.message,
					res
				});
				return;
			}

			const backupCodesAsStrings = backupCodes.map(
				codeObj => codeObj.code
			);
			user.backupCodes = backupCodesAsStrings;
			await user.save();
		} catch (utilError) {
			const utility: string = 'updateBackupCodesInDatabase()';
			const utilityError =
				new errorHandler.ErrorClasses.UtilityErrorRecoverable(
					`Error occured with dependency ${utility}. Failed to update backup codes for user ${id}: ${utilError instanceof Error ? utilError.message : utilError}`,
					{ exposeToClient: false }
				);
			errorLogger.logError(utilityError.message);
			errorHandler.handleError({ error: utilityError });
		}
	}

	return {
		generateBackupCodes,
		verifyBackupCode,
		saveBackupCodesToDatabase,
		getBackupCodesFromDatabase,
		updateBackupCodesInDatabase
	};
}
