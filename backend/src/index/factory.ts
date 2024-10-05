import { Request, Response, NextFunction } from 'express';
import nodemailer from 'nodemailer';
import { createClient } from 'redis';
import app from 'express';
import { BackupCodeService } from '../auth/BackupCode';
import { MailerService } from '../services/Mailer';
import { EmailMFAService } from '../auth/EmailMFA';
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
import { HelmetMiddlewareService } from '../middleware/Helmet';
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
import { RootMiddlewareService } from '../middleware/Root';
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
	HelmetMiddlewareServiceInterface,
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
	RootMiddlewareServiceInterface,
	UserControllerInterface,
	VaultServiceInterface,
	YubicoOTPServiceInterface
} from './interfaces/services';
import { VaultService } from '../services/Vault';
import { BaseRouter } from 'src/routers/BaseRouter';

const defaultReq: Request = {} as Request;
const defaultRes: Response = {} as Response;
const defaultNext: NextFunction = () => {};
const loggerServiceParams = AppLoggerServiceParameters;

export class ServiceFactory {
	private static loggerService: Promise<AppLoggerServiceInterface> | null =
		null;

	private static errorLoggerService: Promise<ErrorLoggerServiceInterface> | null =
		null;

	private static errorHandlerService: Promise<ErrorHandlerService> | null =
		null;

	private static envConfigService: Promise<EnvConfigServiceInterface> | null =
		null;

	public static async getAccessControlMiddlewareService(): Promise<AccessControlMiddlewareServiceInterface> {
		return AccessControlMiddlewareService.getInstance();
	}

	public static async getAuthController(): Promise<AuthControllerInterface> {
		return AuthController.getInstance();
	}

	public static async getBackupCodeService(): Promise<BackupCodeService> {
		return BackupCodeService.getInstance();
	}

	public static async getBaseRouter(): Promise<BaseRouterInterface> {
		return BaseRouter.getInstance();
	}

	public static async getCacheService(): Promise<CacheService> {
		return CacheService.getInstance();
	}

	public static async getCSRFMiddlewareService(): Promise<CSRFMiddlewareService> {
		return CSRFMiddlewareService.getInstance(csrfOptions);
	}

	public static async getDatabaseController(): Promise<DatabaseControllerInterface> {
		return DatabaseController.getInstance();
	}

	public static async getEmailMFAService(): Promise<EmailMFAServiceInterface> {
		return EmailMFAService.getInstance();
	}

	public static async getEnvConfigService(): Promise<EnvConfigServiceInterface> {
		if (!this.envConfigService) {
			this.envConfigService = EnvConfigService.getInstance();
		}
		return this.envConfigService;
	}

	public static async getErrorHandlerService(): Promise<ErrorHandlerService> {
		if (!this.errorHandlerService) {
			const logger = await this.getLoggerService();
			const errorLogger = await this.getErrorLoggerService();
			this.errorHandlerService = ErrorHandlerService.getInstance(
				logger,
				errorLogger
			);
		}

		return this.errorHandlerService;
	}

	public static async getErrorLoggerService(): Promise<ErrorLoggerServiceInterface> {
		if (!this.errorLoggerService) {
			this.errorLoggerService = ErrorLoggerService.getInstance(
				loggerServiceParams,
				'debug',
				'BrainBlot Backend'
			);
		}

		return this.errorLoggerService;
	}

	public static async getFIDO2Service(): Promise<FIDO2Service> {
		return FIDO2Service.getInstance();
	}

	public static async getGatekeeperService(): Promise<GatekeeperService> {
		return GatekeeperService.getInstance();
	}

	public static async getHealthCheckService(): Promise<HealthCheckServiceInterface> {
		return HealthCheckService.getInstance();
	}

	public static async getHelmetMiddlewareService(): Promise<HelmetMiddlewareServiceInterface> {
		return HelmetMiddlewareService.getInstance();
	}

	public static async getHTTPSServer(
		app: app.Application
	): Promise<HTTPSServerInterface> {
		const databaseController = await this.getDatabaseController();
		const sequelize = databaseController.getSequelizeInstance();
		const errorHandler = await this.getErrorHandlerService();

		if (!sequelize) {
			const HTTPSServerError =
				new errorHandler.ErrorClasses.DatabaseErrorRecoverable(
					'Unable to start web server, as the sequelize instance is not initialized.',
					{ exposeToClient: false }
				);
			await errorHandler.handleError({
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

	public static async getJWTAuthMiddlewareService(): Promise<JWTAuthMiddlewareServiceInterface> {
		return JWTAuthMiddlewareService.getInstance();
	}

	public static async getJWTService(): Promise<JWTServiceInterface> {
		return JWTService.getInstance();
	}

	public static async getLoggerService(): Promise<AppLoggerServiceInterface> {
		if (!this.loggerService) {
			this.loggerService = AppLoggerService.getInstance(
				AppLoggerServiceParameters
			);
		}

		return this.loggerService;
	}

	public static async getMailerService(): Promise<MailerServiceInterface> {
		const envConfigService = await this.getEnvConfigService();

		return MailerService.getInstance({
			nodemailer,
			emailUser: envConfigService.getEnvVariable('emailUser'),
			validateDependencies
		});
	}

	public static async getMiddlewareStatusService(): Promise<MiddlewareStatusServiceInterface> {
		return MiddlewareStatusService.getInstance();
	}

	public static async getMulterUploadService(): Promise<MulterUploadServiceInterface> {
		const logger = await this.getLoggerService();
		const errorLogger = await this.getErrorLoggerService();
		const errorHandler = await this.getErrorHandlerService();

		return MulterUploadService.getInstance({
			multer,
			fileTypeFromBuffer,
			fs,
			path,
			logger,
			errorLogger,
			errorHandler,
			validateDependencies
		});
	}

	public static async getPassportService(): Promise<PassportServiceInterface> {
		return PassportService.getInstance();
	}

	public static async getPassportAuthMiddlewareService(): Promise<PassportAuthMiddlewareServiceInterface> {
		return PassportAuthMiddlewareService.getInstance();
	}

	public static async getPasswordService(): Promise<PasswordService> {
		return PasswordService.getInstance();
	}

	public static async getRedisService(): Promise<RedisServiceInterface> {
		return RedisService.getInstance({
			req: defaultReq,
			res: defaultRes,
			next: defaultNext,
			blankRequest,
			createRedisClient: createClient,
			validateDependencies
		});
	}

	public static async getResourceManager(): Promise<ResourceManagerInterface> {
		return ResourceManager.getInstance();
	}

	public static async getRootMiddlewareService(): Promise<RootMiddlewareServiceInterface> {
		return RootMiddlewareService.getInstance();
	}

	public static async getVaultService(): Promise<VaultServiceInterface> {
		return VaultService.getInstance();
	}

	public static async getTOTPService(): Promise<TOTPService> {
		return TOTPService.getInstance();
	}

	public static async getUserController(): Promise<UserControllerInterface> {
		return UserController.getInstance();
	}

	public static async getYubicoOTPService(): Promise<YubicoOTPServiceInterface> {
		return YubicoOTPService.getInstance();
	}
}
