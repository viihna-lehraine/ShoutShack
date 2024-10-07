import { AccessControlMiddlewareFactory } from './subfactories/AccessControlMiddlewareFactory';
import { AuthControllerFactory } from './subfactories/AuthControllerFactory';
import { AuthServiceFactory } from './subfactories/AuthServiceFactory';
import { CacheLayerServiceFactory } from './subfactories/CacheLayerServiceFactory';
import { DatabaseControllerFactory } from './subfactories/DatabaseControllerFactory';
import { ErrorHandlerServiceFactory } from './subfactories/ErrorHandlerServiceFactory';
import { EnvConfigServiceFactory } from './subfactories/EnvConfigServiceFactory';
import { GatekeeperServiceFactory } from './subfactories/GatekeeperServiceFactory';
import { HealthCheckServiceFactory } from './subfactories/HealthCheckServiceFactory';
import { HTTPSServerFactory } from './subfactories/HTTPSServerFactory';
import { LoggerServiceFactory } from './subfactories/LoggerServiceFactory';
import { MiddlewareFactory } from './subfactories/MiddlewareFactory';
import { MiddlewareStatusServiceFactory } from './subfactories/MiddlewareStatusServiceFactory';
import { PassportServiceFactory } from './subfactories/PassportServiceFactory';
import { PreHTTPSFactory } from './subfactories/PreHTTPSFactory';
import { ResourceManagerFactory } from './subfactories/ResourceManagerFactory';
import { RootMiddlewareFactory } from './subfactories/RootMiddlewareFactory';
import { RouterFactory } from './subfactories/RouterFactory';
import { UserControllerFactory } from './subfactories/UserControllerFactory';
import { VaultServiceFactory } from './subfactories/VaultServiceFactory';
import {
	AccessControlMiddlewareServiceInterface,
	AuthControllerInterface,
	BackupCodeServiceInterface,
	BaseRouterInterface,
	CacheServiceInterface,
	CSRFMiddlewareServiceInterface,
	DatabaseControllerInterface,
	EmailMFAServiceInterface,
	EnvConfigServiceInterface,
	ErrorHandlerServiceInterface,
	ErrorLoggerServiceInterface,
	FIDO2ServiceInterface,
	GatekeeperServiceInterface,
	HealthCheckServiceInterface,
	HelmetMiddlewareServiceInterface,
	HTTPSServerInterface,
	JWTAuthMiddlewareServiceInterface,
	JWTServiceInterface,
	AppLoggerServiceInterface,
	MailerServiceInterface,
	MiddlewareStatusServiceInterface,
	MulterUploadServiceInterface,
	PassportAuthMiddlewareServiceInterface,
	PassportServiceInterface,
	PasswordServiceInterface,
	RedisServiceInterface,
	ResourceManagerInterface,
	RootMiddlewareServiceInterface,
	TOTPServiceInterface,
	UserControllerInterface,
	VaultServiceInterface,
	YubicoOTPServiceInterface
} from '../interfaces/main';

export class ServiceFactory {
	public static async getAccessControlMiddlewareService(): Promise<AccessControlMiddlewareServiceInterface> {
		return AccessControlMiddlewareFactory.getAccessControlMiddlewareService();
	}

	public static async getAuthController(): Promise<AuthControllerInterface> {
		return AuthControllerFactory.getAuthController();
	}

	public static async getBackupCodeService(): Promise<BackupCodeServiceInterface> {
		return AuthServiceFactory.getBackupCodeService();
	}

	public static async getBaseRouter(): Promise<BaseRouterInterface> {
		return RouterFactory.getBaseRouter();
	}

	public static async getCacheService(): Promise<CacheServiceInterface> {
		return CacheLayerServiceFactory.getCacheService();
	}

	public static async getCSRFMiddlewareService(): Promise<CSRFMiddlewareServiceInterface> {
		return MiddlewareFactory.getCSRFMiddleware();
	}

