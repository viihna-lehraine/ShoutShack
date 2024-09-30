import { Request, Response, NextFunction } from 'express';
import nodemailer from 'nodemailer';
import { createClient } from 'redis';
import app from 'express';
import { configService, ConfigService } from '../services/config';
import { APIRouter } from '../routers/ApiRouter';
import { BackupCodeService } from '../auth/BackupCode';
import { StaticRouter } from '../routers/StaticRouter';
import { MailerService } from '../services/mailer';
import { EmailMFAService } from '../auth/EmailMfa';
import { RedisService } from '../services/redis';
import { CacheService } from '../services/cache';
import { blankRequest } from '../utils/constants';
import { validateDependencies } from '../utils/helpers';
import { AppLoggerService, ErrorLoggerService } from '../services/logger';
import { AppLoggerServiceParameters } from './parameters';
import { BouncerService } from '../services/bouncer';
import { JWTService } from '../auth/JWT';
import { DatabaseController } from '../controllers/DatabaseController';
import { ErrorHandlerService } from '../services/errorHandler';
import { FIDO2Service } from '../auth/FIDO2';
import { HTTPSServer } from '../services/HTTPS';
import { MulterUploadService } from '../services/multer';
import { ResourceManager } from '../services/resourceManager';
import { PassportAuthService } from '../auth/PassportAuth';
import { PassportAuthMiddlewareService } from '../middleware/PassportAuthMiddleware';
import { JWTAuthMiddlewareService } from '../middleware/JWTAuthMiddleware';
import { PasswordService } from '../auth/Password';
import { UserController } from '../controllers/UserController';
import { TOTPService } from '../auth/TOTP';
import { YubicoOTPService } from '../auth/YubicoOTP';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { fileTypeFromBuffer } from 'file-type';
import {
	AppLoggerServiceInterface,
	DatabaseControllerInterface,
	EmailMFAServiceInterface,
	ErrorLoggerServiceInterface,
	HTTPSServerInterface,
	JWTAuthMiddlewareServiceInterface,
	JWTServiceInterface,
	MailerServiceInterface,
	MulterUploadServiceInterface,
	PassportAuthMiddlewareServiceInterface,
	RedisServiceInterface,
	ResourceManagerInterface,
	SecretsStoreInterface,
	UserControllerInterface,
	YubicoOTPServiceInterface
} from './interfaces';
import { SecretsStore } from '../services/secrets';

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

	private static configServiceInstance = configService as ConfigService;

	private static errorHandlerService = ErrorHandlerService.getInstance(
		AppLoggerService.getInstance(
			AppLoggerServiceParameters
		) as AppLoggerService,
		ErrorLoggerService.getInstance(
			AppLoggerServiceParameters
		) as ErrorLoggerService
	);

	public static getAPIRouter(): APIRouter {
		return APIRouter.getInstance();
	}

	public static getBackupCodeService(): BackupCodeService {
		return BackupCodeService.getInstance();
	}

	public static getBouncerService(): BouncerService {
		return BouncerService.getInstance();
	}

	public static getCacheService(): CacheService {
		return CacheService.getInstance();
	}

	public static getConfigService(): ConfigService {
		return this.configServiceInstance;
	}

	public static getDatabaseController(): DatabaseControllerInterface {
		return DatabaseController.getInstance();
	}

	public static getEmailMFAService(): EmailMFAServiceInterface {
		return EmailMFAService.getInstance();
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
				this.getConfigService().getEnvVariable('emailUser')
			),
			validateDependencies
		});
	}

	public static getMulterUploadService(): MulterUploadServiceInterface {
		return MulterUploadService.getInstance({
			multer,
			fileTypeFromBuffer,
			fs,
			path,
			logger: this.getLoggerService(),
			errorLogger: this.getErrorLoggerService(),
			configService: this.getConfigService(),
			errorHandler: this.getErrorHandlerService(),
			validateDependencies
		});
	}

	public static getPassportAuthService(): PassportAuthService {
		return PassportAuthService.getInstance();
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

	public static getSecretsStore(): SecretsStoreInterface {
		return SecretsStore.getInstance();
	}

	public static getStaticRouter(): StaticRouter {
		return StaticRouter.getInstance();
	}

	public static getTOTPService(): TOTPService {
		return TOTPService.getInstance();
	}

	public static getUserController(): UserControllerInterface {
		return UserController.getInstance();
	}

	public static getYubicoOTPService(
		yub: YubicoOTPServiceInterface
	): YubicoOTPService {
		return YubicoOTPService.getInstance(yub);
	}
}
