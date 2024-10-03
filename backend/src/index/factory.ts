import { Request, Response, NextFunction } from 'express';
import nodemailer from 'nodemailer';
import { createClient } from 'redis';
import app from 'express';
import { BackupCodeService } from '../auth/BackupCode';
import { MailerService } from '../services/Mailer';
import { EmailMFAService } from '../auth/EmailMfa';
import { RedisService } from '../services/Redis';
import { CacheService } from '../services/Cache';
import { blankRequest } from '../config/express';
import { validateDependencies } from '../utils/helpers';
import { AppLoggerService, ErrorLoggerService } from '../services/Logger';
import { AppLoggerServiceParameters } from './parameters';
import { GatekeeperService } from '../services/Gatekeeper';
import { JWTService } from '../auth/JWT';
import { DatabaseController } from '../controllers/DatabaseController';
import { ErrorHandlerService } from '../services/ErrorHandler';
import { FIDO2Service } from '../auth/FIDO2';
import { HelmetMiddlwareService } from '../middleware/Helmet';
import { HTTPSServer } from '../services/HTTPS';
import { MulterUploadService } from '../services/MulterUpload';
import { ResourceManager } from '../services/ResourceManager';
import { PassportService } from '../auth/Passport';
import { AccessControlMiddlewareService } from '../middleware/AccessControl';
import { PassportAuthMiddlewareService } from '../middleware/PassportAuth';
import { JWTAuthMiddlewareService } from '../middleware/JWTAuth';
import { PasswordService } from '../auth/Password';
import { UserController } from '../controllers/UserController';
import { TOTPService } from '../auth/TOTP';
import { YubicoOTPService } from '../auth/YubicoOTP';
import { CSRFMiddlewareService } from '../middleware/CSRF';
import { EnvConfigService } from '../services/EnvConfig';
import { AuthController } from '../controllers/AuthController';
import { MiddlewareStatusService } from '../middleware/MiddlewareStatus';
import { HealthCheckService } from '../services/HealthCheck';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { fileTypeFromBuffer } from 'file-type';
import { csrfOptions } from '../config/middlewareOptions';
import {
	AccessControlMiddlewareServiceInterface,
	AppLoggerServiceInterface,
	AuthControllerInterface,
	BaseRouterInterface,
	DatabaseControllerInterface,
	EmailMFAServiceInterface,
	EnvConfigServiceInterface,
	ErrorLoggerServiceInterface,
	HealthCheckServiceInterface,
	HelmetMiddlwareServiceInterface,
	HTTPSServerInterface,
	JWTAuthMiddlewareServiceInterface,
	JWTServiceInterface,
	MailerServiceInterface,
	MiddlewareStatusServiceInterface,
	MulterUploadServiceInterface,
	PassportAuthMiddlewareServiceInterface,
	PassportServiceInterface,
	RedisServiceInterface,
	ResourceManagerInterface,
	UserControllerInterface,
	VaultServiceInterface,
	YubicoOTPServiceInterface
} from './interfaces/services';
import { VaultService } from '../services/Vault';
import { BaseRouter } from 'src/routers/BaseRouter';

const defaultReq: Request = {} as Request;
const defaultRes: Response = {} as Response;
const defaultNext: NextFunction = () => {};

export class ServiceFactory {
	private static loggerService = AppLoggerService.getInstance(
		AppLoggerServiceParameters
	);

	private static errorLoggerService = ErrorLoggerService.getInstance(
		AppLoggerServiceParameters
	);

	private static errorHandlerService = ErrorHandlerService.getInstance(
		AppLoggerService.getInstance(
			AppLoggerServiceParameters
		) as AppLoggerService,
		ErrorLoggerService.getInstance(
			AppLoggerServiceParameters
		) as ErrorLoggerService
	);

	public static getAccessControlMiddlewareService(): AccessControlMiddlewareServiceInterface {
		return AccessControlMiddlewareService.getInstance();
	}

	public static getAuthController(): AuthControllerInterface {
		return AuthController.getInstance();
	}

	public static getBackupCodeService(): BackupCodeService {
		return BackupCodeService.getInstance();
	}

	public static async getBaseRouter(): Promise<BaseRouterInterface> {
		return BaseRouter.getInstance();
	}

