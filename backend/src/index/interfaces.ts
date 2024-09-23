import * as cryptoConstants from 'crypto';
import { Model } from 'sequelize';
import { AppLogger } from '../services/appLogger';
import { NextFunction, Request, Response } from 'express';
import { AppError, ClientError } from '../errors/errorClasses';
import RedisStore from 'connect-redis';

// ***** CUSTOM TYPE FILES ***** //

import '../../types/custom/yub.js';

// ***** COMMONLY USED TYPE BLOCKS ***** //

export interface BaseExpressInterface {
	req: import('express').Request;
	res: import('express').Response;
	next: import('express').NextFunction;
}

export interface BaseInterface {
	appLogger: AppLogger;
	configService: typeof import('../services/configService').configService;
	errorClasses: typeof import('../errors/errorClasses').errorClasses;
	errorLogger: typeof import('../services/errorLogger').errorLogger;
	errorLoggerDetails: typeof import('../utils/helpers').errorLoggerDetails;
	getCallerInfo: typeof import('../utils/helpers').getCallerInfo;
	ErrorSeverity: typeof import('../errors/errorClasses').ErrorSeverity;
	processError: typeof import('../errors/processError').processError;
	blankRequest: import('express').Request;
	req?: import('express').Request;
}

// ***** MAIN INTERFACE LIST ***** //

export interface AddIpToBlacklistInterface {
	ip: string;
	appLogger: AppLogger;
	errorLogger: typeof import('../services/errorLogger').errorLogger;
	errorClasses: typeof import('../errors/errorClasses').errorClasses;
	ErrorSeverity: typeof import('../errors/errorClasses').ErrorSeverity;
	errorLoggerDetails: typeof import('../utils/helpers').errorLoggerDetails;
	getCallerInfo: typeof import('../utils/helpers').getCallerInfo;
	configService: typeof import('../services/configService').configService;
	processError: typeof import('../errors/processError').processError;
	validateDependencies: (
		dependencies: DependencyInterface[],
		appLogger: AppLogger
	) => void;
}

export interface AuthControllerInterface {
	argon2: typeof import('argon2');
	execSync: typeof import('child_process').execSync;
	jwt: typeof import('jsonwebtoken');
	req: import('express').Request;
	res: import('express').Response;
	appLogger: AppLogger;
	createJwt: typeof import('../auth/jwt').createJwt;
	errorClasses: typeof import('../errors/errorClasses').errorClasses;
	ErrorLogger: import('../services/errorLogger').ErrorLogger;
	ErrorSeverity: typeof import('../errors/errorClasses').ErrorSeverity;
	processError: typeof import('../errors/processError').processError;
	sendClientErrorResponse: typeof import('../errors/processError').sendClientErrorResponse;
	UserModel: typeof import('../models/UserModelFile').User;
	validateDependencies: (
		dependencies: DependencyInterface[],
		appLogger: AppLogger
	) => void;
}

export interface BackupCodeInterface {
	code: string;
	used: boolean;
}

export interface BackupCodeServiceInterface {
	UserMfa: typeof import('../models/UserMfaModelFile').UserMfa;
	crypto: typeof import('crypto');
	bcrypt: typeof import('bcrypt');
	configService: typeof import('../services/configService').configService;
	appLogger: AppLogger;
}

export interface ConfigSecretsInterface {
	readonly AppLogger: import('winston').Logger;
	readonly execSync: typeof import('child_process').execSync;
	readonly getDirectoryPath: () => string;
	readonly gpgPassphrase: string;
}

export interface ConfigServiceInterface {
	getAppLogger(): AppLogger;
	getEnvVariables(): EnvVariableTypes;
	getFeatureFlags(): FeatureFlagTypes;
	getSecrets(
		keys: string | string[],
		appLogger: import('../services/appLogger').AppLogger
	): Record<string, string | undefined> | string | undefined;
	refreshSecrets(dependencies: ConfigSecretsInterface): void;
}

