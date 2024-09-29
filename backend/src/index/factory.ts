import { Request, Response, NextFunction } from 'express';
import nodemailer from 'nodemailer';
import { createClient } from 'redis';
import app from 'express';
import { configService, ConfigService } from '../services/config';
import { APIRouter } from '../routers/apiRouter';
import { StaticRouter } from '../routers/staticRouter';
import { MailerService } from '../services/mailer';
import { RedisService } from '../services/redis';
import { CacheService } from '../services/cache';
import { blankRequest } from '../utils/constants';
import { validateDependencies } from '../utils/helpers';
import { AppLoggerService, ErrorLoggerService } from '../services/logger';
import { AppLoggerServiceParameters } from './parameters';
import { BouncerService } from '../services/bouncer';
import { DatabaseController } from '../controllers/DatabaseController';
import { ErrorHandlerService } from '../services/errorHandler';
import { HTTPSServer } from '../services/httpsServer';
import { MulterUploadService } from '../services/multer';
import { ResourceManager } from '../services/resourceManager';
import { UserController } from '../controllers/UserController';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { fileTypeFromBuffer } from 'file-type';
import {
	AppLoggerServiceInterface,
	DatabaseControllerInterface,
	ErrorLoggerServiceInterface,
	HTTPSServerInterface,
	MailerServiceInterface,
	MulterUploadServiceInterface,
	RedisServiceInterface,
	ResourceManagerInterface,
	SecretsStoreInterface,
	UserControllerInterface
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

	public static getErrorHandlerService(): ErrorHandlerService {
		return this.errorHandlerService;
	}

	public static getLoggerService(): AppLoggerServiceInterface {
		return this.loggerService as AppLoggerService;
	}

	public static getErrorLoggerService(): ErrorLoggerServiceInterface {
		return this.errorLoggerService as ErrorLoggerService;
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

	public static getUserController(): UserControllerInterface {
		return UserController.getInstance();
	}
}
