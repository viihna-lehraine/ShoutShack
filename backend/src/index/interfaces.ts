import { Model } from 'sequelize';
import { Logger as WinstonLogger } from 'winston';
import { NextFunction, Request, Response } from 'express';
import { AppError, ClientError } from '../errors/errorClasses';
import RedisStore from 'connect-redis';
import { AppLoggerType } from '../services/logger';
import { Sequelize } from 'sequelize';

//
///
//// ***** CUSTOM TYPE FILE IMPORTS ***** //
///
//

import '../../types/custom/yub.js';

//
///
//// ***** COMMONLY USED TYPE BLOCKS ***** //
///
//

export interface BaseExpressInterface {
	req: import('express').Request;
	res: import('express').Response;
	next: import('express').NextFunction;
}

export interface BaseInterface {
	appLogger: AppLoggerType;
	errorLogger: AppLoggerType;
	configService: typeof import('../services/configService').configService;
	blankRequest?: import('express').Request;
	req?: import('express').Request;
}

//
///
////  ***** FUNCTION INTERFACES ***** //
///
//

export interface HandleErrorFnInterface {
	(params: HandleErrorInterface): void;
}

//
///
//// ***** MAIN INTERFACE LIST ***** //
///
//

export interface AddIpToBlacklistInterface {
	ip: string;
	appLogger: AppLoggerInterface;
	errorLogger: AppLoggerInterface;
	errorHandler: typeof import('../services/errorHandler').errorHandler;
	configService: typeof import('../services/configService').configService;
	validateDependencies: (
		dependencies: DependencyInterface[],
		logger: AppLoggerInterface
	) => void;
}

export interface AppLoggerInterface extends WinstonLogger {
	getRedactedLogger(): AppLoggerInterface;
	logDebug(message: string, details?: Record<string, unknown>): void;
	logInfo(message: string, details?: Record<string, unknown>): void;
	logNotice(message: string, details?: Record<string, unknown>): void;
	logWarn(message: string, details?: Record<string, unknown>): void;
	logError(message: string, details?: Record<string, unknown>): void;
	logCritical(message: string, details?: Record<string, unknown>): void;
	cleanUpOldLogs(
		sequelize: Sequelize,
		retentionPeriodDays?: number
	): Promise<void>;
	getErrorDetails(
		getCallerInfo: () => string,
		action: string,
		req?: Request,
		userId?: string | null,
		additionalData?: Record<string, unknown>
	): Record<string, unknown>;
	isAppLogger(logger: unknown): logger is AppLoggerInterface | unknown;
}

export interface AuthControllerInterface {
	argon2: typeof import('argon2');
	execSync: typeof import('child_process').execSync;
	jwt: typeof import('jsonwebtoken');
	req: import('express').Request;
	res: import('express').Response;
	appLogger: AppLoggerInterface;
	errorLogger: AppLoggerInterface;
	createJwt: typeof import('../auth/jwt').createJwt;
	UserModel: typeof import('../models/UserModelFile').User;
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
	appLogger: AppLoggerInterface;
}

export interface ConfigSecretsInterface {
	readonly logger: AppLoggerInterface;
	readonly execSync: typeof import('child_process').execSync;
	readonly getDirectoryPath: () => string;
	readonly gpgPassphrase: string;
}

export interface ConfigServiceInterface {
	logger: AppLoggerInterface;
	getAppLogger(): AppLoggerType;
	getEnvVariables(): EnvVariableTypes;
	getFeatureFlags(): FeatureFlagTypes;
	getSecrets(
		keys: string | string[],
		appLogger: AppLoggerType
	): Record<string, string | undefined> | string | undefined;
	refreshSecrets(dependencies: ConfigSecretsInterface): void;
}

export interface CreateFeatureEnablerInterface {
	readonly appLogger: AppLoggerType;
	readonly errorLogger: AppLoggerType;
}

export interface CreateJwtInterface {
	jwt: typeof import('jsonwebtoken');
	execSync: typeof import('child_process').execSync;
	configService: typeof import('../services/configService').configService;
	appLogger: AppLoggerType;
	errorLogger: AppLoggerType;
	errorHandler: typeof import('../services/errorHandler').errorHandler;
	validateDependencies: (
		dependencies: DependencyInterface[],
		logger: import('../services/logger').AppLoggerType
	) => void;
	envSecretsStore: typeof import('../environment/envSecrets').envSecretsStore;
}

