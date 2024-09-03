import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { Logger } from 'winston';
import { ModelStatic } from 'sequelize';
import { UserMfaInstance } from '../../models/UserMfa';

interface BackupCode {
	code: string;
	used: boolean;
}

interface BackupCodeServiceDependencies {
	logger: Logger;
	UserMfa: ModelStatic<UserMfaInstance>;
	crypto: typeof crypto;
	bcrypt: typeof bcrypt;
}

export default function createBackupCodeService({
	logger,
	UserMfa
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
	// generate backup codes
	async function generateBackupCodes(id: string): Promise<string[]> {
		try {
			const backupCodes: BackupCode[] = [];
			for (let i = 0; i < 16; i++) {
				const code = crypto.randomBytes(4).toString('hex'); // 8-character hex code
				const hashedCode = await bcrypt.hash(code, 10);
				backupCodes.push({ code: hashedCode, used: false });
			}

			await saveBackupCodesToDatabase(id, backupCodes);

			return backupCodes.map(backupCode => backupCode.code);
		} catch (err) {
			logger.error(
				`Error generating backup codes for user ${id}: ${
					err instanceof Error ? err.message : String(err)
				}`
			);
			throw new Error(
				`Failed to generate backup codes. Please try again.`
			);
		}
	}

	// verify a backup code
	async function verifyBackupCode(
		id: string,
		inputCode: string
	): Promise<boolean> {
		try {
			const storedCodes = await getBackupCodesFromDatabase(id);

			if (!storedCodes) {
				logger.warn(`No backup codes found for user ${id}`);
				return false;
			}

			for (let i = 0; i < storedCodes.length; i++) {
				const match = await bcrypt.compare(
					inputCode,
					storedCodes[i].code
				);
				if (match && !storedCodes[i].used) {
					storedCodes[i].used = true;
					await updateBackupCodesInDatabase(id, storedCodes); // mark the code as used
					return true;
				}
			}

			logger.warn(`Backup code verification failed for user ${id}`);
			return false;
		} catch (err) {
			logger.error(
				`Error verifying backup code for user ${id}: ${
					err instanceof Error ? err.message : String(err)
				}`
			);
			throw new Error('Failed to verify backup code. Please try again.');
		}
	}

	// save backup codes to the database
	async function saveBackupCodesToDatabase(
		id: string,
		backupCodes: BackupCode[]
	): Promise<void> {
		try {
			const user = await UserMfa.findByPk(id);

			if (!user) {
				logger.error(`User with ID ${id} not found.`);
				throw new Error('User not found');
			}

			// map the codes element of backupCodes to an array of strings
			const backupCodesAsStrings = backupCodes.map(
				codeObj => codeObj.code
			);

			user.backupCodes = backupCodesAsStrings;
			await user.save();
		} catch (err) {
			logger.error(
				`Error saving backup codes to database for user ${id}: ${
					err instanceof Error ? err.message : String(err)
				}`
			);
			throw new Error(
				`Failed to save backup codes. Please try again later.`
			);
		}
	}

	// get backup codes from the database
	async function getBackupCodesFromDatabase(
		id: string
	): Promise<BackupCode[] | undefined> {
		try {
			const user = await UserMfa.findByPk(id);

			if (!user) {
				logger.error(`User with ID ${id} not found.`);
				return undefined;
			}

			// assume user.backupCodes is a string[] or null, convert it to BackupCode[] or undefined
			const backupCodes = user.backupCodes;

			if (!backupCodes) {
				logger.warn(`No backup codes found for user ${id}`);
				return undefined;
			}

			// convert string[] to BackupCode[]
			return backupCodes.map(
				code => ({ code, used: false }) as BackupCode
			);
		} catch (err) {
			logger.error(
				`Error fetching backup codes from database for user ${id}: ${
					err instanceof Error ? err.message : String(err)
				}`
			);
			throw new Error(
				`Failed to retrieve backup codes. Please try again later.`
			);
		}
	}

	// update backup codes in the database
	async function updateBackupCodesInDatabase(
		id: string,
		backupCodes: BackupCode[]
	): Promise<void> {
		try {
			const user = await UserMfa.findByPk(id);

			if (!user) {
				logger.error(`User with ID ${id} not found.`);
				throw new Error('User not found');
			}

			// map the codes element of backupCodes to an array of strings
			const backupCodesAsStrings = backupCodes.map(
				codeObj => codeObj.code
			);

			user.backupCodes = backupCodesAsStrings;
			await user.save();
		} catch (err) {
			logger.error(
				`Error updating backup codes in database for user ${id}: ${
					err instanceof Error ? err.message : String(err)
				}`
			);
			throw new Error(
				`Failed to update backup codes. Please try again later.`
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