	public static async getDatabaseController(): Promise<DatabaseControllerInterface> {
		return DatabaseControllerFactory.getDatabaseController();
	}

	public static async getEmailMFAService(): Promise<EmailMFAServiceInterface> {
		return AuthServiceFactory.getEmailMFAService();
	}

	public static async getEnvConfigService(): Promise<EnvConfigServiceInterface> {
		return EnvConfigServiceFactory.getEnvConfigService();
	}

	public static async getErrorHandlerService(): Promise<ErrorHandlerServiceInterface> {
		return ErrorHandlerServiceFactory.getErrorHandlerService();
	}

	public static async getErrorLoggerService(): Promise<ErrorLoggerServiceInterface> {
		return LoggerServiceFactory.getErrorLoggerService();
	}

	public static async getFIDO2Service(): Promise<FIDO2ServiceInterface> {
		return AuthServiceFactory.getFIDO2Service();
	}

	public static async getGatekeeperService(): Promise<GatekeeperServiceInterface> {
		return GatekeeperServiceFactory.getGatekeeperService();
	}

	public static async getHealthCheckService(): Promise<HealthCheckServiceInterface> {
		return HealthCheckServiceFactory.getHealthCheckService();
	}

	public static async getHelmetMiddlewareService(): Promise<HelmetMiddlewareServiceInterface> {
		return MiddlewareFactory.getHelmetMiddleware();
	}

	public static async getHTTPSServer(): Promise<HTTPSServerInterface> {
		return HTTPSServerFactory.getHTTPSServer();
	}

	public static async getJWTAuthMiddlewareService(): Promise<JWTAuthMiddlewareServiceInterface> {
		return MiddlewareFactory.getJWTAuthMiddleware();
	}

	public static async getJWTService(): Promise<JWTServiceInterface> {
		return AuthServiceFactory.getJWTService();
	}

	public static async getLoggerService(): Promise<AppLoggerServiceInterface> {
		return LoggerServiceFactory.getLoggerService();
	}

	public static async getMailerService(): Promise<MailerServiceInterface> {
		return PreHTTPSFactory.getMailerService();
	}

	public static async getMiddlewareStatusService(): Promise<MiddlewareStatusServiceInterface> {
		return MiddlewareStatusServiceFactory.getMiddlewareStatusService();
	}

	public static async getMulterUploadService(): Promise<MulterUploadServiceInterface> {
		return PreHTTPSFactory.getMulterUploadService();
	}

	public static async getPassportService(): Promise<PassportServiceInterface> {
		return PassportServiceFactory.getPassportService();
	}

	public static async getPassportAuthMiddlewareService(): Promise<PassportAuthMiddlewareServiceInterface> {
		return MiddlewareFactory.getPassportAuthMiddleware();
	}

	public static async getPasswordService(): Promise<PasswordServiceInterface> {
		return AuthServiceFactory.getPasswordService();
	}

	public static async getRedisService(): Promise<RedisServiceInterface> {
		return CacheLayerServiceFactory.getRedisService();
	}

	public static async getResourceManager(): Promise<ResourceManagerInterface> {
		return ResourceManagerFactory.getResourceManager();
	}

	public static async getRootMiddlewareService(): Promise<RootMiddlewareServiceInterface> {
		return RootMiddlewareFactory.getRootMiddleware();
	}

	public static async getTOTPService(): Promise<TOTPServiceInterface> {
		return AuthServiceFactory.getTOTPService();
	}

	public static async getUserController(): Promise<UserControllerInterface> {
		return UserControllerFactory.getUserController();
	}

	public static async getVaultService(): Promise<VaultServiceInterface> {
		return VaultServiceFactory.getVaultService();
	}

	public static async getYubicoOTPService(): Promise<YubicoOTPServiceInterface> {
		return AuthServiceFactory.getYubicoOTPService();
	}
}
