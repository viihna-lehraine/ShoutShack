import * as Interfaces from '../../interfaces/main';
export declare class AuthServiceFactory {
    static getBackupCodeService(): Promise<Interfaces.BackupCodeServiceInterface>;
    static getEmailMFAService(): Promise<Interfaces.EmailMFAServiceInterface>;
    static getFIDO2Service(): Promise<Interfaces.FIDO2ServiceInterface>;
    static getJWTService(): Promise<Interfaces.JWTServiceInterface>;
    static getPasswordService(): Promise<Interfaces.PasswordServiceInterface>;
    static getTOTPService(): Promise<Interfaces.TOTPServiceInterface>;
    static getYubicoOTPService(): Promise<Interfaces.YubicoOTPServiceInterface>;
}
//# sourceMappingURL=AuthServiceFactory.d.ts.map