export interface CreateFeatureEnablerInterface {
	readonly appLogger: AppLogger;
	readonly errorClasses: typeof import('../errors/errorClasses').errorClasses;
	readonly errorLogger: typeof import('../services/errorLogger').errorLogger;
	readonly errorLoggerDetails: typeof import('../utils/helpers').errorLoggerDetails;
	readonly getCallerInfo: () => string;
	readonly ErrorSeverity: typeof import('../errors/errorClasses').ErrorSeverity;
	readonly processError: (params: Partial<ProcessErrorFnInterface>) => void;
}

export interface CreateJwtInterface {
	jwt: typeof import('jsonwebtoken');
	execSync: typeof import('child_process').execSync;
	configService: typeof import('../services/configService').configService;
	appLogger: AppLogger;
	errorClasses: typeof import('../errors/errorClasses').errorClasses;
	errorLogger: typeof import('../services/errorLogger').errorLogger;
	errorLoggerDetails: typeof import('../utils/helpers').errorLoggerDetails;
	getCallerInfo: typeof import('../utils/helpers').getCallerInfo;
	ErrorSeverity: typeof import('../errors/errorClasses').ErrorSeverity;
	processError: typeof import('../errors/processError').processError;
	validateDependencies: (
		dependencies: DependencyInterface[],
		logger: import('../services/appLogger').AppLogger
	) => void;
	envSecretsStore: typeof import('../environment/envSecrets').envSecretsStore;
}

export interface CsrfMiddlewareInterface {
	req: import('express').Request;
	res: import('express').Response;
	next: import('express').NextFunction;
}

export interface DeclareWebServerOptionsInterface {
	appLogger: AppLogger;
	blankRequest: import('express').Request;
	configService: typeof import('../services/configService').configService;
	constants: typeof cryptoConstants;
	errorClasses: typeof import('../errors/errorClasses').errorClasses;
	errorLogger: typeof import('../services/errorLogger').errorLogger;
	errorLoggerDetails: typeof import('../utils/helpers').errorLoggerDetails;
	ErrorSeverity: typeof import('../errors/errorClasses').ErrorSeverity;
	fs: typeof import('fs').promises;
	getCallerInfo: () => string;
	processError: typeof import('../errors/processError').processError;
	tlsCiphers: string[];
	validateDependencies: (
		dependencies: DependencyInterface[],
		appLogger: AppLogger
	) => void;
}

export interface DependencyInterface {
	name: string;
	instance: unknown;
}

export interface DisplayEnvAndFeatueFlagsInterface {
	readonly appLogger: AppLogger;
	readonly errorClasses: typeof import('../errors/errorClasses').errorClasses;
	readonly errorLogger: typeof import('../services/errorLogger').errorLogger;
	readonly errorLoggerDetails: typeof import('../utils/helpers').errorLoggerDetails;
	readonly ErrorSeverity: typeof import('../errors/errorClasses').ErrorSeverity;
	readonly processError: (params: Partial<ProcessErrorFnInterface>) => void;
}

export interface EmailMFAInterface {
	bcrypt: typeof import('bcrypt');
	jwt: typeof import('jsonwebtoken');
	configService: typeof import('../services/configService').configService;
	validateDependencies: (
		dependencies: DependencyInterface[],
		appLogger: import('../services/appLogger').AppLogger
	) => void;
	errorClasses: typeof import('../errors/errorClasses').errorClasses;
	errorLogger: typeof import('../services/errorLogger').ErrorLogger;
	processError: typeof import('../errors/processError').processError;
}

