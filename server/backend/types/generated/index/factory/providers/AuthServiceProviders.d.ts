import { BackupCodeServiceInterface, EmailMFAServiceInterface, FIDO2ServiceInterface, JWTServiceInterface, PasswordServiceInterface, TOTPServiceInterface, YubicoOTPServiceInterface } from '../../interfaces/main';
export declare class BackupCodeServiceProvider {
    private static instance;
    static getBackupCodeService(): Promise<BackupCodeServiceInterface>;
}
export declare class EmailMFAServiceProvider {
    private static instance;
    static getEmailMFAService(): Promise<EmailMFAServiceInterface>;
}
export declare class FIDO2ServiceProvider {
    private static instance;
    static getFIDO2Service(): Promise<FIDO2ServiceInterface>;
}
export declare class JWTServiceProvider {
    private static instance;
    static getJWTService(): Promise<JWTServiceInterface>;
}
export declare class PasswordServiceProvider {
    private static instance;
    static getPasswordService(): Promise<PasswordServiceInterface>;
}
export declare class TOTPServiceProvider {
    private static instance;
    static getTOTPService(): Promise<TOTPServiceInterface>;
}
export declare class YubicoOTPServiceProvider {
    private static instance;
    static getYubicoOTPService(): Promise<YubicoOTPServiceInterface>;
}
//# sourceMappingURL=AuthServiceProviders.d.ts.map