export interface CsrfMiddlewareInterface {
	req: import('express').Request;
	res: import('express').Response;
	next: import('express').NextFunction;
}

export interface DeclareWebServerOptionsInterface {
	logger: AppLoggerInterface;
	blankRequest: import('express').Request;
	configService: typeof import('../services/configService').configService;
	constants: typeof import('crypto').constants;
	errorLogger: AppLoggerInterface;
	errorHandler: typeof import('../services/errorHandler').errorHandler;
	fs: typeof import('fs').promises;
	getCallerInfo: () => string;
	tlsCiphers: string[];
	validateDependencies: (
		dependencies: DependencyInterface[],
		logger: AppLoggerInterface
	) => void;
}

export interface DependencyInterface {
	name: string;
	instance: unknown;
}

export interface DisplayEnvAndFeatueFlagsInterface {
	readonly logger: AppLoggerInterface;
	readonly errorLogger: AppLoggerInterface;
	readonly ErrorSeverity: typeof import('../errors/errorClasses').ErrorSeverity;
	readonly handleError: (params: Partial<HandleErrorFnInterface>) => void;
}

export interface EmailMFAInterface {
	bcrypt: typeof import('bcrypt');
	jwt: typeof import('jsonwebtoken');
	configService: typeof import('../services/configService').configService;
	validateDependencies: (
		dependencies: DependencyInterface[],
		logger: AppLoggerInterface
	) => void;
}

export interface EnvVariableTypes {
	batchReEncryptSecretsInterval: number;
	clearExpiredSecretsInterval: number;
	cronLoggerSetting: number;
	dbDialect: 'mariadb' | 'mssql' | 'mysql' | 'postgres' | 'sqlite';
	dbHost: string;
	dbInitMaxRetries: number;
	dbInitRetryAfter: number;
	dbName: string;
	dbUser: string;
	diskPath: string;
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
	loggerServiceName: string;
	logLevel: 'debug' | 'info' | 'warn' | 'error';
	logStashHost: string;
	logStashNode: string;
	logStashPort: number;
	memoryLimit: number;
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
	staticRootPath: string;
	tempDir: string;
	tlsCertPath1: string;
	tlsKeyPath1: string;
	yubicoApiUrl: string;
}

export interface ErrorHandlerInterface {
	handleError(params: {
		error: unknown;
		req?: Request;
		details?: Record<string, unknown>;
		severity?: import('../errors/errorClasses').ErrorSeverityType;
		action?: string;
		userId?: string;
		sequelize?: Sequelize;
	}): void;

	expressErrorHandler(): (
		err: AppError | ClientError | Error | Record<string, unknown>,
		req: Request,
		res: Response,
		next: NextFunction
	) => void;

	handleCriticalError(params: {
		error: unknown;
		req?: Request;
		details?: Record<string, unknown>;
	}): void;

	sendClientErrorResponse(params: {
		message: string;
		statusCode?: number;
		res: Response;
		responseId?: string;
	}): Promise<void>;
}

export interface ErrorLoggerInstanceInterface {
	readonly configService: typeof import('../services/configService').configService;
	readonly validateDependencies: (
		dependencies: DependencyInterface[],
		logger: AppLoggerInterface
	) => void;
	readonly ErrorClasses: typeof import('../errors/errorClasses').ErrorClasses;
	readonly ErrorSeverity: string;
	readonly handleError: typeof import('../services/errorHandler').errorHandler.handleError;
}

export interface ExpressErrorHandlerInterface {
	expressError: AppError | ClientError | Error;
	req: Request;
	res: Response;
	next: NextFunction;
	logger: AppLoggerInterface;
	configService: typeof import('../services/configService').configService;
	errorLogger: AppLoggerInterface;
	fallbackLogger: Console;
	errorResponse?: string;
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
	logAppError(
		error: AppError,
		sequelize: Sequelize,
		details?: Record<string, unknown>
	): void;
	logToDatabase(
		error: AppError,
		sequelize: Sequelize,
		retryCount?: number
	): Promise<void>;
	getErrorCount(errorName: string): number;
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
	readonly createMemoryMonitor: typeof import('../services/resourceManager').createMemoryMonitor;
	readonly configService: typeof import('../services/configService').configService;
	readonly errorHandler: typeof import('../services/errorHandler').errorHandler;
	readonly createRedisClient: typeof import('redis').createClient;
	readonly blankRequest?: import('express').Request;
}

