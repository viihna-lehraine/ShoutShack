import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import nodemailer from 'nodemailer';
import path from 'path';
import { createClient } from 'redis';
import { configService } from '../services/configService';
import { MailerService } from '../services/mailer';
import { MulterUploadService } from '../services/multer';
import { RedisService } from '../services/redis';
import { blankRequest } from '../utils/constants';
import { validateDependencies } from '../utils/helpers';
import { AppLoggerService, ErrorLoggerService } from '../services/logger';
import { AppLoggerServiceParameters } from './parameters';
import { DatabaseService } from '../services/database';
import { ErrorHandlerService } from '../services/errorHandler';
import {
	AppLoggerServiceInterface,
	ErrorLoggerServiceInterface
} from './interfaces';
import { errorHandler } from '../services/errorHandler';

const defaultReq: Request = {} as Request;
const defaultRes: Response = {} as Response;
const defaultNext: NextFunction = () => {};

type LoggerType = 'logger' | 'errorLogger';

export class ServiceFactory {
	// Generic createService function that returns all types of services
	public static createService(
		name: string
	):
		| AppLoggerServiceInterface
		| DatabaseService
		| ErrorHandlerService
		| ErrorLoggerServiceInterface
		| MailerService
		| MulterUploadService
		| RedisService {
		switch (name) {
			case 'errorHandler':
				return ServiceFactory.getErrorHandlerService();
			case 'logger':
				return ServiceFactory.getLoggerService('logger');
			case 'errorLogger':
				return ServiceFactory.getLoggerService('errorLogger');
			case 'mailer':
				return ServiceFactory.getMailerService();
			case 'multer':
				return ServiceFactory.getMulterUploadService();
			case 'redis':
				return ServiceFactory.getRedisService();
			case 'database':
				return ServiceFactory.getDatabaseService();
			default:
				throw new Error(`Unknown service type: ${name}`);
		}
	}

	private static getDatabaseService(): DatabaseService {
		return DatabaseService.getInstance(); // Assuming singleton pattern for database
	}

	private static getErrorHandlerService(): ErrorHandlerService {
		return ErrorHandlerService.getInstance(
			AppLoggerService.getInstance(
				AppLoggerServiceParameters
			) as AppLoggerServiceInterface,
			ErrorLoggerService.getInstance(
				AppLoggerServiceParameters
			) as ErrorLoggerServiceInterface
		);
	}

	private static getMailerService(): MailerService {
		return MailerService.getInstance({
			nodemailer,
			emailUser: configService.getEnvVariables().emailUser,
			logger: configService.getLogger(),
			errorLogger: configService.getErrorLogger(),
			configService,
			errorHandler,
			validateDependencies
		});
	}

	private static getLoggerService(
		type: LoggerType
	): AppLoggerServiceInterface | ErrorLoggerServiceInterface {
		const deps = AppLoggerServiceParameters;

		if (type === 'logger') {
			return AppLoggerService.getInstance(
				deps
			) as AppLoggerServiceInterface;
		} else {
			return ErrorLoggerService.getInstance(
				deps
			) as ErrorLoggerServiceInterface;
		}
	}

	private static getMulterUploadService(): MulterUploadService {
		return new MulterUploadService({
			multer,
			path,
			configService,
			validateDependencies,
			logger: configService.getLogger(),
			errorLogger: configService.getErrorLogger(),
			errorHandler
		});
	}

	private static getRedisService(): RedisService {
		return RedisService.getInstance({
			req: defaultReq,
			res: defaultRes,
			next: defaultNext,
			blankRequest,
			configService,
			createRedisClient: createClient,
			validateDependencies,
			errorHandler
		});
	}
}
