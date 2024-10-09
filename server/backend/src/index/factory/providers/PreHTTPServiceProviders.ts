import { MailerService } from '../../../services/Mailer';
import {
	MailerServiceInterface,
	MulterUploadServiceInterface
} from '../../interfaces/main';
import { EnvConfigServiceFactory } from '../subfactories/EnvConfigServiceFactory';
import { validateDependencies } from '../../../utils/helpers';
import nodemailer from 'nodemailer';
import { MulterUploadService } from '../../../services/MulterUpload';
import { ErrorHandlerServiceFactory } from '../subfactories/ErrorHandlerServiceFactory';
import { LoggerServiceFactory } from '../subfactories/LoggerServiceFactory';
import multer from 'multer';
import { fileTypeFromBuffer } from 'file-type';
import fs from 'fs';
import path from 'path';

export class MailerServiceProvider {
	private static instance: MailerServiceInterface | null = null;

	public static async getMailerService(): Promise<MailerServiceInterface> {
		const envConfig = await EnvConfigServiceFactory.getEnvConfigService();

		if (!this.instance) {
			this.instance = await MailerService.getInstance({
				nodemailer,
				emailUser: envConfig.getEnvVariable('emailUser'),
				validateDependencies
			});
		}

		return this.instance;
	}
}

export class MulterUploadServiceProvider {
	private static instance: MulterUploadServiceInterface | null = null;

	public static async getMulterUploadService(): Promise<MulterUploadServiceInterface> {
		const logger = await LoggerServiceFactory.getLoggerService();
		const errorLogger = await LoggerServiceFactory.getErrorLoggerService();
		const errorHandler =
			await ErrorHandlerServiceFactory.getErrorHandlerService();

		if (!this.instance) {
			this.instance = await MulterUploadService.getInstance({
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

		return this.instance;
	}
}