	public static getCacheService(): CacheService {
		return CacheService.getInstance();
	}

	public static getCSRFMiddlewareService(): CSRFMiddlewareService {
		return CSRFMiddlewareService.getInstance(csrfOptions);
	}

	public static getDatabaseController(): DatabaseControllerInterface {
		return DatabaseController.getInstance();
	}

	public static getEmailMFAService(): EmailMFAServiceInterface {
		return EmailMFAService.getInstance();
	}

	public static getEnvConfigService(): EnvConfigServiceInterface {
		return EnvConfigService.getInstance();
	}

	public static getErrorHandlerService(): ErrorHandlerService {
		return this.errorHandlerService;
	}

	public static getErrorLoggerService(): ErrorLoggerServiceInterface {
		return this.errorLoggerService as ErrorLoggerService;
	}

	public static getFIDO2Service(): FIDO2Service {
		return FIDO2Service.getInstance();
	}

	public static getGatekeeperService(): GatekeeperService {
		return GatekeeperService.getInstance();
	}

	public static getHealthCheckService(): HealthCheckServiceInterface {
		return HealthCheckService.getInstance();
	}

	public static getHelmetMiddlewareService(): HelmetMiddlwareServiceInterface {
		return HelmetMiddlwareService.getInstance();
	}

	public static getHTTPSServer(app: app.Application): HTTPSServerInterface {
		const sequelize = this.getDatabaseController().getSequelizeInstance();
		const errorHandler = this.getErrorHandlerService();

		if (!sequelize) {
			const HTTPSServerError =
				new errorHandler.ErrorClasses.DatabaseErrorRecoverable(
					`Unable to start web server, as the sequelize instance is not initialized.`,
					{
						exposeToClient: false
					}
				);
			errorHandler.handleError({
				error: HTTPSServerError,
				details: {
					context: 'WEB_SERVER',
					reason: 'Sequelize instance not initialized'
				}
			});
			throw HTTPSServerError;
		}

		return HTTPSServer.getInstance(app, sequelize);
	}

	public static getLoggerService(): AppLoggerServiceInterface {
		return this.loggerService as AppLoggerService;
	}

	public static getJWTAuthMiddlewareService(): JWTAuthMiddlewareServiceInterface {
		return JWTAuthMiddlewareService.getInstance();
	}

	public static getJWTService(): JWTServiceInterface {
		return JWTService.getInstance();
	}

	public static getMailerService(): MailerServiceInterface {
		return MailerService.getInstance({
			nodemailer,
			emailUser: String(
				this.getEnvConfigService().getEnvVariable('emailUser')
			),
			validateDependencies
		});
	}

	public static getMiddlewareStatusService(): MiddlewareStatusServiceInterface {
		return MiddlewareStatusService.getInstance();
	}

	public static getMulterUploadService(): MulterUploadServiceInterface {
		return MulterUploadService.getInstance({
			multer,
			fileTypeFromBuffer,
			fs,
			path,
			logger: this.getLoggerService(),
			errorLogger: this.getErrorLoggerService(),
			errorHandler: this.getErrorHandlerService(),
			validateDependencies
		});
	}

	public static getPassportService(): PassportServiceInterface {
		return PassportService.getInstance();
	}

	public static getPassportAuthMiddlewareService(): PassportAuthMiddlewareServiceInterface {
		return PassportAuthMiddlewareService.getInstance();
	}

	public static getPasswordService(): PasswordService {
		return PasswordService.getInstance();
	}

	public static getRedisService(): RedisServiceInterface {
		return RedisService.getInstance({
			req: defaultReq,
			res: defaultRes,
			next: defaultNext,
			blankRequest,
			createRedisClient: createClient,
			validateDependencies
		});
	}

	public static getResourceManager(): ResourceManagerInterface {
		return ResourceManager.getInstance();
	}

	public static getVaultService(): VaultServiceInterface {
		return VaultService.getInstance();
	}
	public static getTOTPService(): TOTPService {
		return TOTPService.getInstance();
	}

	public static getUserController(): UserControllerInterface {
		return UserController.getInstance();
	}

	public static getYubicoOTPService(): YubicoOTPServiceInterface {
		return YubicoOTPService.getInstance();
	}
}
