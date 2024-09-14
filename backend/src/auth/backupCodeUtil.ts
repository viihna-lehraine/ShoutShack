import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { Logger } from '../utils/logger';
import { UserMfa } from '../models/UserMfaModelFile';
import { processError } from '../utils/processError';
import { validateDependencies } from '../utils/validateDependencies';

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

	// generate backup codes for a given user ID
	async function generateBackupCodes(id: string): Promise<string[]> {
		try {
			validateDependencies([{ name: 'id', instance: id }], logger);

			const backupCodes: BackupCode[] = [];
			for (let i = 0; i < 16; i++) {
				const code = crypto.randomBytes(4).toString('hex'); // Generate 8-character hex code
				const hashedCode = await bcrypt.hash(code, 10); // Hashing the backup code
				backupCodes.push({ code: hashedCode, used: false });
			}

			await saveBackupCodesToDatabase(id, backupCodes);

			return backupCodes.map(backupCode => backupCode.code);
		} catch (err) {
			processError(err, logger);
			throw new Error(
				'Failed to generate backup codes. Please try again.'
			);
		}
	}

	// verify a backup code for a given user
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

			if (!storedCodes) {
				logger.warn(`No backup codes found for user ${id}`);
				return false;
			}

			for (const storedCode of storedCodes) {
				const match = await bcrypt.compare(inputCode, storedCode.code); // Verify hashed code
				if (match && !storedCode.used) {
					storedCode.used = true; // Mark the code as used
					await updateBackupCodesInDatabase(id, storedCodes);
					return true;
				}
			}

			logger.warn(`Backup code verification failed for user ${id}`);
			return false;
		} catch (err) {
			processError(err, logger);
			throw new Error('Failed to verify backup code. Please try again.');
		}
	}

	// save generated backup codes to the database
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
				logger.error(`User with ID ${id} not found.`);
				throw new Error('User not found');
			}

			const backupCodesAsStrings = backupCodes.map(
				codeObj => codeObj.code
			);
			user.backupCodes = backupCodesAsStrings;
			await user.save();
		} catch (err) {
			processError(err, logger);
			throw new Error(
				'Failed to save backup codes. Please try again later.'
			);
		}
	}

	// retrieve backup codes from the database
	async function getBackupCodesFromDatabase(
		id: string
	): Promise<BackupCode[] | undefined> {
		try {
			validateDependencies([{ name: 'id', instance: id }], logger);

			const user = await UserMfa.findByPk(id);

			if (!user) {
				logger.error(`User with ID ${id} not found.`);
				return undefined;
			}

			const backupCodes = user.backupCodes;
			if (!backupCodes) {
				logger.warn(`No backup codes found for user ${id}`);
				return undefined;
			}

			// convert string array to BackupCode array
			return backupCodes.map(
				(code: string) => ({ code, used: false }) as BackupCode
			);
		} catch (err) {
			processError(err, logger);
			throw new Error(
				'Failed to retrieve backup codes. Please try again later.'
			);
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
				logger.error(`User with ID ${id} not found.`);
				throw new Error('User not found');
			}

			const backupCodesAsStrings = backupCodes.map(
				codeObj => codeObj.code
			);
			user.backupCodes = backupCodesAsStrings;
			await user.save();
		} catch (err) {
			processError(err, logger);
			throw new Error(
				'Failed to update backup codes. Please try again later.'
			);
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