export interface EnvVariableTypes {
	batchReEncryptSecretsInterval: number;
	clearExpiredSecretsInterval: number;
	dbDialect: 'mariadb' | 'mssql' | 'mysql' | 'postgres' | 'sqlite';
	dbHost: string;
	dbInitMaxRetries: number;
	dbInitRetryAfter: number;
	dbName: string;
	dbUser: string;
	emailHost: string;
	emailPort: number;
	emailSecure: boolean;
	emailUser: string;
	featureApiRoutesCsrf: boolean;
	featureDbSync: boolean;
	featureEnableIpBlacklist: boolean;
	featureEnableJwtAuth: boolean;
	featureEnableLogStash: boolean;
	featureEnableRateLimit: boolean;
	featureEnableRedis: boolean;
	featureEnableSession: boolean;
	featureEnableSsl: boolean;
	featureEncryptSecretsStore: boolean;
	featureHonorCipherOrder: boolean;
	featureHttpsRedirect: boolean;
	featureLoadTestRoutes: boolean;
	featureSequelizeLogging: boolean;
	fidoAuthRequireResidentKey: boolean;
	fidoAuthUserVerification:
		| 'required'
		| 'preferred'
		| 'discouraged'
		| 'enterprise';
	fidoChallengeSize: number;
	fidoCryptoParams: number[];
	frontendSecretsPath: string;
	logExportPath: string;
	loggerLevel: string;
	logLevel: 'debug' | 'info' | 'warn' | 'error';
	logStashHost: string;
	logStashNode: string;
	logStashPort: number;
	memoryMonitorInterval: number;
	npmLogPath: string;
	nodeEnv: 'development' | 'testing' | 'production';
	primaryLogPath: string;
	rateLimiterBaseDuration: string;
	rateLimiterBasePoints: string;
	redisUrl: string;
	rpName: string;
	rpIcon: string;
	rpId: string;
	secretsFilePath1: string;
	secretsRateLimitMaxAttempts: number;
	secretsRateLimitWindow: number;
	secretsReEncryptionCooldown: number;
	serverDataFilePath1: string;
	serverDataFilePath2: string;
	serverDataFilePath3: string;
	serverDataFilePath4: string;
	serverPort: number;
	serviceName: string;
	staticRootPath: string;
	tlsCertPath1: string;
	tlsKeyPath1: string;
	yubicoApiUrl: string;
}

export interface ErrorLoggerInstanceInterface {
	readonly configService: typeof import('../services/configService').configService;
	readonly validateDependencies: (
		dependencies: DependencyInterface[],
		appLogger: import('../services/appLogger').AppLogger
	) => void;
	readonly errorClasses: typeof import('../errors/errorClasses').errorClasses;
	readonly ErrorSeverity: string;
	readonly processError: typeof import('../errors/processError').processError;
}

export interface ExpressErrorHandlerInterface {
	expressError: AppError | ClientError | Error;
	req: Request;
	res: Response;
	next: NextFunction;
	appLogger: AppLogger;
	configService: typeof import('../services/configService').configService;
	errorLogger: typeof import('../services/errorLogger').errorLogger;
	errorLoggerDetails: typeof import('../utils/helpers').errorLoggerDetails;
	fallbackLogger: Console;
	isAppLogger: typeof import('../services/appLogger').isAppLogger;
	errorResponse?: string;
}

export interface ErrorHandlerInterface {
	expressError: AppError | ClientError | Error;
	req: Request;
	res: Response;
	next: NextFunction;
}

export interface ErrorLoggerDetailsInterface {
	getCallerInfo: () => string;
	req: import('express').Request;
	requestIdVal?: string;
	adminIdVal?: string;
	userIdVal?: string;
	actionVal?: string;
	ipVal?: string;
	userAgentVal?: string;
}

export interface ErrorLoggerInterface {
	logDebug(
		debugMessage: string,
		details: Record<string, unknown>,
		appLogger: AppLogger,
		severity: string
	): void;
	logInfo(
		infoMessage: string,
		details: Record<string, unknown>,
		appLogger: AppLogger,
		severity: string
	): void;
	logWarning(
		warningMessage: string,
		details: Record<string, unknown>,
		appLogger: AppLogger,
		severity: string
	): void;
	logError(
		error: AppError,
		details: Record<string, unknown>,
		appLogger: AppLogger,
		severity: string
	): void;
	logCritical(
		errorMessage: string,
		details: Record<string, unknown>,
		appLogger: AppLogger,
		severity: string
	): void;
	logToDatabase(
		error: AppError,
		sequelize: import('sequelize').Sequelize,
		appLogger: AppLogger,
		retryCount?: number,
		retryDelay?: number,
		severity?: string
	): Promise<void>;
	getErrorCount(errorName: string): number;
	cleanUpOldLogs(
		appLogger: AppLogger,
		sequelize: import('sequelize').Sequelize,
		Op: typeof import('sequelize').Op,
		retentionPeriodDays?: number
	): Promise<void>;
}

