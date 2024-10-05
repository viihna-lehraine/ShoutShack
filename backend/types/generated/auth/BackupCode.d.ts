import { BackupCodeServiceInterface } from '../index/interfaces/services';
import { BackupCodeInterface } from '../index/interfaces/serviceComponents';
export declare class BackupCodeService implements BackupCodeServiceInterface {
    private static instance;
    private logger;
    private errorLogger;
    private errorHandler;
    private constructor();
    static getInstance(): Promise<BackupCodeService>;
    generateBackupCodes(id: string): Promise<string[]>;
    verifyBackupCode(id: string, inputCode: string): Promise<boolean>;
    saveBackupCodesToDatabase(id: string, backupCodes: BackupCodeInterface[]): Promise<void>;
    getBackupCodesFromDatabase(id: string): Promise<BackupCodeInterface[] | undefined>;
    updateBackupCodesInDatabase(id: string, backupCodes: BackupCodeInterface[]): Promise<void>;
    shutdown(): Promise<void>;
}
//# sourceMappingURL=BackupCode.d.ts.map