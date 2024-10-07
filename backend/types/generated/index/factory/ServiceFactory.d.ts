import * as Interfaces from '../interfaces/main';
export declare class ServiceFactory {
    static getAccessControlMiddlewareService(): Promise<Interfaces.AccessControlMiddlewareServiceInterface>;
    static getAuthController(): Promise<Interfaces.AuthControllerInterface>;
    static getBackupCodeService(): Promise<Interfaces.BackupCodeServiceInterface>;
    static getBaseRouter(): Promise<Interfaces.BaseRouterInterface>;
    static getCacheService(): Promise<Interfaces.CacheServiceInterface>;
    static getCSRFMiddlewareService(): Promise<Interfaces.CSRFMiddlewareServiceInterface>;
    static getDatabaseController(): Promise<Interfaces.DatabaseControllerInterface>;
    static getEmailMFAService(): Promise<Interfaces.EmailMFAServiceInterface>;
    static getEnvConfigService(): Promise<Interfaces.EnvConfigServiceInterface>;
    static getErrorHandlerService(): Promise<Interfaces.ErrorHandlerServiceInterface>;
    static getErrorLoggerService(): Promise<Interfaces.ErrorLoggerServiceInterface>;
    static getFIDO2Service(): Promise<Interfaces.FIDO2ServiceInterface>;
    static getGatekeeperService(): Promise<Interfaces.GatekeeperServiceInterface>;
    static getHealthCheckService(): Promise<Interfaces.HealthCheckServiceInterface>;
    static getHelmetMiddlewareService(): Promise<Interfaces.HelmetMiddlewareServiceInterface>;
    static getHTTPSServer(): Promise<Interfaces.HTTPSServerInterface>;
    static getJWTAuthMiddlewareService(): Promise<Interfaces.JWTAuthMiddlewareServiceInterface>;
    static getJWTService(): Promise<Interfaces.JWTServiceInterface>;
    static getLoggerService(): Promise<Interfaces.AppLoggerServiceInterface>;
    static getMailerService(): Promise<Interfaces.MailerServiceInterface>;
    static getMiddlewareStatusService(): Promise<Interfaces.MiddlewareStatusServiceInterface>;
    static getMulterUploadService(): Promise<Interfaces.MulterUploadServiceInterface>;
    static getPassportService(): Promise<Interfaces.PassportServiceInterface>;
    static getPassportAuthMiddlewareService(): Promise<Interfaces.PassportAuthMiddlewareServiceInterface>;
    static getPasswordService(): Promise<Interfaces.PasswordServiceInterface>;
    static getRedisService(): Promise<Interfaces.RedisServiceInterface>;
    static getResourceManager(): Promise<Interfaces.ResourceManagerInterface>;
    static getRootMiddlewareService(): Promise<Interfaces.RootMiddlewareServiceInterface>;
    static getTOTPService(): Promise<Interfaces.TOTPServiceInterface>;
    static getUserController(): Promise<Interfaces.UserControllerInterface>;
    static getVaultService(): Promise<Interfaces.VaultServiceInterface>;
    static getYubicoOTPService(): Promise<Interfaces.YubicoOTPServiceInterface>;
}
//# sourceMappingURL=ServiceFactory.d.ts.map