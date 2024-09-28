import { Model } from 'sequelize';
import { Logger as WinstonLogger } from 'winston';
import { NextFunction, Request, Response, Router } from 'express';
import { AppError, ClientError, ErrorClasses } from '../errors/errorClasses';
import RedisStore from 'connect-redis';
import { Transporter } from 'nodemailer';
import { Sequelize } from 'sequelize';
import { Session } from 'express-session';
import { User } from '../models/UserModelFile';
import { InferAttributes, WhereOptions } from 'sequelize/types';

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
}

export interface CreateFeatureEnablerInterface {
	readonly configService: typeof import('../services/config').configService;
}

export interface CreateJwtInterface {
	jwt: typeof import('jsonwebtoken');
	execSync: typeof import('child_process').execSync;
	validateDependencies: (
		dependencies: DependencyInterface[],
		logger: AppLoggerServiceInterface
	) => void;
}

export interface CsrfMiddlewareInterface {
	req: import('express').Request;
	res: import('express').Response;
	next: import('express').NextFunction;
}

export interface DependencyInterface {
	name: string;
	instance: unknown;
}

export interface EmailMFAInterface {
	bcrypt: typeof import('bcrypt');
	jwt: typeof import('jsonwebtoken');
	validateDependencies: (
		dependencies: DependencyInterface[],
		logger: AppLoggerServiceInterface
	) => void;
}

export interface EnvVariableTypes {
	batchReEncryptSecretsInterval: number;
	blacklistSyncInterval: number;
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
	readonly createRedisClient: typeof import('redis').createClient;
}

export interface GetFeatureFlagsInterface {
	blankRequest: import('express').Request;
}

export interface GeneratePasskeyInterface {
	user: FidoUserInterface;
}

export interface GeneratePasskeyInterface {
	user: FidoUserInterface;
	configService: typeof import('../services/config').configService;
	logger: AppLoggerServiceInterface;
}

export interface GetRedisClientInterface {
	readonly req: import('express').Request;
	readonly res: import('express').Response;
	readonly next: import('express').NextFunction;
	readonly blankRequest: import('express').Request;
	readonly createRedisClient: typeof import('redis').createClient;
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
}

export interface InitCsrfInterface {
	csrf: typeof import('csrf');
}

export interface InitDatabaseInterface {
	maxRetries: number;
	retryAfter: number;
}

export interface InitializeDatabaseInterface {
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
	validateDependencies: (
		dependencies: DependencyInterface[],
		logger: AppLoggerServiceInterface
	) => void;
}

export interface InitJwtAuthInterface {
	verifyJwt: (token: string) => Promise<string | object | null>;
	validateDependencies: (
		dependencies: DependencyInterface[],
		appLogger: AppLoggerServiceInterface
	) => void;
}

export interface InitMiddlewareParameters {
	authenticateOptions: import('passport').AuthenticateOptions;
	cookieParser: typeof import('cookie-parser');
	cors: typeof import('cors');
	express: typeof import('express');
	fsModule: typeof import('fs');
	hpp: typeof import('hpp');
	initCsrf: typeof import('../middleware/csrf').initCsrf;
	initJwtAuth: typeof import('../middleware/jwtAuth').initJwtAuth;
	initializePassportAuthMiddleware: typeof import('../middleware/passportAuth').initializePassportAuthMiddleware;
	initializeSecurityHeaders: typeof import('../middleware/securityHeaders').initializeSecurityHeaders;
	morgan: typeof import('morgan');
	passport: typeof import('passport');
	session: typeof import('express-session');
	randomBytes: typeof import('crypto').randomBytes;
	RedisStore: RedisStore;
	verifyJwt: (token: string) => Promise<string | object | null>;
}

export interface JwtUserInterface {
	id: string;
	username: string;
}

