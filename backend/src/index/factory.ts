import { Request, Response, NextFunction } from 'express';
import nodemailer from 'nodemailer';
import { createClient } from 'redis';
import app from 'express';
import { configService, ConfigService } from '../services/config'; // Use ConfigService
import { MailerService } from '../services/mailer';
import { RedisService } from '../services/redis';
import { blankRequest } from '../utils/constants';
import { validateDependencies } from '../utils/helpers';
import { AppLoggerService, ErrorLoggerService } from '../services/logger';
import { AppLoggerServiceParameters } from './parameters';
import { DatabaseService } from '../services/database';
import { EnvironmentService } from '../services/environment';
import { ErrorHandlerService } from '../services/errorHandler';
import { MulterUploadService } from '../services/multer';
import { WebServer } from '../services/webServer';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { fileTypeFromBuffer } from 'file-type';
import {
	AppLoggerServiceInterface,
	DatabaseServiceInterface,
	EnvironmentServiceInterface,
	ErrorLoggerServiceInterface,
	MailerServiceInterface,
	MulterUploadServiceInterface,
	RedisServiceInterface,
	SecretsStoreInterface,
	WebServerInterface
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

	private static environmentService = EnvironmentService.getInstance();

	private static errorHandlerService = ErrorHandlerService.getInstance(
		AppLoggerService.getInstance(
			AppLoggerServiceParameters
		) as AppLoggerService,
		ErrorLoggerService.getInstance(
			AppLoggerServiceParameters
		) as ErrorLoggerService
	);

	public static getConfigService(): ConfigService {
		return this.configServiceInstance;
	}

	public static getDatabaseService(): DatabaseServiceInterface {
		return DatabaseService.getInstance();
	}

	public static getEnvironmentService(): EnvironmentServiceInterface {
		return this.environmentService;
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

	public static getSecretsStore(): SecretsStoreInterface {
		return SecretsStore.getInstance();
	}

	public static getWebServer(app: app.Application): WebServerInterface {
		const sequelize = this.getDatabaseService().getSequelizeInstance();
		const errorHandler = this.getErrorHandlerService();

		if (!sequelize) {
			const webServerError =
				new errorHandler.ErrorClasses.DatabaseErrorRecoverable(
					`Unable to start web server, as the sequelize instance is not initialized.`,
					{
						exposeToClient: false
					}
				);
			errorHandler.handleError({
				error: webServerError,
				details: {
					context: 'WEB_SERVER',
					reason: 'Sequelize instance not initialized'
				}
			});
			throw webServerError;
		}

		return WebServer.getInstance(app, sequelize);
	}
}