export interface GetFeatureFlagsInterface {
	blankRequest: import('express').Request;
	errorLogger: AppLoggerInterface;
	errorHandler: typeof import('../services/errorHandler').errorHandler;
}

export interface GeneratePasskeyInterface {
	user: FidoUserInterface;
	configService: typeof import('../services/configService').configService;
	logger: AppLoggerInterface;
}

export interface GeneratePasskeyInterface {
	user: FidoUserInterface;
	configService: typeof import('../services/configService').configService;
	logger: AppLoggerInterface;
}

export interface GetRedisClientInterface {
	readonly createRedisClient: typeof import('redis').createClient;
	readonly createMemoryMonitor: typeof import('../services/resourceManager').createMemoryMonitor;
	readonly configService: typeof import('../services/configService').configService;
	readonly errorHandler: typeof import('../services/errorHandler').errorHandler;
}

export interface HandleCriticalErrorInterface {
	error: unknown;
	req?: Request;
	details?: Record<string, unknown>;
}

export interface HandleErrorInterface {
	error: unknown;
	req?: Request;
	details?: Record<string, unknown>;
	severity?: import('../errors/errorClasses').ErrorSeverityType;
	action?: string;
	userId?: string;
	sequelize?: Sequelize;
}

export interface HashPasswordInterface {
	password: string;
	configService: typeof import('../services/configService');
	logger: AppLoggerInterface;
}

export interface InitCsrfInterface {
	csrf: typeof import('csrf');
	logger: AppLoggerInterface;
	errorLogger: AppLoggerInterface;
	errorHandler: typeof import('../services/errorHandler').errorHandler;
}

export interface InitDatabaseInterface {
	logger: AppLoggerInterface;
	configService: typeof import('../services/configService').configService;
	maxRetries: number;
	retryAfter: number;
}

export interface InitializeDatabaseInterface {
	readonly dbInitMaxRetries: number;
	readonly dbInitRetryAfter: number;
	readonly logger: AppLoggerInterface;
	readonly configService: typeof import('../services/configService').configService;
	readonly errorLogger: AppLoggerInterface;
	readonly errorHandler: typeof import('../services/errorHandler').errorHandler;
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
	logger: AppLoggerInterface;
	errorLogger: AppLoggerInterface;
	errorHandler: typeof import('../services/errorHandler').errorHandler;
	validateDependencies: (
		dependencies: DependencyInterface[],
		logger: AppLoggerInterface
	) => void;
}

export interface InitJwtAuthInterface {
	verifyJwt: (token: string) => Promise<string | object | null>;
	logger: AppLoggerInterface;
	errorLogger: AppLoggerInterface;
	errorHandler: typeof import('../services/errorHandler').errorHandler;
	validateDependencies: (
		dependencies: DependencyInterface[],
		appLogger: AppLoggerInterface
	) => void;
}

export interface InitMiddlewareParameters {
	logger: AppLoggerInterface;
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
	handleError: typeof import('../services/errorHandler').errorHandler;
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
	logger: AppLoggerInterface;
	errorLogger: AppLoggerInterface;
	configService: typeof import('../services/configService').configService;
	validateDependencies: (
		dependencies: DependencyInterface[],
		appLogger: AppLoggerInterface
	) => void;
}

export interface MailerServiceInterface {
	readonly nodemailer: typeof import('nodemailer');
	readonly Transporter: import('nodemailer').Transporter;
	readonly emailUser: string;
	readonly configService: typeof import('../services/configService').configService;
	readonly logger: AppLoggerInterface;
	readonly validateDependencies: (
		dependencies: DependencyInterface[],
		appLogger: AppLoggerInterface
	) => void;
	readonly ErrorLogger: AppLoggerInterface;
	readonly errorHandler: typeof import('../services/errorHandler').errorHandler;
}

