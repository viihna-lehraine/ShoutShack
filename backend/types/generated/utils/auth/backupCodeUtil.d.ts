import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { Logger } from 'winston';
import { ModelStatic } from 'sequelize';
import { UserMfaInstance } from '../models/UserMfa';
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
export default function createBackupCodeService({ logger, UserMfa }: BackupCodeServiceDependencies): {
    generateBackupCodes: (id: string) => Promise<string[]>;
    verifyBackupCode: (id: string, inputCode: string) => Promise<boolean>;
    saveBackupCodesToDatabase: (id: string, backupCodes: BackupCode[]) => Promise<void>;
    getBackupCodesFromDatabase: (id: string) => Promise<BackupCode[] | undefined>;
    updateBackupCodesInDatabase: (id: string, backupCodes: BackupCode[]) => Promise<void>;
};
export {};
//# sourceMappingURL=backupCodeUtil.d.ts.map
