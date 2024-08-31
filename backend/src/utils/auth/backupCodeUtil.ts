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
	// Generate Backup Codes
	async function generateBackupCodes(id: string): Promise<string[]> {
		const backupCodes: BackupCode[] = [];
		for (let i = 0; i < 16; i++) {
			const code = crypto.randomBytes(4).toString('hex'); // 8-character hex code
			const hashedCode = await bcrypt.hash(code, 10);
			backupCodes.push({ code: hashedCode, used: false });
		}

		// Store backup codes in the database associated with the user's id
		await saveBackupCodesToDatabase(id, backupCodes);

		// Return only the plain codes as strings
		return backupCodes.map(backupCode => backupCode.code);
	}

	// Verify a Backup Code
	async function verifyBackupCode(
		id: string,
		inputCode: string
	): Promise<boolean> {
		const storedCodes = await getBackupCodesFromDatabase(id);

		if (storedCodes) {
			for (let i = 0; i < storedCodes.length; i++) {
				const match = await bcrypt.compare(
					inputCode,
					storedCodes[i].code
				);
				if (match && !storedCodes[i].used) {
					storedCodes[i].used = true;
					await updateBackupCodesInDatabase(id, storedCodes); // Mark the code as used
					return true; // Successful verification
				}
			}
		} else {
			logger.error('No backup codes found for user');
			return false; // No backup codes found
		}

		return false; // Verification failed
	}

	// Save backup codes to the database
	async function saveBackupCodesToDatabase(
		id: string,
		backupCodes: BackupCode[]
	): Promise<void> {
		try {
			const user = (await UserMfa.findByPk(id)) as UserMfaInstance | null; // Find user by primary key
			if (!user) throw new Error('User not found');

			// Map the codes element of backupCodes to an array of strings
			const backupCodesAsStrings = backupCodes.map(
				codeObj => codeObj.code
			);

			// Assign the array of strings to user.backupCodes
			user.backupCodes = backupCodesAsStrings;
			await user.save();
		} catch (err) {
			logger.error('Error saving backup codes to database: ', err);
			throw new Error('Failed to save backup codes to database');
		}
	}

	// Get backup codes from the database
	async function getBackupCodesFromDatabase(
		id: string
	): Promise<BackupCode[] | undefined> {
		try {
			const user = (await UserMfa.findByPk(id)) as UserMfaInstance | null; // Find user by primary key
			if (!user) throw new Error('User not found');

			// Assume user.backupCodes is a string[] or null, convert it to BackupCode[] or undefined
			const backupCodes = user.backupCodes;

			if (backupCodes === null) {
				return undefined; // Handle this scenario as necessary
			}

			// Convert string[] to BackupCode[]
			return backupCodes.map(
				code => ({ code, used: false }) as BackupCode
			);
		} catch (err) {
			logger.error('Error fetching backup codes from database: ', err);
			throw new Error('Failed to retrieve backup codes from database');
		}
	}

	// Update backup codes in the database
	async function updateBackupCodesInDatabase(
		id: string,
		backupCodes: BackupCode[]
	): Promise<void> {
		try {
			const user = (await UserMfa.findByPk(id)) as UserMfaInstance | null; // Find user by primary key
			if (!user) throw new Error('User not found');

			// Map the codes element of backupCodes to an array of strings
			const backupCodesAsStrings = backupCodes.map(
				codeObj => codeObj.code
			);

			// Assign the array of strings to user.backupCodes
			user.backupCodes = backupCodesAsStrings;
			await user.save();
		} catch (err) {
			logger.error('Error updating backup codes in database: ', err);
			throw new Error('Failed to update backup codes in database');
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