export interface FeatureEnabler {
	enableFeatureBasedOnFlag: (
		flag: boolean,
		description: string,
		callback: () => void
	) => void;
	enableFeatureWithProdOverride: (
		flag: boolean,
		description: string,
		callback: () => void
	) => void;
}

export interface FeatureFlagTypes {
	apiRoutesCsrf: boolean;
	dbSync: boolean;
	enableIpBlacklist: boolean;
	enableJwtAuth: boolean;
	enableLogStash: boolean;
	enableRateLimit: boolean;
	enableRedis: boolean;
	enableTLS: boolean;
	encryptSecretsStore: boolean;
	honorCipherOrder: boolean;
	httpsRedirect: boolean;
	loadTestRoutes: boolean;
	sequelizeLogging: boolean;
}

// export interface FeatureFlagTypes {
// 	[key: string]: boolean;
// }

export interface FidoUserInterface {
	id: string;
	email: string;
	username: string;
	credential: {
		credentialId: string;
	}[];
}

export interface FlushRedisMemoryCacheInterface {
	readonly createMemoryMonitor: typeof import('../middleware/memoryMonitor').createMemoryMonitor;
	readonly appLogger: import('../services/appLogger').AppLogger;
	readonly configService: typeof import('../services/configService').configService;
	readonly errorClasses: typeof import('../errors/errorClasses').errorClasses;
	readonly errorLogger: typeof import('../services/errorLogger').errorLogger;
	readonly ErrorSeverity: typeof import('../errors/errorClasses').ErrorSeverity;
	readonly processError: ProcessErrorFnInterface;
	readonly createRedisClient: typeof import('redis').createClient;
	readonly blankRequest: import('express').Request;
}

export interface GetFeatureFlagsInterface {
	blankRequest: import('express').Request;
	errorClasses: typeof import('../errors/errorClasses').errorClasses;
	errorLogger: typeof import('../services/errorLogger').errorLogger;
	errorLoggerDetails: typeof import('../utils/helpers').errorLoggerDetails;
	processError: ProcessErrorFnInterface;
}

export interface GeneratePasskeyInterface {
	user: FidoUserInterface;
	configService: typeof import('../services/configService').configService;
	appLogger: AppLogger;
}

export interface GeneratePasskeyInterface {
	user: FidoUserInterface;
	configService: typeof import('../services/configService').configService;
	appLogger: AppLogger;
}

export interface GetRedisClientInterface {
	readonly createRedisClient: typeof import('redis').createClient;
	readonly createMemoryMonitor: typeof import('../middleware/memoryMonitor').createMemoryMonitor;
	readonly configService: typeof import('../services/configService').configService;
	readonly appLogger: AppLogger;
	readonly errorClasses: typeof import('../errors/errorClasses').errorClasses;
	readonly errorLogger: typeof import('../services/errorLogger').errorLogger;
	readonly ErrorSeverity: typeof import('../errors/errorClasses').ErrorSeverity;
	readonly processError: ProcessErrorFnInterface;
}

export interface HashPasswordInterface {
	password: string;
	configService: typeof import('../services/configService');
	appLogger: AppLogger;
}

export interface InitCsrfInterface {
	csrf: typeof import('csrf');
	appLogger: AppLogger;
	errorLogger: typeof import('../services/errorLogger').errorLogger;
	errorClasses: typeof import('../errors/errorClasses').errorClasses;
	ErrorSeverity: typeof import('../errors/errorClasses').ErrorSeverity;
	expressErrorHandler: typeof import('../errors/processError').expressErrorHandler;
}

export interface InitDatabaseInterface {
	appLogger: AppLogger;
	configService: typeof import('../services/configService').configService;
	maxRetries: number;
	retryAfter: number;
}

export interface InitializeDatabaseInterface {
	readonly dbInitMaxRetries: number;
	readonly dbInitRetryAfter: number;
	readonly appLogger: AppLogger;
	readonly envVariables: EnvVariableTypes;
	readonly featureFlags: FeatureFlagTypes;
	readonly errorClasses: typeof import('../errors/errorClasses').errorClasses;
	readonly errorLoggerDetails: typeof import('../utils/helpers').errorLoggerDetails;
	readonly ErrorSeverity: typeof import('../errors/errorClasses').ErrorSeverity;
	readonly errorLogger: typeof import('../services/errorLogger').errorLogger;
	readonly getCallerInfo: () => string;
	readonly processError: typeof import('../errors/processError').processError;
	readonly envSecretsStore: typeof import('../environment/envSecrets').envSecretsStore;
	readonly blankRequest: import('express').Request;
}