export interface LoadIpBlacklistInterface {
	fsModule: typeof import('fs').promises;
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

export interface ModelType extends Model {
	id?: number;
}

export interface ModelOperations<T> {
	new (): T;
	findAll: () => Promise<T[]>;
	create: (values: Partial<T>) => Promise<T>;
	destroy: (options: { where: { id: number } }) => Promise<number>;
}

export interface PassportAuthMiddlewareDependencies {
	passport: import('passport').PassportStatic;
	authenticateOptions: import('passport').AuthenticateOptions;
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
}

export interface RouteParams {
	app: import('express').Application;
}

export interface SecretsMap {
	[key: string]: string;
}

export interface SecurityHeadersInterface {
	helmetOptions?: typeof import('../config/securityOptions').helmetOptions;
	permissionsPolicyOptions?: {
		[key: string]: string[];
	};
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
	readonly blankRequest?: import('express').Request;
}

export interface SlowdownConfigInterface {
	slowdownThreshold: number;
	validateDependencies: (
		dependencies: DependencyInterface[],
		logger: AppLoggerServiceInterface
	) => void;
}

export interface SlowdownSessionInterface extends Session {
	lastRequestTime?: number;
}

export interface UserInstanceInterface {
	id: string;
	userId?: number | undefined;
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

export interface TLSKeys {
	cert: string;
	key: string;
}

export interface TOTPMFA {
	QRCode: typeof import('qrcode');
	speakeasy: typeof import('speakeasy');
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

export interface UserAttributesInterface {
	id: string;
	userId?: number | undefined;
	username: string;
	password: string;
	email: string;
	isVerified: boolean;
	resetPasswordToken?: string | null;
	resetPasswordExpires?: Date | null;
	isMfaEnabled: boolean;
	creationDate: Date;
}

export interface UserInstanceInterface {
	id: string;
	userId?: number | undefined;
	username: string;
	password: string;
	isAccountVerified: boolean;
	comparePassword: (
		password: string,
		argon2: typeof import('argon2')
	) => Promise<boolean>;
}

export interface ValidatorInterface {
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
}

export interface VerifyPasskeyRegistrationInterface {
	attestation: import('fido2-lib').AttestationResult;
	expectedChallenge: string;
}

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
	setAdminId(adminId: number | null): void;
	getCallerInfo(): string;
	getErrorDetails(
		getCallerInfo: () => string,
		action: string,
		req?: Request,
		userId?: string | null,
		additionalData?: Record<string, unknown>
	): Record<string, unknown>;
	isAppLogger(logger: unknown): logger is AppLoggerServiceInterface | unknown;
}

export interface BouncerServiceInterface {
	rateLimitMiddleware(): (
		req: Request,
		res: Response,
		next: NextFunction
	) => Promise<void>;
	slowdownMiddleware(): (
		req: Request,
		res: Response,
		next: NextFunction
	) => void;
	ipBlacklistMiddleware(): (
		req: Request,
		res: Response,
		next: NextFunction
	) => Promise<void>;
	addIpToBlacklist(ip: string): Promise<void>;
	removeIpFromBlacklist(ip: string): Promise<void>;
	preInitIpBlacklist(): Promise<void>;
}

export interface ConfigSecretsInterface {
	readonly logger: AppLoggerServiceInterface;
	readonly execSync: typeof import('child_process').execSync;
	readonly getDirectoryPath: () => string;
	readonly gpgPassphrase: string;
}

export interface ConfigServiceInterface {
	logger: AppLoggerServiceInterface;
	getLogger(): AppLoggerServiceInterface;
	getErrorLogger(): ErrorLoggerServiceInterface;
	getEnvVariable<K extends keyof EnvVariableTypes>(
		key: K
	): EnvVariableTypes[K];
	getFeatureFlags(): FeatureFlagTypes;
	getSecrets(
		keys: string | string[],
		logger: AppLoggerServiceInterface
	): Record<string, string | undefined> | string | undefined;
	refreshSecrets(dependencies: ConfigSecretsInterface): void;
}

export interface DatabaseServiceInterface {
	getSequelizeInstance(): Sequelize | null;
	initializeDatabase(): Promise<Sequelize>;
	clearIdleConnections(): Promise<void>;
}

export interface DeclareWebServerOptionsInterface {
	blankRequest: import('express').Request;
	constants: typeof import('crypto').constants;
	fs: typeof import('fs').promises;
	tlsCiphers: string[];
	validateDependencies: (
		dependencies: DependencyInterface[],
		logger: AppLoggerServiceInterface
	) => void;
}

export interface EnvironmentServiceInterface {
	getEnvVariable<K extends keyof EnvVariableTypes>(
		key: K
	): EnvVariableTypes[K];
	getFeatureFlags(): FeatureFlagTypes;
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

export interface HTTPSServerInterface {
	initialize: () => Promise<void>;
	startServer: () => Promise<void>;
	shutdownServer: () => Promise<void>;
}

export interface MulterUploadServiceInterface {
	setFileSizeLimit(limit: number): void;
	setAllowedMimeTypes(mimeTypes: string[]): void;
	setAllowedExtensions(extensions: string[]): void;
	createMulterUpload(
		validationCallback?: (file: Express.Multer.File) => boolean
	): import('multer').Multer | undefined;
	onUploadSuccess(callback: (file: Express.Multer.File) => void): void;
}

export interface RedisServiceInterface {
	get<T>(key: string): Promise<T | null>;
	set<T>(key: string, value: T, expiration?: number): Promise<void>;
	del(key: string): Promise<void>;
	exists(key: string): Promise<boolean>;
	increment(key: string, expiration?: number): Promise<number | null>;
	getRedisClient(): Promise<import('redis').RedisClientType | null>;
	flushRedisMemoryCache(): Promise<void>;
}

export interface BaseRouterInterface {
	getRouter(): Router;
}

export interface SecretsStoreInterface {
	initializeEncryptionKey(encryptionKey: string): void;
	loadSecrets(dependencies: ConfigSecretsInterface): Promise<void>;
	storeSecret(key: string, secret: string): Promise<void>;
	retrieveSecrets(
		secretKeys: string | string[]
	): Record<string, string | null> | string | null;
	reEncryptSecret(secretKey: string): Promise<void>;
	redactSecrets(
		logData: string | Record<string, unknown> | unknown[]
	): Promise<string | Record<string, unknown> | unknown[]>;
	clearExpiredSecretsFromMemory(): void;
	clearSecretsFromMemory(secretKeys: string | string[]): void;
	batchReEncryptSecrets(): void;
}

export interface UserServiceInterface {
	validatePassword: (password: string) => boolean;
	findOne: (
		criteria: WhereOptions<InferAttributes<User>>
	) => Promise<UserInstanceInterface | null>;
	createUser: (
		userDetails: Omit<UserAttributesInterface, 'id' | 'creationDate'>
	) => Promise<UserInstanceInterface | null>;
	loginUser: (req: Request, res: Response) => Promise<Response | void>;
	comparePassword: (
		user: UserInstanceInterface,
		password: string
	) => Promise<boolean>;
	resetPassword: (
		user: UserInstanceInterface,
		newPassword: string
	) => Promise<UserInstanceInterface | null>;
	findUserByEmail: (email: string) => Promise<UserInstanceInterface | null>;
	updateUser: (
		user: UserInstanceInterface,
		updatedDetails: Partial<UserInstanceInterface>
	) => Promise<UserInstanceInterface | null>;
	deleteUser: (userId: string) => Promise<void>;
	verifyUserAccount: (userId: string) => Promise<boolean>;
	generateResetToken: (user: UserInstanceInterface) => Promise<string | null>;
	validateResetToken: (
		userId: string,
		token: string
	) => Promise<UserInstanceInterface | null>;
	enableMfa: (userId: string) => Promise<boolean>;
	disableMfa: (userId: string) => Promise<boolean>;
	findUserById: (userId: string) => Promise<UserInstanceInterface | null>;
	recoverPassword: (email: string) => Promise<void>;
	generateEmail2FA: (email: string) => Promise<void>;
	verifyEmail2FA: (email: string, email2FACode: string) => Promise<boolean>;
	generateTOTP: (
		userId: string
	) => Promise<{ secret: string; qrCodeUrl: string }>;
	verifyTOTP: (userId: string, token: string) => Promise<boolean>;
}

export interface ValidatorServiceInterface {
	validateEntry(req: Request, res: Response, next: NextFunction): void;
	registrationValidationRules(
		req: Request,
		res: Response,
		next: NextFunction
	): void;
	handleValidationErrors(
		req: Request,
		res: Response,
		next: NextFunction
	): Response | void;
}

export type HTTPSServerOptions = import('tls').SecureContextOptions;

///
//// ***** SERVICE DEPENDENCY INTERFACES ***** /////////
///
//

export interface APIRouterDeps {
	UserRoutes: UserServiceInterface;
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
		generateTOTPSecret: () => TOTPSecretInterface;
		generateTOTPToken: (secret: string) => string;
		verifyTOTPToken: (secret: string, token: string) => boolean;
		generateQRCode: (otpauth_url: string) => Promise<string>;
	};
	zxcvbn: (password: string) => {
		score: number;
		guesses: number;
	};
}

export interface AppLoggerServiceDeps {
	winston: {
		createLogger: typeof import('winston').createLogger;
		format: typeof import('winston').format;
		transports: typeof import('winston').transports;
		addColors: typeof import('winston').addColors;
	};
	DailyRotateFile: typeof import('winston-daily-rotate-file');
	LogStashTransport: typeof import('winston-logstash');
	secretsStore: typeof import('../services/secrets').secretsStore;
	ErrorClasses: typeof import('../errors/errorClasses').ErrorClasses;
	HandleErrorStaticParameters: typeof import('../index/parameters').HandleErrorStaticParameters;
	errorHandler: typeof import('../services/errorHandler').errorHandler;
	ErrorSeverity: typeof import('../errors/errorClasses').ErrorSeverity;
	uuidv4: typeof import('uuid').v4;
	fs: typeof import('fs');
	Sequelize: typeof import('sequelize').Sequelize;
}

export interface ErrorLoggerServiceDeps {
	readonly validateDependencies: (
		dependencies: DependencyInterface[],
		logger: AppLoggerServiceInterface
	) => void;
	readonly ErrorClasses: typeof import('../errors/errorClasses').ErrorClasses;
	readonly ErrorSeverity: string;
	readonly handleError: typeof import('../services/errorHandler').errorHandler.handleError;
}

export interface HTTPSServerDeps {
	app: import('express').Application;
	blankRequest: import('express').Request;
	DeclareWebServerOptionsStaticParameters: DeclareWebServerOptionsInterface;
	sequelize: import('sequelize').Sequelize | null;
}

export interface MulterUploadServiceDeps {
	multer: typeof import('multer');
	fileTypeFromBuffer: typeof import('file-type').fileTypeFromBuffer;
	fs: typeof import('fs');
	path: typeof import('path');
	configService: typeof import('../services/config').configService;
	validateDependencies: (
		dependencies: DependencyInterface[],
		logger: AppLoggerServiceInterface
	) => void;
	logger: AppLoggerServiceInterface;
	errorLogger: AppLoggerServiceInterface;
	errorHandler: ErrorHandlerServiceInterface;
}

export interface RedisServiceDeps {
	readonly req: import('express').Request;
	readonly res: import('express').Response;
	readonly next: import('express').NextFunction;
	readonly createRedisClient: typeof import('redis').createClient;
	readonly validateDependencies: (
		dependencies: DependencyInterface[],
		logger: AppLoggerServiceInterface
	) => void;
	readonly blankRequest: import('express').Request;
}

export interface UserServiceDeps {
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
	bcrypt: typeof import('bcrypt');
	uuidv4: () => string;
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
	xss: (input: string) => string;
	zxcvbn: (password: string) => {
		score: number;
		guesses: number;
	};
	totpMfa: {
		generateTOTPSecret: () => TOTPSecretInterface;
		generateTOTPToken: (secret: string) => string;
		verifyTOTPToken: (secret: string, token: string) => boolean;
		generateQRCode: (otpauth_url: string) => Promise<string>;
	};
}

//
///
//// ***** INTERFACE REDIRECTS ***** /////////
///
//

export type LoggerServiceInterface = ErrorLoggerServiceInterface;
