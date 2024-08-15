import bcrypt from 'bcrypt';
import crypto from 'crypto';
import setupLogger from '../../index.js';
import { User } from '../../models/User.js';

// Generate Backup Coedes
async function generateBackupCodes(userId) {
    const backupCodes = [];
    for (let i = 0; i < 16; i++) {
        const code = crypto.randomBytes(4).toString(hex); // 8-character hexcode
        const hashedCode = await bcrypt.hash(code, 10);
        backupCodes.push({ code: hashedCode, used: false });
    }

    // store backupCodes in the database associated with the userId
    await saveBackupCodesToDatabase(userId, backupCodes);
    return backupCodes.map(code => code.code); // return the plain codes to the user
}

// Verify a Backup Code
async function verifyBackupCode(userId, inputCode) {
    const storedCodes = await getBackupCodesFromDatabase(userId);
    for (let i = 0; i < storedCodes.length; i++) {
        const match = await bcrypt.compare(inputCode, storedCodes[i].code);
        if (match && !storedCodes[i].used) {
            storedCodes[i].used = true;
            await updateBackupCodesInDatabase(userId, storedCodes); // mark the code as used
            return true; // successful verification
        }
    }
    
    return false; // verification failed
}

// Save backup codes to the database
async function saveBackupCodesToDatabase(userId, backupCodes) {
    const logger = await setupLogger();

    try {
        const user = await User.findByPk(userId); // may need to be adjusted based on the ORM
        if (!user) throw new Error('User not found');

        user.backupCodes = backupCodes;
        await user.save();
    } catch (err) {
        logger.error('Error saving backup codes to database: ', err);
        throw new Error('Failed to save backup codes to database');
    }
}

// Get backup codes from the database
async function getBackupCodesFromDatabase(userId) {
    const logger = await setupLogger(); 

    try {
        const user = await User.findByPk(userId); // may need to be adjusted based on the ORM
        if (!user) throw new Error('User not found');

        return user.backupCodes;
    } catch (err) {
        logger.error('Error fetching backup codes from database: ', err);
        throw new Error('Failed to retrieve backup codes from database');
    }
}

// Update backup codes in the database
async function updateBackupCodesInDatabase(userId, backupCodes) {
    const logger = await setupLogger();

    try {
        const user = await User.findByPk(userId, backupCodes); // may need to be adjusted based on the ORM
        if (!user) throw new Error('User not found');

        user.backupCodes = backupCodes;
        await user.save();
    } catch (err) {
        logger.error('Error updating backupcodes in database: ', err);
        throw new Error('Failed to update backup codes in database');
    }
}

export {
    generateBackupCodes,
    getBackupCodesFromDatabase,
    saveBackupCodesToDatabase,
    verifyBackupCode
};