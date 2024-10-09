import * as Interfaces from '../interfaces/main';
export declare class AuthServiceFactory {
    private static backupCodeService;
    private static emailMFAService;
    private static fido2Service;
    private static jwtService;
    private static passportService;
    private static passwordService;
    private static totpService;
    private static yubicoOTPService;
    static getBackupCodeService(): Promise<Interfaces.BackupCodeServiceInterface>;
    static getEmailMFAService(): Promise<Interfaces.EmailMFAServiceInterface>;
    static getFIDO2Service(): Promise<Interfaces.FIDO2ServiceInterface>;
    static getJWTService(): Promise<Interfaces.JWTServiceInterface>;
    static getPassportService(): Promise<Interfaces.PassportServiceInterface>;
    static getPasswordService(): Promise<Interfaces.PasswordServiceInterface>;
    static getTOTPService(): Promise<Interfaces.TOTPServiceInterface>;
    static getYubicoOTPService(): Promise<Interfaces.YubicoOTPServiceInterface>;
}
//# sourceMappingURL=AuthServiceFactory.d.ts.map
