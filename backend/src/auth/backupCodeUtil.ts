import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { Response } from 'express';
import { errorClasses } from '../errors/errorClasses';
import { ErrorLogger } from '../errors/errorLogger';
import { processError, sendClientErrorResponse } from '../errors/processError';
import { UserMfa } from '../models/UserMfaModelFile';
import { Logger } from '../utils/logger';
import { validateDependencies } from '../utils/validateDependencies';

let res: Response;

interface BackupCode {
	code: string;
	used: boolean;
}

interface BackupCodeServiceDependencies {
	logger: Logger;
	UserMfa: typeof UserMfa;
	crypto: typeof crypto;
	bcrypt: typeof bcrypt;
}

export default function createBackupCodeService({
	logger,
	UserMfa,
	bcrypt,
	crypto
}: BackupCodeServiceDependencies): {
	generateBackupCodes: (id: string) => Promise<string[]>;
	verifyBackupCode: (id: string, inputCode: string) => Promise<boolean>;
	saveBackupCodesToDatabase: (
		id: string,
		backupCodes: BackupCode[]
	) => Promise<void>;
	getBackupCodesFromDatabase: (
		id: string
	) => Promise<BackupCode[] | undefined>;
	updateBackupCodesInDatabase: (
		id: string,
		backupCodes: BackupCode[]
	) => Promise<void>;
} {
	validateDependencies(
		[
			{ name: 'logger', instance: logger },
			{ name: 'UserMfa', instance: UserMfa },
			{ name: 'bcrypt', instance: bcrypt },
			{ name: 'crypto', instance: crypto }
		],
		logger
	);

	async function generateBackupCodes(id: string): Promise<string[]> {
		try {
			validateDependencies([{ name: 'id', instance: id }], logger);

			const backupCodes: BackupCode[] = [];
			for (let i = 0; i < 16; i++) {
				const code = crypto.randomBytes(4).toString('hex'); // generate 8-character hex code
				const hashedCode = await bcrypt.hash(code, 10);
				backupCodes.push({ code: hashedCode, used: false });
			}

			await saveBackupCodesToDatabase(id, backupCodes);

			return backupCodes.map(backupCode => backupCode.code);
		} catch (utilError) {
			const utility: string = 'generateBackupCodes()';
			const utilityError = new errorClasses.UtilityErrorRecoverable(
				`Error occured with dependency ${utility}. Failed to generate backup codes for user ${id}: ${utilError instanceof Error ? utilError.message : utilError}`,
				{ exposeToClient: false }
			);
			ErrorLogger.logError(utilityError, logger);
			processError(utilityError, logger);
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
				ErrorLogger.logInfo(
					`No backup codes found for user ${id}`,
					logger
				);
				const clientAuthError =
					new errorClasses.ClientAuthenticationError(
						`Unable to find backup codes`,
						{
							exposeToClient: true,
							message: `Client Auth Error: No backup codes found for user ${id}`
						}
					);
				sendClientErrorResponse(clientAuthError, res);
				return false;
			}

			for (const storedCode of storedCodes) {
				const match = await bcrypt.compare(inputCode, storedCode.code);
				if (match && !storedCode.used) {
					storedCode.used = true;
					await updateBackupCodesInDatabase(id, storedCodes);
					return true;
				} else {
					const clientAuthError =
						new errorClasses.ClientAuthenticationError(
							`Invalid backup code`,
							{
								exposeToClient: true,
								message: `Client Auth Error: Invalid backup code for user ${id}`
							}
						);
					sendClientErrorResponse(clientAuthError, res);
					return false;
				}
			}

			ErrorLogger.logWarning(
				`Backup code verification failed for user ${id}`,
				logger
			);
			return false;
		} catch (utilError) {
			const utility: string = 'verifyBackupCode()';
			const utilityError = new errorClasses.UtilityErrorRecoverable(
				`Error occured with dependency ${utility}. Failed to verify backup code for user ${id}: ${utilError instanceof Error ? utilError.message : utilError}`,
				{ exposeToClient: false }
			);
			ErrorLogger.logError(utilityError, logger);
			processError(utilityError, logger);
			return false;
		}
	}

	async function saveBackupCodesToDatabase(
		id: string,
		backupCodes: BackupCode[]
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
					new errorClasses.ClientAuthenticationError(
						'User with ID not found.',
						{
							exposeToClient: true,
							message: `Client Auth Error: User with ID ${id} not found.`
						}
					);
				ErrorLogger.logError(clientAuthError, logger);
				sendClientErrorResponse(clientAuthError, res);
				return;
			}

			const backupCodesAsStrings = backupCodes.map(
				codeObj => codeObj.code
			);
			user.backupCodes = backupCodesAsStrings;
			await user.save();
		} catch (utilError) {
			const utility: string = 'saveBackupCodesToDatabase()';
			const utilityError = new errorClasses.UtilityErrorRecoverable(
				`Error occured with dependency ${utility}. Failed to save backup codes for user ${id}: ${utilError instanceof Error ? utilError.message : utilError}`,
				{ exposeToClient: false }
			);
			ErrorLogger.logError(utilityError, logger);
			processError(utilityError, logger);
		}
	}

	async function getBackupCodesFromDatabase(
		id: string
	): Promise<BackupCode[] | undefined> {
		try {
			validateDependencies([{ name: 'id', instance: id }], logger);

			const user = await UserMfa.findByPk(id);

			if (!user) {
				const clientAuthError =
					new errorClasses.ClientAuthenticationError(
						`User not found.`,
						{
							exposeToClient: true,
							message: `Client Auth Error: User with ID ${id} not found.`
						}
					);
				ErrorLogger.logError(clientAuthError, logger);
				sendClientErrorResponse(clientAuthError, res);
				return undefined;
			}

			const backupCodes = user.backupCodes;
			if (!backupCodes) {
				const clientAuthError =
					new errorClasses.ClientAuthenticationError(
						`No backup codes found`,
						{
							exposeToClient: true,
							message: `Client Auth Error: No backup codes found for user ${id}`
						}
					);
				ErrorLogger.logError(clientAuthError, logger);
				sendClientErrorResponse(clientAuthError, res);
				return;
			}

			// convert string array to BackupCode array
			return backupCodes.map(
				(code: string) => ({ code, used: false }) as BackupCode
			);
		} catch (utilError) {
			const utility: string = 'getBackupCodesFromDatabase()';
			const utilityError = new errorClasses.UtilityErrorRecoverable(
				`Error occured with dependency ${utility}. Failed to get backup codes for user ${id}: ${utilError instanceof Error ? utilError.message : utilError}`,
				{ exposeToClient: false }
			);
			ErrorLogger.logError(utilityError, logger);
			processError(utilityError, logger);
			return [];
		}
	}

	async function updateBackupCodesInDatabase(
		id: string,
		backupCodes: BackupCode[]
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
					new errorClasses.ClientAuthenticationError(
						`User not found.`,
						{
							exposeToClient: true,
							message: `Client Auth Error: User with ID ${id} not found.`
						}
					);
				ErrorLogger.logError(clientAuthError, logger);
				sendClientErrorResponse(clientAuthError, res);
				return;
			}

			const backupCodesAsStrings = backupCodes.map(
				codeObj => codeObj.code
			);
			user.backupCodes = backupCodesAsStrings;
			await user.save();
		} catch (utilError) {
			const utility: string = 'updateBackupCodesInDatabase()';
			const utilityError = new errorClasses.UtilityErrorRecoverable(
				`Error occured with dependency ${utility}. Failed to update backup codes for user ${id}: ${utilError instanceof Error ? utilError.message : utilError}`,
				{ exposeToClient: false }
			);
			ErrorLogger.logError(utilityError, logger);
			processError(utilityError, logger);
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
