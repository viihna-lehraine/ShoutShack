import bcrypt from 'bcrypt';
import crypto from 'crypto';
import setupLogger from '../../middleware/logger';
import UserMfaModelPromise from 'ts/models/UserMfa';

interface BackupCode {
	code: string;
	used: boolean;
}

// Generate Backup Coedes
async function generateBackupCodes(id: string): Promise<string[]> {
	let backupCodes: BackupCode[] = [];
	for (let i = 0; i < 16; i++) {
		const code = crypto.randomBytes(4).toString('hex'); // 8-character hex code
		const hashedCode = await bcrypt.hash(code, 10);
		backupCodes.push({ code: hashedCode, used: false });
	}

	// store backupCodes in the database associated with the user's id
	await saveBackupCodesToDatabase(id, backupCodes);

	// return only the plain codes as strings
	return backupCodes.map((backupCode) => backupCode.code);
}

// Verify a Backup Code
async function verifyBackupCode(
	id: string,
	inputCode: string
): Promise<boolean> {
	await UserMfaModelPromise; // await the UserMfa model when needed
	let storedCodes = await getBackupCodesFromDatabase(id);

	if (storedCodes) {
		for (let i = 0; i < storedCodes.length; i++) {
			const match = await bcrypt.compare(inputCode, storedCodes[i].code);
			if (match && !storedCodes[i].used) {
				storedCodes[i].used = true;
				await updateBackupCodesInDatabase(id, storedCodes); // mark the code as used
				return true; // successful verification
			}
		}
	} else {
		console.error('No backup codes found for user');
		return false; // no backup codes found
	}

	return false; // verification failed
}

// Save backup codes to the database
async function saveBackupCodesToDatabase(
	id: string,
	backupCodes: BackupCode[]
): Promise<void> {
	let logger = await setupLogger();
	let UserfMfa = await UserMfaModelPromise; // await the UserMfa model when needed

	try {
		const user = await UserfMfa.findByPk(id); // find user by primary key
		if (!user) throw new Error('User not found');

		// map the codes element of backupCodes to an array of strings
		const backupCodesAsStrings = backupCodes.map((codeObj) => codeObj.code);

		// assign the array of strings to user.backupCodes
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
	let logger = await setupLogger();
	let UserMfa = await UserMfaModelPromise; // await the User model when needed

	try {
		const user = await UserMfa.findByPk(id); // find user by primary key
		if (!user) throw new Error('User not found');

		// assume user.backupCodes is a string[] or null, convert it to BackuopCode[] or undefined
		const backupCodes = user.backupCodes as string[] | null;

		if (backupCodes === null) {
			return undefined; // *DEV-NOTE* probably need to configure this later
		}

		// convert string[] to BackupCode[]
		return backupCodes.map((code) => ({ code, used: false }) as BackupCode);
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
	let logger = await setupLogger();
	let UserMfa = await UserMfaModelPromise; // await the UserMfa model when needed

	try {
		const user = await UserMfa.findByPk(id); // find user by primary key
		if (!user) throw new Error('User not found');

		// map the codes element of backupCodes to an array of strings
		let backupCodesAsStrings = backupCodes.map((codeObj) => codeObj.code);

		// assign the array of strings to user.backupCodes
		user.backupCodes = backupCodesAsStrings;
		await user.save();
	} catch (err) {
		logger.error('Error updating backup codes in database: ', err);
		throw new Error('Failed to update backup codes in database');
	}
}

export {
	generateBackupCodes,
	getBackupCodesFromDatabase,
	saveBackupCodesToDatabase,
	verifyBackupCode
};
