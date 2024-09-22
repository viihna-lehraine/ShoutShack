import { AppError } from '../errors/errorClasses';

export interface ErrorLoggerInstanceInterface {
	readonly configService: typeof import('../services/configService').configService;
	readonly validateDependencies: typeof import('../utils/helpers').validateDependencies;
	readonly errorClasses: typeof import('../errors/errorClasses').errorClasses;
	readonly ErrorSeverity: string;
	readonly processError: typeof import('../errors/processError').processError;
}

export interface ErrorLoggerInterface {
	logDebug(
		debugMessage: string,
		details: Record<string, unknown>,
		appLogger: import('../services/appLogger').AppLogger,
		severity: string
	): void;
	logInfo(
		infoMessage: string,
		details: Record<string, unknown>,
		appLogger: import('../services/appLogger').AppLogger,
		severity: string
	): void;
	logWarning(
		warningMessage: string,
		details: Record<string, unknown>,
		appLogger: import('../services/appLogger').AppLogger,
		severity: string
	): void;
	logError(
		error: AppError,
		details: Record<string, unknown>,
		appLogger: import('../services/appLogger').AppLogger,
		severity: string
	): void;
	logCritical(
		errorMessage: string,
		details: Record<string, unknown>,
		appLogger: import('../services/appLogger').AppLogger,
		severity: string
	): void;
	logToDatabase(
		error: AppError,
		sequelize: import('sequelize').Sequelize,
		appLogger: import('../services/appLogger').AppLogger,
		retryCount?: number,
		retryDelay?: number,
		severity?: string
	): Promise<void>;
	getErrorCount(errorName: string): number;
	cleanUpOldLogs(
		appLogger: import('../services/appLogger').AppLogger,
		sequelize: import('sequelize').Sequelize,
		Op: typeof import('sequelize').Op,
		retentionPeriodDays?: number
	): Promise<void>;
}

export interface FlushRedisMemoryCache {
	readonly appLogger: import('../services/appLogger').AppLogger;
	readonly configService: typeof import('../services/configService').configService;
	readonly redisClient: import('redis').RedisClient;
	readonly errorClasses: typeof import('../errors/errorClasses').errorClasses;
	readonly ErrorLogger: import('../services/errorLogger').ErrorLogger;
	readonly ErrorSeverity: import('../errors/errorClasses').ErrorSeverityType;
	readonly processError: typeof import('../errors/processError').processError;
	readonly validateDependencies: typeof import('../utils/helpers').validateDependencies;
}

export interface GetRedisClient {
	readonly appLogger: import('../services/appLogger').AppLogger;
	readonly configService: typeof import('../services/configService').configService;
	readonly createRedisClient: typeof import('redis').createClient;
}

export interface MailerService {
	readonly nodemailer: typeof import('nodemailer');
	readonly Transporter: import('nodemailer').Transporter;
	readonly emailUser: string;
	readonly configService: typeof import('../services/configService').configService;
	readonly appLogger: import('../services/appLogger').AppLogger;
	readonly validateDependencies: typeof import('../utils/helpers').validateDependencies;
	readonly errorClasses: typeof import('../errors/errorClasses');
	readonly ErrorSeverity: typeof import('../errors/errorClasses').ErrorSeverity;
	readonly ErrorLogger: typeof import('../services/errorLogger').ErrorLogger;
	readonly processError: typeof import('../errors/processError').processError;
}

export interface MulterService {
	readonly multer: typeof import('multer');
	readonly path: typeof import('path');
	readonly storageDir: string;
	readonly allowedMimeTypes: string[];
	readonly allowedExtensions: string[];
	readonly fileSizeLimit: number;
	readonly configService: typeof import('../services/configService').configService;
	readonly appLogger: import('../services/appLogger').AppLogger;
	readonly errorClasses: typeof import('../errors/errorClasses').errorClasses;
	readonly ErrorSeverity: typeof import('../errors/errorClasses').ErrorSeverity;
	readonly ErrorLogger: typeof import('../services/errorLogger').ErrorLogger;
	readonly processError: typeof import('../errors/processError').processError;
	readonly validateDependencies: typeof import('../utils/helpers').validateDependencies;
}

export interface PassportService {
	readonly passport: import('passport').PassportStatic;
	readonly UserModel: ReturnType<
		typeof import('../models/UserModelFile').createUserModel
	>;
	readonly argon2: typeof import('argon2');
	readonly configService: typeof import('../services/configService').configService;
	readonly appLogger: import('../services/appLogger').AppLogger;
}

export interface RedisService {
	readonly redisUrl: string;
	readonly appLogger: import('../services/appLogger').AppLogger;
	readonly configService: typeof import('../services/configService').configService;
	readonly createRedisClient: typeof import('redis').createClient;
	readonly errorClasses: typeof import('../errors/errorClasses').errorClasses;
	readonly ErrorLogger: typeof import('../services/errorLogger').ErrorLogger;
	readonly ErrorSeverity: import('../errors/errorClasses').ErrorSeverityType;
	readonly processError: typeof import('../errors/processError').processError;
	readonly validateDependencies: typeof import('../utils/helpers').validateDependencies;
}