export interface InitExpressMiddlware {
	app: import('express').Application;
	middleware: import('express').RequestHandler;
	middlewareName: string;
}

export interface InitIpBlacklistInterface {
	fsModule: typeof import('fs');
	inRange: typeof import('range_check').inRange;
	configService: typeof import('../services/configService').configService;
	appLogger: AppLogger;
	errorLogger: typeof import('../services/errorLogger').errorLogger;
	errorClasses: typeof import('../errors/errorClasses').errorClasses;
	errorLoggerDetails: typeof import('../utils/helpers').errorLoggerDetails;
	getCallerInfo: typeof import('../utils/helpers').getCallerInfo;
	ErrorSeverity: typeof import('../errors/errorClasses').ErrorSeverity;
	expressErrorHandler: () => void;
	validateDependencies: (
		dependencies: DependencyInterface[],
		appLogger: AppLogger
	) => void;
}

export interface InitJwtAuthInterface {
	verifyJwt: (token: string) => Promise<string | object | null>;
	appLogger: AppLogger;
	errorClasses: typeof import('../errors/errorClasses').errorClasses;
	errorLogger: typeof import('../services/errorLogger').errorLogger;
	errorLoggerDetails: typeof import('../utils/helpers').errorLoggerDetails;
	getCallerInfo: typeof import('../utils/helpers').getCallerInfo;
	ErrorSeverity: typeof import('../errors/errorClasses').ErrorSeverity;
	expressErrorHandler: typeof import('../errors/processError').expressErrorHandler;
	processError: typeof import('../errors/processError').processError;
	validateDependencies: (
		dependencies: DependencyInterface[],
		appLogger: AppLogger
	) => void;
}

export interface InitMiddlewareParameters {
	appLogger: AppLogger;
	authenticateOptions: import('passport').AuthenticateOptions;
	configService: typeof import('../services/configService').configService;
	cookieParser: typeof import('cookie-parser');
	cors: typeof import('cors');
	express: typeof import('express');
	expressErrorHandler: ExpressErrorHandlerInterface;
	fsModule: typeof import('fs');
	getRedisClient: typeof import('../services/redis').getRedisClient;
	hpp: typeof import('hpp');
	initCsrf: typeof import('../middleware/csrf').initCsrf;
	initIpBlacklist: typeof import('../middleware/ipBlacklist').initIpBlacklist;
	initJwtAuth: typeof import('../middleware/jwtAuth').initJwtAuth;
	initializePassportAuthMiddleware: typeof import('../middleware/passportAuth').initializePassportAuthMiddleware;
	initializeRateLimitMiddleware: typeof import('../middleware/rateLimit').initializeRateLimitMiddleware;
	initializeSecurityHeaders: typeof import('../middleware/securityHeaders').initializeSecurityHeaders;
	initializeSlowdownMiddleware: typeof import('../middleware/slowdown').initializeSlowdownMiddleware;
	initializeValidatorMiddleware: typeof import('../middleware/validator').initializeValidatorMiddleware;
	morgan: typeof import('morgan');
	passport: typeof import('passport');
	processError: typeof import('../errors/processError').processError;
	session: typeof import('express-session');
	randomBytes: typeof import('crypto').randomBytes;
	redisClient: typeof import('../services/redis').getRedisClient;
	RedisStore: RedisStore;
	verifyJwt: (token: string) => Promise<string | object | null>;
}

export interface JwtUserInterface {
	id: string;
	username: string;
}

