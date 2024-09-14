import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { Logger } from '../utils/logger';
import { UserMfa } from '../models/UserMfaModelFile';
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
export default function createBackupCodeService({ logger, UserMfa, bcrypt, crypto }: BackupCodeServiceDependencies): {
    generateBackupCodes: (id: string) => Promise<string[]>;
    verifyBackupCode: (id: string, inputCode: string) => Promise<boolean>;
    saveBackupCodesToDatabase: (id: string, backupCodes: BackupCode[]) => Promise<void>;
    getBackupCodesFromDatabase: (id: string) => Promise<BackupCode[] | undefined>;
    updateBackupCodesInDatabase: (id: string, backupCodes: BackupCode[]) => Promise<void>;
};
export {};
//# sourceMappingURL=backupCodeUtil.d.ts.map
