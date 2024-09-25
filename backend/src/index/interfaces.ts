import { Model } from 'sequelize';
import { Logger as WinstonLogger } from 'winston';
import { NextFunction, Request, Response } from 'express';
import { AppError, ClientError, ErrorClasses } from '../errors/errorClasses';
import RedisStore from 'connect-redis';
import { Transporter } from 'nodemailer';
import { Sequelize } from 'sequelize';
import { Session } from 'express-session';

//
///
//// ***** CUSTOM TYPE FILE IMPORTS ***** //
///
//

import '../../types/custom/yub.js';
import '../../types/custom/winston-logstash';

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
	logger: AppLoggerServiceInterface;
	errorLogger: AppLoggerServiceInterface;
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
	configService: typeof import('../services/configService').configService;
	errorHandler: typeof import('../services/errorHandler').errorHandler;
	validateDependencies: (
		dependencies: DependencyInterface[],
		logger: AppLoggerServiceInterface
	) => void;
}

export interface AuthControllerInterface {
	argon2: typeof import('argon2');
	execSync: typeof import('child_process').execSync;
	jwt: ReturnType<typeof import('../auth/jwt').createJwt>;
	req: import('express').Request;
	res: import('express').Response;
	configService: typeof import('../services/configService').configService;
	errorHandler: typeof import('../services/errorHandler').errorHandler;
	envSecretsStore: typeof import('../environment/envSecrets').envSecretsStore;
	createJwt: typeof import('../auth/jwt').createJwt;
	UserModel: typeof import('../models/UserModelFile').User;
	validateDependencies: (
		dependencies: DependencyInterface[],
		logger: AppLoggerServiceInterface
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
	appLogger: AppLoggerServiceInterface;
}

export interface ConfigSecretsInterface {
	readonly logger: AppLoggerServiceInterface;
	readonly execSync: typeof import('child_process').execSync;
	readonly getDirectoryPath: () => string;
	readonly gpgPassphrase: string;
}

export interface CreateFeatureEnablerInterface {
	readonly configService: typeof import('../services/configService').configService;
}

export interface CreateJwtInterface {
	jwt: typeof import('jsonwebtoken');
	execSync: typeof import('child_process').execSync;
	configService: typeof import('../services/configService').configService;
	appLogger: AppLoggerServiceInterface;
	errorLogger: AppLoggerServiceInterface;
	errorHandler: typeof import('../services/errorHandler').errorHandler;
	validateDependencies: (
		dependencies: DependencyInterface[],
		logger: AppLoggerServiceInterface
	) => void;
	envSecretsStore: typeof import('../environment/envSecrets').envSecretsStore;
}

export interface CsrfMiddlewareInterface {
	req: import('express').Request;
	res: import('express').Response;
	next: import('express').NextFunction;
}

export interface DeclareWebServerOptionsInterface {
	logger: AppLoggerServiceInterface;
	blankRequest: import('express').Request;
	configService: typeof import('../services/configService').configService;
	constants: typeof import('crypto').constants;
	errorLogger: AppLoggerServiceInterface;
	errorHandler: typeof import('../services/errorHandler').errorHandler;
	fs: typeof import('fs').promises;
	getCallerInfo: () => string;
	tlsCiphers: string[];
	validateDependencies: (
		dependencies: DependencyInterface[],
		logger: AppLoggerServiceInterface
	) => void;
}

export interface DependencyInterface {
	name: string;
	instance: unknown;
}

export interface DisplayEnvAndFeatueFlagsInterface {
	readonly logger: AppLoggerServiceInterface;
	readonly errorLogger: AppLoggerServiceInterface;
	readonly ErrorSeverity: typeof import('../errors/errorClasses').ErrorSeverity;
	readonly handleError: (params: Partial<HandleErrorFnInterface>) => void;
}

export interface EmailMFAInterface {
	bcrypt: typeof import('bcrypt');
	jwt: typeof import('jsonwebtoken');
	configService: typeof import('../services/configService').configService;
	validateDependencies: (
		dependencies: DependencyInterface[],
		logger: AppLoggerServiceInterface
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
	featureEnableSession: boolean;
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
	multerFileSizeLimit: number;
	multerStorageDir: string;
	multerUploadDir: string;
	npmLogPath: string;
	nodeEnv: 'development' | 'testing' | 'production';
	primaryLogPath: string;
	rateLimiterBaseDuration: number;
	rateLimiterBasePoints: number;
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
	slowdownThreshold: number;
	tempDir: string;
	tlsCertPath1: string;
	tlsKeyPath1: string;
	yubicoApiUrl: string;
}

export interface ExpressErrorHandlerInterface {
	expressError: AppError | ClientError | Error;
	req: Request;
	res: Response;
	next: NextFunction;
	logger: AppLoggerServiceInterface;
	configService: typeof import('../services/configService').configService;
	errorLogger: AppLoggerServiceInterface;
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
	[key: string]: boolean;
}

export interface FidoUserInterface {
	id: string;
	email: string;
	username: string;
	credential: {
		credentialId: string;
	}[];
}

export interface FlushRedisMemoryCacheInterface {
	readonly req: import('express').Request;
	readonly res: import('express').Response;
	readonly next: import('express').NextFunction;
	readonly blankRequest: import('express').Request;
	readonly configService: typeof import('../services/configService').configService;
	readonly errorHandler: typeof import('../services/errorHandler').errorHandler;
	readonly createRedisClient: typeof import('redis').createClient;
}

export interface GetFeatureFlagsInterface {
	blankRequest: import('express').Request;
	errorLogger: AppLoggerServiceInterface;
	errorHandler: typeof import('../services/errorHandler').errorHandler;
}

export interface GeneratePasskeyInterface {
	user: FidoUserInterface;
	configService: typeof import('../services/configService').configService;
	logger: AppLoggerServiceInterface;
}

export interface GeneratePasskeyInterface {
	user: FidoUserInterface;
	configService: typeof import('../services/configService').configService;
	logger: AppLoggerServiceInterface;
}

export interface GetRedisClientInterface {
	readonly req: import('express').Request;
	readonly res: import('express').Response;
	readonly next: import('express').NextFunction;
	readonly blankRequest: import('express').Request;
	readonly createRedisClient: typeof import('redis').createClient;
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
	logger: AppLoggerServiceInterface;
}

export interface InitCsrfInterface {
	csrf: typeof import('csrf');
	configService: typeof import('../services/configService').configService;
	errorHandler: typeof import('../services/errorHandler').errorHandler;
}

export interface InitDatabaseInterface {
	logger: AppLoggerServiceInterface;
	configService: typeof import('../services/configService').configService;
	maxRetries: number;
	retryAfter: number;
}

export interface InitializeDatabaseInterface {
	readonly dbInitMaxRetries: number;
	readonly dbInitRetryAfter: number;
	readonly logger: AppLoggerServiceInterface;
	readonly configService: typeof import('../services/configService').configService;
	readonly errorLogger: AppLoggerServiceInterface;
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
	logger: AppLoggerServiceInterface;
	errorLogger: AppLoggerServiceInterface;
	errorHandler: typeof import('../services/errorHandler').errorHandler;
	validateDependencies: (
		dependencies: DependencyInterface[],
		logger: AppLoggerServiceInterface
	) => void;
}

export interface InitJwtAuthInterface {
	verifyJwt: (token: string) => Promise<string | object | null>;
	logger: AppLoggerServiceInterface;
	errorLogger: AppLoggerServiceInterface;
	errorHandler: typeof import('../services/errorHandler').errorHandler;
	validateDependencies: (
		dependencies: DependencyInterface[],
		appLogger: AppLoggerServiceInterface
	) => void;
}

export interface InitMiddlewareParameters {
	logger: AppLoggerServiceInterface;
	authenticateOptions: import('passport').AuthenticateOptions;
	configService: typeof import('../services/configService').configService;
	cookieParser: typeof import('cookie-parser');
	cors: typeof import('cors');
	express: typeof import('express');
	expressErrorHandler: ExpressErrorHandlerInterface;
	fsModule: typeof import('fs');
	// 	getRedisClient;
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
	// redisClient: typeof import('../services/redis').getRedisClient;
	RedisStore: RedisStore;
	verifyJwt: (token: string) => Promise<string | object | null>;
}

export interface JwtUserInterface {
	id: string;
	username: string;
}

export interface LoadIpBlacklistInterface {
	fsModule: typeof import('fs').promises;
	configService: typeof import('../services/configService').configService;
	errorHandler: typeof import('../services/errorHandler').errorHandler;
}

export interface MailOptions {
	from: string;
	to: string;
	subject: string;
	text?: string;
	html?: string;
}

export interface MailerServiceDeps {
	nodemailer: typeof import('nodemailer');
	emailUser: string;
	logger: AppLoggerServiceInterface;
	errorLogger: AppLoggerServiceInterface;
	configService: typeof import('../services/configService').configService;
	errorHandler: typeof import('../services/errorHandler').errorHandler;
	validateDependencies: (
		dependencies: DependencyInterface[],
		logger: AppLoggerServiceInterface
	) => void;
}

export interface MailerServiceInterface {
	getTransporter(): Promise<Transporter>;
	validateMailerDependencies(): void;
	createMailTransporter(): Promise<Transporter>;
}

export interface MemoryMonitorInterface {
	os: typeof import('os');
	process: NodeJS.Process;
	setInterval: typeof setInterval;
	logger: AppLoggerServiceInterface;
	configService: typeof import('../services/configService').configService;
	errorLogger: AppLoggerServiceInterface;
	handleError: typeof import('../services/errorHandler').errorHandler;
	validateDependencies: (
		dependencies: DependencyInterface[],
		logger: AppLoggerServiceInterface
	) => void;
}

export interface MemoryMonitorStats {
	rss: string;
	heapTotal: string;
	heapUsed: string;
	external: string;
	available: string;
}

export interface MulterUploadServiceDeps {
	multer: typeof import('multer');
	path: typeof import('path');
	configService: typeof import('../services/configService').configService;
	logger: AppLoggerServiceInterface;
	errorLogger: AppLoggerServiceInterface;
	errorHandler: ErrorHandlerServiceInterface;
	validateDependencies: (
		dependencies: DependencyInterface[],
		logger: AppLoggerServiceInterface
	) => void;
	allowedMimeTypes?: string[];
	allowedExtensions?: string[];
}

export interface MulterUploadServiceInterface {
	setFileSizeLimit(limit: number): void;
	setAllowedMimeTypes(mimeTypes: string[]): void;
	setAllowedExtensions(extensions: string[]): void;
	createMulterUpload(
		validationCallback?: (file: Express.Multer.File) => boolean
	): import('multer').Multer;
	onUploadSuccess(callback: (file: Express.Multer.File) => void): void;
}

export interface ModelType extends Model {
	id?: number;
}

export interface ModelOperations<T> {
	new (): T;
	findAll: () => Promise<T[]>;
	create: (values: Partial<T>) => Promise<T>;
	destroy: (options: { where: { id: number } }) => Promise<number>;
}

export interface ModelControllerInterface {
	configService: typeof import('../services/configService').configService;
	errorHandler: typeof import('../services/errorHandler').errorHandler;
}

export interface PassportAuthMiddlewareDependencies {
	passport: import('passport').PassportStatic;
	authenticateOptions: import('passport').AuthenticateOptions;
	logger: AppLoggerServiceInterface;
	errorLogger: AppLoggerServiceInterface;
	errorHandler: typeof import('../services/errorHandler').errorHandler;
	validateDependencies: (
		dependencies: DependencyInterface[],
		logger: AppLoggerServiceInterface
	) => void;
}

export interface PassportServiceInterface {
	readonly passport: import('passport').PassportStatic;
	readonly UserModel: ReturnType<
		typeof import('../models/UserModelFile').createUserModel
	>;
	readonly argon2: typeof import('argon2');
	readonly configService: typeof import('../services/configService').configService;
	readonly logger: AppLoggerServiceInterface;
}

export interface PreInitIpBlacklistInterface {
	readonly fsModule: typeof import('fs').promises;
	readonly configService: typeof import('../services/configService').configService;
	readonly errorHandler: typeof import('../services/errorHandler').errorHandler;
}

export interface RedisServiceDeps {
	readonly req: import('express').Request;
	readonly res: import('express').Response;
	readonly next: import('express').NextFunction;
	readonly configService: typeof import('../services/configService').configService;
	readonly createRedisClient: typeof import('redis').createClient;
	readonly validateDependencies: (
		dependencies: DependencyInterface[],
		logger: AppLoggerServiceInterface
	) => void;
	readonly errorHandler: typeof import('../services/errorHandler').errorHandler;
	readonly blankRequest: import('express').Request;
}

export interface RedisServiceInterface {
	connectRedis(
		deps: RedisServiceDeps
	): Promise<import('redis').RedisClientType | null>;
	getRedisClient(
		deps: GetRedisClientInterface
	): Promise<import('redis').RedisClientType | null>;
	flushRedisMemoryCache(deps: FlushRedisMemoryCacheInterface): Promise<void>;
}

export interface RemoveIpFromBlacklistInterface {
	ip: string;
	logger: AppLoggerServiceInterface;
	errorLogger: AppLoggerServiceInterface;
	configService: typeof import('../services/configService').configService;
	errorHandler: typeof import('../services/errorHandler').errorHandler;
	validateDependencies: (
		dependencies: DependencyInterface[],
		logger: AppLoggerServiceInterface
	) => void;
}

export interface RouteParams {
	app: import('express').Application;
	configService: typeof import('../services/configService').configService;
}

export interface SaveIpBlacklistInterface {
	fsModule: typeof import('fs').promises;
	configService: typeof import('../services/configService').configService;
	errorHandler: typeof import('../services/errorHandler').errorHandler;
}

export interface SecretsMap {
	[key: string]: string;
}

export interface SecurityHeadersInterface {
	helmetOptions?: typeof import('../config/securityOptions').helmetOptions;
	permissionsPolicyOptions?: {
		[key: string]: string[];
	};
	logger: AppLoggerServiceInterface;
	errorLogger: AppLoggerServiceInterface;
	errorHandler: typeof import('../services/errorHandler').errorHandler;
	validateDependencies: (
		dependencies: DependencyInterface[],
		logger: AppLoggerServiceInterface
	) => void;
}

export interface SendClientErrorResponseInterface {
	message: string;
	statusCode: number;
	res: Response;
}

export interface SetUpDatabaseInterface {
	readonly logger: AppLoggerServiceInterface;
	readonly errorHandler: typeof import('../services/errorHandler').errorHandler;
	readonly configService: typeof import('../services/configService').configService;
	readonly errorLogger: AppLoggerServiceInterface;
	readonly envSecretsStore: typeof import('../environment/envSecrets').envSecretsStore;
	readonly blankRequest?: import('express').Request;
}

export interface SetUpWebServerInterface {
	app: import('express').Application;
	logger: AppLoggerServiceInterface;
	blankRequest: import('express').Request;
	envVariables: EnvVariableTypes;
	errorLogger: AppLoggerServiceInterface;
	errorHandler: typeof import('../services/errorHandler').errorHandler;
	DeclareWebServerOptionsStaticParameters: DeclareWebServerOptionsInterface;
	featureFlags: FeatureFlagTypes;
	getCallerInfo: () => string;
	handleError: HandleErrorFnInterface;
	sequelize: import('sequelize').Sequelize | null;
}

export interface SetUpWebServerReturn {
	startServer: () => Promise<void>;
}

export interface SlowdownConfigInterface {
	slowdownThreshold: number;
	configService: typeof import('../services/configService').configService;
	logger: AppLoggerServiceInterface;
	errorLogger: AppLoggerServiceInterface;
	errorHandler: typeof import('../services/errorHandler').errorHandler;
	validateDependencies: (
		dependencies: DependencyInterface[],
		logger: AppLoggerServiceInterface
	) => void;
}

export interface SlowdownSessionInterface extends Session {
	lastRequestTime?: number;
}

export interface StaticRoutesInterface {
	staticRootPath: string;
	secretsPath: string;
	configService: typeof import('../services/configService').configService;
	logger: AppLoggerServiceInterface;
	errorLogger: AppLoggerServiceInterface;
	errorHandler: typeof import('../services/errorHandler').errorHandler;
	validateDependencies: (
		dependencies: DependencyInterface[],
		logger: AppLoggerServiceInterface
	) => void;
}

export interface UserInstanceInterface {
	id: string;
	userid: number;
	username: string;
	password: string;
	email: string;
	isAccountVerified: boolean;
	resetPasswordToken: string | null;
	resetPasswordExpires: Date | null;
	isMfaEnabled: boolean;
	creationDate: Date;
	comparePassword: (
		password: string,
		argon2: typeof import('argon2')
	) => Promise<boolean>;
	save: () => Promise<void>;
}

export interface UserRoutesInterface {
	UserRoutes: UserRoutesModelInterface;
	argon2: {
		hash(
			data: string | Buffer,
			options?: Record<string, unknown>
		): Promise<string>;
		verify(
			plain: string | Buffer,
			hash: string,
			options?: Record<string, unknown>
		): Promise<boolean>;
		argon2id: number;
	};
	jwt: typeof import('jsonwebtoken');
	axios: {
		get<T>(url: string, config?: object): Promise<{ data: T }>;
		post<T>(
			url: string,
			data?: unknown,
			config?: object
		): Promise<{ data: T }>;
		put<T>(
			url: string,
			data?: unknown,
			config?: object
		): Promise<{ data: T }>;
		delete<T>(url: string, config?: object): Promise<{ data: T }>;
	};
	bcrypt: typeof import('bcrypt');
	uuidv4: () => string;
	xss: (input: string) => string;
	generateConfirmationEmailTemplate: (
		userName: string,
		confirmationLink: string
	) => string;
	getTransporter: (deps: MailerServiceInterface) => Promise<Transporter>;
	totpMfa: {
		generateQRCode(otpauth_url: string): Promise<string>;
		generateTOTPSecret(): TOTPSecretInterface;
		verifyTOTPToken(secret: string, token: string): boolean;
	};
}

export interface UserRoutesModelInterface {
	validatePassword: (password: string) => boolean;
	findOne: (criteria: object) => Promise<UserInstanceInterface | null>;
	create: (
		user: Partial<UserInstanceInterface>
	) => Promise<UserInstanceInterface>;
}

export interface TestRoutesInterface {
	app: import('express').Application;
}

export interface TLSKeys {
	cert: string;
	key: string;
}

export interface TOTPMFA {
	QRCode: typeof import('qrcode');
	speakeasy: typeof import('speakeasy');
	logger: AppLoggerServiceInterface;
	configService: typeof import('../services/configService').configService;
	errorLogger: AppLoggerServiceInterface;
	handleError: typeof import('../services/errorHandler').errorHandler;
	validateDependencies: (
		dependencies: DependencyInterface[],
		logger: AppLoggerServiceInterface
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

export interface ValidatorInterface {
	logger: AppLoggerServiceInterface;
	errorLogger: AppLoggerServiceInterface;
	errorHandler: typeof import('../services/errorHandler').errorHandler;
	validator: typeof import('validator');
}

export interface ValidateDependenciesInterface {
	validateDependencies(
		dependencies: DependencyInterface[],
		logger: AppLoggerServiceInterface
	): void;
}

export interface VerifyPasskeyAuthInterface {
	assertion: import('fido2-lib').AssertionResult;
	expectedChallenge: string;
	publicKey: string;
	previousCounter: number;
	id: string;
	configService: typeof import('../services/configService').configService;
	logger: AppLoggerServiceInterface;
}

export interface VerifyPasskeyRegistrationInterface {
	attestation: import('fido2-lib').AttestationResult;
	expectedChallenge: string;
	configService: typeof import('../services/configService').configService;
	logger: AppLoggerServiceInterface;
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
	logger: AppLoggerServiceInterface;
	configService: typeof import('../services/configService').configService;
	ErrorLogger: AppLoggerServiceInterface;
	handleError: typeof import('../services/errorHandler').errorHandler;
	validateDependencies: (
		dependencies: DependencyInterface[],
		logger: AppLoggerServiceInterface
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

//
///
//// ***** SERVICE INTERFACES ***** /////////
///
//

export interface AppLoggerServiceInterface extends WinstonLogger {
	getRedactedLogger(): AppLoggerServiceInterface;
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
	isAppLogger(logger: unknown): logger is AppLoggerServiceInterface | unknown;
}

export interface ConfigServiceInterface {
	logger: AppLoggerServiceInterface;
	getLogger(): AppLoggerServiceInterface;
	getEnvVariables(): EnvVariableTypes;
	getFeatureFlags(): FeatureFlagTypes;
	getSecrets(
		keys: string | string[],
		logger: AppLoggerServiceInterface
	): Record<string, string | undefined> | string | undefined;
	refreshSecrets(dependencies: ConfigSecretsInterface): void;
}

export interface DatabaseServiceInterface {
	initializeDatabase(): Promise<Sequelize>;
	getInstance(): Sequelize | null;
}

export interface ErrorLoggerServiceInterface extends AppLoggerServiceInterface {
	logAppError(
		error: Error,
		sequelize?: Sequelize,
		details?: Record<string, unknown>
	): void;

	logToDatabase(
		error: Error,
		sequelize: Sequelize,
		retryCount?: number
	): Promise<void>;

	getErrorCount(errorName: string): number;
}

export interface ErrorHandlerServiceInterface {
	ErrorClasses: typeof ErrorClasses;

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

//
///
//// ***** SERVICE DEPENDENCY INTERFACES ***** /////////
///
//

export interface AppLoggerServiceDeps {
	winston: {
		createLogger: typeof import('winston').createLogger;
		format: typeof import('winston').format;
		transports: typeof import('winston').transports;
		addColors: typeof import('winston').addColors;
	};
	DailyRotateFile: typeof import('winston-daily-rotate-file');
	LogStashTransport: typeof import('winston-logstash');
	configService: typeof import('../services/configService').configService;
	envSecretsStore: typeof import('../environment/envSecrets').envSecretsStore;
	ErrorClasses: typeof import('../errors/errorClasses').ErrorClasses;
	HandleErrorStaticParameters: typeof import('../index/parameters').HandleErrorStaticParameters;
	errorHandler: typeof import('../services/errorHandler').errorHandler;
	ErrorSeverity: typeof import('../errors/errorClasses').ErrorSeverity;
	uuidv4: typeof import('uuid').v4;
	sanitizeRequestBody: typeof import('../utils/helpers').sanitizeRequestBody;
	fs: typeof import('fs');
	Sequelize: typeof import('sequelize').Sequelize;
}

export interface ErrorLoggerServiceDeps {
	readonly configService: typeof import('../services/configService').configService;
	readonly validateDependencies: (
		dependencies: DependencyInterface[],
		logger: AppLoggerServiceInterface
	) => void;
	readonly ErrorClasses: typeof import('../errors/errorClasses').ErrorClasses;
	readonly ErrorSeverity: string;
	readonly handleError: typeof import('../services/errorHandler').errorHandler.handleError;
}

//
///
//// ***** INTERFACE REDIRECTS ***** /////////
///
//

export type LoggerServiceInterface = ErrorLoggerServiceInterface;