export interface LoadIpBlacklistInterface {
	fsModule: typeof import('fs').promises;
	appLogger: AppLogger;
	errorLogger: typeof import('../services/errorLogger').errorLogger;
	errorLoggerDetails: typeof import('../utils/helpers').errorLoggerDetails;
	getCallerInfo: typeof import('../utils/helpers').getCallerInfo;
	configService: typeof import('../services/configService').configService;
	errorClasses: typeof import('../errors/errorClasses').errorClasses;
	processError: typeof import('../errors/processError').processError;
	ErrorSeverity: typeof import('../errors/errorClasses').ErrorSeverity;
	validateDependencies: (
		dependencies: DependencyInterface[],
		appLogger: AppLogger
	) => void;
}

export interface MailerServiceInterface {
	readonly nodemailer: typeof import('nodemailer');
	readonly Transporter: import('nodemailer').Transporter;
	readonly emailUser: string;
	readonly configService: typeof import('../services/configService').configService;
	readonly appLogger: import('../services/appLogger').AppLogger;
	readonly validateDependencies: (
		dependencies: DependencyInterface[],
		appLogger: AppLogger
	) => void;
	readonly errorClasses: typeof import('../errors/errorClasses').errorClasses;
	readonly ErrorSeverity: typeof import('../errors/errorClasses').ErrorSeverity;
	readonly ErrorLogger: typeof import('../services/errorLogger').ErrorLogger;
	readonly processError: typeof import('../errors/processError').processError;
}

export interface MemoryMonitorInterface {
	os: typeof import('os');
	process: NodeJS.Process;
	setInterval: typeof setInterval;
	appLogger: import('../services/appLogger').AppLogger;
	configService: typeof import('../services/configService').configService;
	errorClasses: typeof import('../errors/errorClasses').errorClasses;
	ErrorSeverity: typeof import('../errors/errorClasses').ErrorSeverity;
	errorLogger: typeof import('../services/errorLogger').errorLogger;
	processError: typeof import('../errors/processError').processError;
	validateDependencies: (
		dependencies: DependencyInterface[],
		appLogger: AppLogger
	) => void;
}

export interface MemoryMonitorStats {
	rss: string;
	heapTotal: string;
	heapUsed: string;
	external: string;
	available: string;
}

export interface MulterServiceInterface {
	readonly multer: typeof import('multer');
	readonly path: typeof import('path');
	readonly storageDir: string;
	readonly allowedMimeTypes: string[];
	readonly allowedExtensions: string[];
	readonly fileSizeLimit: number;
	readonly configService: typeof import('../services/configService').configService;
	readonly appLogger: AppLogger;
	readonly errorClasses: typeof import('../errors/errorClasses').errorClasses;
	readonly ErrorSeverity: typeof import('../errors/errorClasses').ErrorSeverity;
	readonly ErrorLogger: typeof import('../services/errorLogger').ErrorLogger;
	readonly processError: typeof import('../errors/processError').processError;
	readonly validateDependencies: typeof import('../utils/helpers').validateDependencies;
}

export interface ModelType extends Model {
	id?: number | string;
}

export interface ModelOperations<T> {
	new (): T;
	findAll: () => Promise<T[]>;
	create: (values: Partial<T>) => Promise<T>;
	destroy: (options: { where: { id: number } }) => Promise<number>;
}

export interface ModelControllerInterface {
	appLogger: AppLogger;
	errorLogger: typeof import('../services/errorLogger').errorLogger;
	errorClasses: typeof import('../errors/errorClasses').errorClasses;
	ErrorSeverity: typeof import('../errors/errorClasses').ErrorSeverity;
	processError: typeof import('../errors/processError').processError;
}

export interface PassportAuthMiddlewareDependencies {
	passport: import('passport').PassportStatic;
	authenticateOptions: import('passport').AuthenticateOptions;
}

export interface PassportServiceInterface {
	readonly passport: import('passport').PassportStatic;
	readonly UserModel: ReturnType<
		typeof import('../models/UserModelFile').createUserModel
	>;
	readonly argon2: typeof import('argon2');
	readonly configService: typeof import('../services/configService').configService;
	readonly appLogger: AppLogger;
}