export interface MemoryMonitorInterface {
	os: typeof import('os');
	process: NodeJS.Process;
	setInterval: typeof setInterval;
	logger: AppLoggerInterface;
	configService: typeof import('../services/configService').configService;
	errorLogger: AppLoggerInterface;
	handleError: typeof import('../services/errorHandler').errorHandler;
	validateDependencies: (
		dependencies: DependencyInterface[],
		logger: AppLoggerInterface
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
	readonly appLogger: AppLoggerInterface;
	readonly ErrorLogger: AppLoggerInterface;
	readonly handleError: typeof import('../services/errorHandler').errorHandler;
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
	logger: AppLoggerInterface;
	errorLogger: AppLoggerInterface;
	handleError: typeof import('../services/errorHandler').errorHandler;
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
	readonly logger: AppLoggerInterface;
}

export interface PreInitIpBlacklistInterface {
	readonly fsModule: typeof import('fs').promises;
	readonly logger: AppLoggerInterface;
	readonly errorLogger: AppLoggerInterface;
	readonly configService: typeof import('../services/configService').configService;
	readonly errorHandler: typeof import('../services/errorHandler').errorHandler;
	readonly validateDependencies: (
		dependencies: DependencyInterface[],
		logger: AppLoggerInterface
	) => void;
}

export interface RedisServiceInterface {
	readonly createMemoryMonitor: typeof import('../services/resourceManager').createMemoryMonitor;
	readonly configService: typeof import('../services/configService').configService;
	readonly createRedisClient: typeof import('redis').createClient;
	readonly validateDependencies: (
		dependencies: DependencyInterface[],
		logger: AppLoggerInterface
	) => void;
	readonly errorHandler: typeof import('../services/errorHandler').errorHandler;
	readonly blankRequest: import('express').Request;
}

export interface RemoveIpFromBlacklistInterface {
	ip: string;
	logger: AppLoggerInterface;
	configService: typeof import('../services/configService').configService;
	errorLogger: AppLoggerInterface;
	errorHandler: typeof import('../services/errorHandler').errorHandler;
	validateDependencies: (
		dependencies: DependencyInterface[],
		logger: AppLoggerInterface
	) => void;
}

export interface RouteParams {
	app: import('express').Application;
	logger: AppLoggerInterface;
	configService: typeof import('../services/configService').configService;
}

export interface SaveIpBlacklistInterface {
	fsModule: typeof import('fs').promises;
	logger: AppLoggerInterface;
	configService: typeof import('../services/configService').configService;
	errorLogger: AppLoggerInterface;
	errorHandler: typeof import('../services/errorHandler').errorHandler;
	validateDependencies: (
		dependencies: DependencyInterface[],
		logger: AppLoggerInterface
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

export interface SetUpDatabaseInterface {
	readonly logger: AppLoggerInterface;
	readonly errorHandler: typeof import('../services/errorHandler').errorHandler;
	readonly configService: typeof import('../services/configService').configService;
	readonly errorLogger: AppLoggerInterface;
	readonly envSecretsStore: typeof import('../environment/envSecrets').envSecretsStore;
	readonly blankRequest?: import('express').Request;
}

export interface SetUpWebServerInterface {
	app: import('express').Application;
	logger: AppLoggerInterface;
	blankRequest: import('express').Request;
	envVariables: EnvVariableTypes;
	errorLogger: AppLoggerInterface;
	DeclareWebServerOptionsStaticParameters: DeclareWebServerOptionsInterface;
	featureFlags: FeatureFlagTypes;
	getCallerInfo: () => string;
	handleError: HandleErrorFnInterface;
	sequelize: import('sequelize').Sequelize | null;
}

export interface SetUpWebServerReturn {
	startServer: () => Promise<void>;
}

export interface TLSKeys {
	cert: string;
	key: string;
}

export interface TOTPMFA {
	QRCode: typeof import('qrcode');
	speakeasy: typeof import('speakeasy');
	logger: AppLoggerInterface;
	configService: typeof import('../services/configService').configService;
	errorLogger: AppLoggerInterface;
	handleError: typeof import('../services/errorHandler').errorHandler;
	validateDependencies: (
		dependencies: DependencyInterface[],
		logger: AppLoggerInterface
	) => void;
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
		logger: AppLoggerInterface
	): void;
}

export interface VerifyPasskeyAuthInterface {
	assertion: import('fido2-lib').AssertionResult;
	expectedChallenge: string;
	publicKey: string;
	previousCounter: number;
	id: string;
	configService: typeof import('../services/configService').configService;
	logger: AppLoggerInterface;
}

export interface VerifyPasskeyRegistrationInterface {
	attestation: import('fido2-lib').AttestationResult;
	expectedChallenge: string;
	configService: typeof import('../services/configService').configService;
	logger: AppLoggerInterface;
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
	logger: AppLoggerInterface;
	configService: typeof import('../services/configService').configService;
	ErrorLogger: AppLoggerInterface;
	handleError: typeof import('../services/errorHandler').errorHandler;
	validateDependencies: (
		dependencies: DependencyInterface[],
		logger: AppLoggerInterface
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
