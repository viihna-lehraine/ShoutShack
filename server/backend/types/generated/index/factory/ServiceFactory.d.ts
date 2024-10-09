import { AccessControlMiddlewareServiceInterface, AuthControllerInterface, BackupCodeServiceInterface, BaseRouterInterface, CacheServiceInterface, CSRFMiddlewareServiceInterface, DatabaseControllerInterface, EmailMFAServiceInterface, EnvConfigServiceInterface, ErrorHandlerServiceInterface, ErrorLoggerServiceInterface, FIDO2ServiceInterface, GatekeeperServiceInterface, HealthCheckServiceInterface, HelmetMiddlewareServiceInterface, HTTPSServerInterface, JWTAuthMiddlewareServiceInterface, JWTServiceInterface, AppLoggerServiceInterface, MailerServiceInterface, MiddlewareStatusServiceInterface, MulterUploadServiceInterface, PassportAuthMiddlewareServiceInterface, PassportServiceInterface, PasswordServiceInterface, ResourceManagerInterface, RootMiddlewareServiceInterface, TOTPServiceInterface, UserControllerInterface, VaultServiceInterface, YubicoOTPServiceInterface } from '../interfaces/main';
export declare class ServiceFactory {
    static getAccessControlMiddlewareService(): Promise<AccessControlMiddlewareServiceInterface>;
    static getAuthController(): Promise<AuthControllerInterface>;
    static getBackupCodeService(): Promise<BackupCodeServiceInterface>;
    static getBaseRouter(): Promise<BaseRouterInterface>;
    static getCacheService(): Promise<CacheServiceInterface>;
    static getCSRFMiddlewareService(): Promise<CSRFMiddlewareServiceInterface>;
    static getDatabaseController(): Promise<DatabaseControllerInterface>;
    static getEmailMFAService(): Promise<EmailMFAServiceInterface>;
    static getEnvConfigService(): Promise<EnvConfigServiceInterface>;
    static getErrorHandlerService(): Promise<ErrorHandlerServiceInterface>;
    static getErrorLoggerService(): Promise<ErrorLoggerServiceInterface>;
    static getFIDO2Service(): Promise<FIDO2ServiceInterface>;
    static getGatekeeperService(): Promise<GatekeeperServiceInterface>;
    static getHealthCheckService(): Promise<HealthCheckServiceInterface>;
    static getHelmetMiddlewareService(): Promise<HelmetMiddlewareServiceInterface>;
    static getHTTPSServer(): Promise<HTTPSServerInterface>;
    static getJWTAuthMiddlewareService(): Promise<JWTAuthMiddlewareServiceInterface>;
    static getJWTService(): Promise<JWTServiceInterface>;
    static getLoggerService(): Promise<AppLoggerServiceInterface>;
    static getMailerService(): Promise<MailerServiceInterface>;
    static getMiddlewareStatusService(): Promise<MiddlewareStatusServiceInterface>;
    static getMulterUploadService(): Promise<MulterUploadServiceInterface>;
    static getPassportService(): Promise<PassportServiceInterface>;
    static getPassportAuthMiddlewareService(): Promise<PassportAuthMiddlewareServiceInterface>;
    static getPasswordService(): Promise<PasswordServiceInterface>;
    static getResourceManager(): Promise<ResourceManagerInterface>;
    static getRootMiddlewareService(): Promise<RootMiddlewareServiceInterface>;
    static getTOTPService(): Promise<TOTPServiceInterface>;
    static getUserController(): Promise<UserControllerInterface>;
    static getVaultService(): Promise<VaultServiceInterface>;
    static getYubicoOTPService(): Promise<YubicoOTPServiceInterface>;
}
//# sourceMappingURL=ServiceFactory.d.ts.map