export interface PreInitIpBlacklistInterface {
	readonly fsModule: typeof import('fs').promises;
	readonly appLogger: AppLogger;
	readonly errorLogger: typeof import('../services/errorLogger').errorLogger;
	readonly errorClasses: typeof import('../errors/errorClasses').errorClasses;
	readonly errorLoggerDetails: typeof import('../utils/helpers').errorLoggerDetails;
	readonly getCallerInfo: typeof import('../utils/helpers').getCallerInfo;
	readonly ErrorSeverity: typeof import('../errors/errorClasses').ErrorSeverity;
	readonly configService: typeof import('../services/configService').configService;
	readonly processError: typeof import('../errors/processError').processError;
	readonly validateDependencies: (
		dependencies: DependencyInterface[],
		appLogger: AppLogger
	) => void;
}

export interface ProcessCriticalErrorInterface {
	appLogger: AppLogger;
	configService: typeof import('../services/configService').configService;
	fallbackLogger: Console;
	isAppLogger: typeof import('../services/appLogger').isAppLogger;
	error?: AppError | ClientError | Error | unknown;
	req?: Request;
	details: Record<string, unknown>;
}

export interface ProcessErrorInterface {
	appLogger: AppLogger;
	configService: typeof import('../services/configService').configService;
	errorLogger: typeof import('../services/errorLogger').errorLogger;
	errorLoggerDetails: typeof import('../utils/helpers').errorLoggerDetails;
	fallbackLogger: Console;
	isAppLogger: typeof import('../services/appLogger').isAppLogger;
	error: AppError | ClientError | Error | unknown;
	req?: Request;
	details?: Record<string, unknown>;
}

export interface ProcessErrorFnInterface {
	(params: ProcessErrorInterface): void;
}

export interface RedisServiceInterface {
	readonly createMemoryMonitor: typeof import('../middleware/memoryMonitor').createMemoryMonitor;
	readonly appLogger: import('../services/appLogger').AppLogger;
	readonly configService: typeof import('../services/configService').configService;
	readonly createRedisClient: typeof import('redis').createClient;
	readonly errorClasses: typeof import('../errors/errorClasses').errorClasses;
	readonly errorLogger: typeof import('../services/errorLogger').errorLogger;
	readonly errorLoggerDetails: typeof import('../utils/helpers').errorLoggerDetails;
	readonly ErrorSeverity: typeof import('../errors/errorClasses').ErrorSeverity;
	readonly validateDependencies: (
		dependencies: DependencyInterface[],
		appLogger: AppLogger
	) => void;
	readonly getCallerInfo: () => string;
	readonly processError: ProcessErrorFnInterface;
	readonly blankRequest: import('express').Request;
}

export interface RemoveIpFromBlacklistInterface {
	ip: string;
	appLogger: AppLogger;
	errorLogger: typeof import('../services/errorLogger').errorLogger;
	errorLoggerDetails: typeof import('../utils/helpers').errorLoggerDetails;
	getCallerInfo: typeof import('../utils/helpers').getCallerInfo;
	configService: typeof import('../services/configService').configService;
	errorClasses: typeof import('../errors/errorClasses').errorClasses;
	ErrorSeverity: typeof import('../errors/errorClasses').ErrorSeverity;
	processError: typeof import('../errors/processError').processError;
	validateDependencies: (
		dependencies: DependencyInterface[],
		appLogger: AppLogger
	) => void;
}

export interface RouteParams {
	app: import('express').Application;
	appLogger: AppLogger;
	configService: typeof import('../services/configService').configService;
}

export interface SaveIpBlacklistInterface {
	fsModule: typeof import('fs').promises;
	appLogger: AppLogger;
	errorLogger: typeof import('../services/errorLogger').errorLogger;
	getCallerInfo: typeof import('../utils/helpers').getCallerInfo;
	errorLoggerDetails: typeof import('../utils/helpers').errorLoggerDetails;
	configService: typeof import('../services/configService').configService;
	errorClasses: typeof import('../errors/errorClasses').errorClasses;
	ErrorSeverity: typeof import('../errors/errorClasses').ErrorSeverity;
	processError: typeof import('../errors/processError').processError;
	validateDependencies: (
		dependencies: DependencyInterface[],
		appLogger: AppLogger
	) => void;
}

export interface SecretsMap {
	[key: string]: string;
}

export interface SendClientErrorResponseInterface {
	message: string;
	statusCode: number;
	res: Response;
}

export interface TOTPMFA {
	QRCode: typeof import('qrcode');
	speakeasy: typeof import('speakeasy');
	appLogger: AppLogger;
	configService: typeof import('../services/configService').configService;
	errorClasses: typeof import('../errors/errorClasses').errorClasses;
	errorLogger: typeof import('../services/errorLogger').errorLogger;
	ErrorSeverity: typeof import('../errors/errorClasses').ErrorSeverity;
	processError: typeof import('../errors/processError').processError;
	validateDependencies: (
		dependencies: DependencyInterface[],
		appLogger: AppLogger
	) => void;
}

export interface SetUpDatabaseInterface {
	readonly appLogger: AppLogger;
	readonly errorLoggerDetails: typeof import('../utils/helpers').errorLoggerDetails;
	readonly getCallerInfo: () => string;
	readonly processError: ProcessErrorFnInterface;
	readonly configService: typeof import('../services/configService').configService;
	readonly errorLogger: typeof import('../services/errorLogger').errorLogger;
	readonly errorClasses: typeof import('../errors/errorClasses').errorClasses;
	readonly ErrorSeverity: typeof import('../errors/errorClasses').ErrorSeverity;
	readonly envSecretsStore: typeof import('../environment/envSecrets').envSecretsStore;
	readonly blankRequest: import('express').Request;
}

export interface SetUpWebServerInterface {
	app: import('express').Application;
	appLogger: AppLogger;
	blankRequest: import('express').Request;
	envVariables: EnvVariableTypes;
	errorLogger: typeof import('../services/errorLogger').errorLogger;
	errorLoggerDetails: typeof import('../utils/helpers').errorLoggerDetails;
	DeclareWebServerOptionsStaticParameters: DeclareWebServerOptionsInterface;
	featureFlags: FeatureFlagTypes;
	getCallerInfo: () => string;
	processError: ProcessErrorFnInterface;
	sequelize: import('sequelize').Sequelize | null;
}

export interface SetUpWebServerReturn {
	startServer: () => Promise<void>;
}

export interface TLSKeys {
	cert: string;
	key: string;
}

export interface TOTPSecretInterface {
	ascii: string;
	hex: string;
	base32: string;
	otpauth_url: string;
}

export interface UserInstanceInterface {
	id: string;
	username: string;
	comparePassword: (
		password: string,
		argon2: typeof import('argon2')
	) => Promise<boolean>;
}

export interface ValidateDependenciesInterface {
	validateDependencies(
		dependencies: DependencyInterface[],
		appLogger: AppLogger
	): void;
}

export interface VerifyPasskeyAuthInterface {
	assertion: import('fido2-lib').AssertionResult;
	expectedChallenge: string;
	publicKey: string;
	previousCounter: number;
	id: string;
	configService: typeof import('../services/configService').configService;
	appLogger: AppLogger;
}

export interface VerifyPasskeyRegistrationInterface {
	attestation: import('fido2-lib').AttestationResult;
	expectedChallenge: string;
	configService: typeof import('../services/configService').configService;
	appLogger: AppLogger;
}

export type WebServerOptions = import('tls').SecureContextOptions;

export interface YubClientInterface {
	verify(
		otp: string,
		callback: (err: Error | null, data: YubResponseInterface) => void
	): void;
}

export interface YubicoOtpMFAInterface {
	execSync: typeof import('child_process').execSync;
	getDirectoryPath: () => string;
	yub: typeof import('yub');
	appLogger: AppLogger;
	configService: typeof import('../services/configService').configService;
	errorClasses: typeof import('../errors/errorClasses').errorClasses;
	ErrorSeverity: typeof import('../errors/errorClasses').ErrorSeverity;
	ErrorLogger: typeof import('../services/errorLogger').errorLogger;
	processError: typeof import('../errors/processError').processError;
	validateDependencies: (
		dependencies: DependencyInterface[],
		logger: AppLogger
	) => void;
}

export interface YubicoOtpOptionsInterface {
	clientId: number;
	apiKey: string;
	apiUrl: string;
}

export interface YubResponseInterface {
	status: string;
	[key: string]: string | number | boolean | object | null | undefined;
}
