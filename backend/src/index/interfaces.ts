import { Model } from 'sequelize';
import { Logger as WinstonLogger } from 'winston';
import {
	Application,
	NextFunction,
	Request,
	RequestHandler,
	Response,
	Router
} from 'express';
import { AppError, ClientError, ErrorClasses } from '../errors/ErrorClasses';
import RedisStore from 'connect-redis';
import { Transporter } from 'nodemailer';
import { Sequelize } from 'sequelize';
import { Session } from 'express-session';
import { User } from '../models/UserModelFile';
import { InferAttributes, WhereOptions } from 'sequelize/types';
import { RedisClientType } from 'redis';
import { JwtPayload, Secret, SignOptions } from 'jsonwebtoken';
import {
	AttestationResult,
	Fido2AttestationResult,
	PublicKeyCredentialCreationOptions,
	PublicKeyCredentialRequestOptions
} from 'fido2-lib';

//
///
//// ***** CUSTOM TYPE FILE IMPORTS ***** //
///
//

import '../../types/custom/yub.d.ts';

import '../../types/custom/winston-logstash.d.ts';

//
///
//// ***** CUSTOM TYPES AND TYPE DECLARATIONS ***** //
///
//

export type FeatureFlagValueType =
	(typeof import('../index/parameters').FeatureFlagNames)[FeatureFlagNamesType];

export type FeatureFlagNamesType =
	keyof typeof import('../index/parameters').FeatureFlagNames;

export type FidoFactor = 'first' | 'second' | 'either';

export type EnvVariableInterface = string | number | boolean | undefined;

export type HTTPSServerOptions = import('tls').SecureContextOptions;

export type LoggerServiceInterface = ErrorLoggerServiceInterface;

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
//// ***** BASE INTERFACE LIST ***** //
///
//

export interface AddIpToBlacklistInterface {
	ip: string;
	validateDependencies: (
		dependencies: DependencyInterface[],
		logger: AppLoggerServiceInterface
	) => void;
}

export interface BackupCodeInterface {
	code: string;
	used: boolean;
}

export interface CacheMetrics {
	cacheHits: number;
	cacheMisses: number;
	cacheSize?: number;
}

export interface ConfigSecretsInterface {
	readonly execSync: typeof import('child_process').execSync;
	readonly getDirectoryPath: () => string;
	readonly gpgPassphrase: string;
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

export interface EnvVariableTypes {
	baseUrl: string;
	batchReEncryptSecretsInterval: number;
	blacklistSyncInterval: number;
	clearExpiredSecretsInterval: number;
	cpuLimit: number;
	cpuThreshold: number;
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
	eventLoopLagThreshold: number;
	featureApiRoutesCsrf: boolean;
	featureDbSync: boolean;
	featureEnableIpBlacklist: boolean;
	featureEnableJwtAuth: boolean;
	featureEnableLogStash: boolean;
	featureEnableRateLimit: boolean;
	featureEnableResourceAutoScaling: boolean;
	featureEnableSession: boolean;
	featureEncryptSecretsStore: boolean;
	featureHonorCipherOrder: boolean;
	featureHttpsRedirect: boolean;
	featureLoadTestRoutes: boolean;
	featureSequelizeLogging: boolean;
	fido2Timeout: number;
	fidoAuthRequireResidentKey: boolean;
	fidoAuthUserVerification:
		| 'required'
		| 'preferred'
		| 'discouraged'
		| 'enterprise';
	fidoChallengeSize: number;
	fidoCryptoParams: number[];
	frontendSecretsPath: string;
	ipWhitelistPath: string;
	logExportPath: string;
	loggerServiceName: string;
	logLevel: 'debug' | 'info' | 'warn' | 'error';
	logStashHost: string;
	logStashNode: string;
	logStashPort: number;
	maxCacheSize: number;
	maxRedisCacheSize: number;
	memoryLimit: number;
	memoryThreshold: number;
	memoryMonitorInterval: number;
	multerFileSizeLimit: number;
	multerStorageDir: string;
	multerUploadDir: string;
	npmLogPath: string;
	nodeEnv: 'development' | 'testing' | 'production';
	primaryLogPath: string;
	rateLimiterBaseDuration: number;
	rateLimiterBasePoints: number;
	rateLimiterGlobalReset: number;
	redisUrl: string;
	revokedTokenRetentionPeriod: number;
	rpName: string;
	rpIcon: string;
	rpId: string;
	rpOrigin: string;
	secretsExpiryTimeout: number;
	secretsFilePath1: string;
	secretsRateLimitMaxAttempts: number;
	secretsRateLimitWindow: number;
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
	tokenExpiryListPath: string;
	tokenRevokedListPath: string;
	tokenCacheDuration: number;
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
	severity?: import('../errors/ErrorClasses').ErrorSeverityType;
	action?: string;
	userId?: string;
	sequelize?: Sequelize;
}

export interface HashPasswordInterface {
	password: string;
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

export interface InitMiddlewareParameters {
	authenticateOptions: import('passport').AuthenticateOptions;
	cookieParser: typeof import('cookie-parser');
	cors: typeof import('cors');
	express: typeof import('express');
	fsModule: typeof import('fs');
	hpp: typeof import('hpp');
	morgan: typeof import('morgan');
	passport: typeof import('passport');
	session: typeof import('express-session');
	randomBytes: typeof import('crypto').randomBytes;
	RedisStore: RedisStore;
	verifyJwt: (token: string) => Promise<string | object | null>;
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

export interface RouteParams {
	app: import('express').Application;
}

export interface SecretsMap {
	DB_PASSWORD: string;
	DB_HOST: string;
	EMAIL_MFA_KEY: string;
	JWT_SECRET: string;
	PEPPER: string;
	REDIS_PASSWORD: string;
	REDIS_URL: string;
	SMTP_TOKEN: string;
	YUBICO_CLIENT_ID: string;
	YUBICO_SECRET_KEY: string;
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
	totpSecret?: string | null | undefined;
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
	totpSecret?: string | null | undefined;
	email2faToken?: string | null | undefined;
	email2faTokenExpires?: Date | null | undefined;
	creationDate: Date;
}

export interface UserInstanceInterface {
	id: string;
	userId?: number | undefined;
	username: string;
	password: string;
	isAccountVerified: boolean;
	totpSecret?: string | null | undefined;
	email2faToken?: string | null | undefined;
	email2faTokenExpires?: Date | null | undefined;
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

export interface YubicoOTPOptionsInterface {
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

export interface AccessControlMiddlewareServiceInterface {
	restrictTo(...allowedRoles: string[]): RequestHandler;
	hasPermission(...requiredPermissions: string[]): RequestHandler;
}

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
	getErrorDetails(
		getCallerInfo: () => string,
		action: string,
		req?: Request,
		userId?: string | null,
		additionalData?: Record<string, unknown>
	): Record<string, unknown>;
	setUpSecrets(secrets: VaultServiceInterface): void;
	setErrorHandler(errorHandler: ErrorHandlerServiceInterface): void;
}

export interface AuthControllerInterface {
	initializeAuthMiddleware(): Promise<void>;
	initializeJWTAuthMiddleware(): RequestHandler;
	initializePassportAuthMiddleware(): RequestHandler;
	loginUser(
		email: string,
		password: string
	): Promise<{ success: boolean; token?: string }>;
	generateResetToken(user: UserInstanceInterface): Promise<string | null>;
	validateResetToken(
		userId: string,
		token: string
	): Promise<UserInstanceInterface | null>;
	comparePassword(
		user: UserInstanceInterface,
		password: string
	): Promise<boolean>;
	resetPassword(
		user: UserInstanceInterface,
		newPassword: string
	): Promise<UserInstanceInterface | null>;
	enableMfa(userId: string): Promise<boolean>;
	disableMfa(userId: string): Promise<boolean>;
	recoverPassword(email: string): Promise<void>;
	generateEmailMFACode(email: string): Promise<boolean>;
	verifyEmail2FACode(email: string, email2FACode: string): Promise<boolean>;
	generateTOTP(
		userId: string
	): Promise<{ secret: string; qrCodeUrl: string }>;
	verifyTOTP(userId: string, token: string): Promise<boolean>;
}

export interface BaseRouterInterface {
	getRouter(): Router;
}

export interface BackupCodeServiceInterface {
	generateBackupCodes(id: string): Promise<string[]> | string[];
}

export interface CacheServiceInterface {
	getCacheMetrics(service: string): CacheMetrics;
	get<T>(key: string, service: string): Promise<T | null>;
	set<T>(
		key: string,
		value: T,
		service: string,
		expirationInSeconds?: number
	): Promise<void>;
	del(key: string, service: string): Promise<void>;
	exists(key: string, service: string): Promise<boolean>;
	cleanupExpiredEntries(): void;
	flushCache(service: string): Promise<void>;
	closeConnection(): Promise<void>;
}

export interface CSRFMiddlewareServiceInterface {
	initializeCSRFMiddleware(): (
		req: Request,
		res: Response,
		next: NextFunction
	) => Promise<void>;
}

export interface DatabaseControllerInterface {
	getSequelizeInstance(): Sequelize | null;
	initializeDatabase(): Promise<Sequelize>;
	clearIdleConnections(): Promise<void>;
	getEntries<T>(Model: ModelOperations<T>): Promise<T[]>;
	createEntry<T>(Model: ModelOperations<T>, data: T): Promise<T>;
	deleteEntry<T>(Model: ModelOperations<T>, id: number): Promise<boolean>;
	cacheData<T>(key: string, data: T, expiration?: number): Promise<void>;
	queryWithCache<T extends object>(
		query: string,
		cacheKey: string,
		expiration?: number
	): Promise<T | null>;
	getCachedData<T>(key: string): Promise<T | null>;
	clearCache(key: string): Promise<void>;
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

export interface EmailMFAServiceInterface {
	generateEmailMFACode({ bcrypt, jwt }: EmailMFAServiceDeps): Promise<{
		emailMFACode: string;
		emailMFAToken: string;
	}>;
	verifyEmailMFACode(
		token: string,
		emailMFACode: string,
		jwt: EmailMFAServiceDeps['jwt']
	): Promise<boolean>;
}

export interface EnvConfigServiceInterface {
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
	ErrorSeverity: typeof import('../errors/ErrorClasses').ErrorSeverity;
	handleError(params: {
		error: unknown;
		req?: Request;
		details?: Record<string, unknown>;
		severity?: import('../errors/ErrorClasses').ErrorSeverityType;
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
	initializeGlobalErrorHandlers(): void;
	setShutdownHandler(shutdownFn: () => Promise<void>): void;
}

export interface FIDO2ServiceInterface {
	initializeFIDO2Service(): Promise<void>;
	generateFIDO2RegistrationOptions(
		user: FidoUserInterface
	): Promise<PublicKeyCredentialCreationOptions>;
	verifyFIDO2Registration(
		attestation: AttestationResult,
		expectedChallenge: string
	): Promise<Fido2AttestationResult>;
	generateFIDO2AuthenticationOptions(
		user: FidoUserInterface
	): Promise<PublicKeyCredentialRequestOptions>;
	invalidateFido2Cache(userId: string, action: string): Promise<void>;
}

export interface GatekeeperServiceInterface {
	rateLimitMiddleware(): (
		req: Request,
		res: Response,
		next: NextFunction
	) => Promise<void>;
	slowdownMiddleware(): (
		req: Request & { session: SlowdownSessionInterface },
		res: Response,
		next: NextFunction
	) => void;
	throttleRequests(): (
		req: Request,
		res: Response,
		next: NextFunction
	) => Promise<void | Response>;
	ipBlacklistMiddleware(): (
		req: Request,
		res: Response,
		next: NextFunction
	) => Promise<void>;
	addIpToBlacklist(ip: string): Promise<void>;
	removeIpFromBlacklist(ip: string): Promise<void>;
	preInitIpBlacklist(): Promise<void>;
	loadIpBlacklist(): Promise<void>;
	temporaryBlacklist(ip: string): Promise<void>;
	isBlacklisted(ip: string): Promise<boolean>;
	isTemporarilyBlacklisted(ip: string): Promise<boolean>;
	isBlacklistedOrTemporarilyBlacklisted(ip: string): Promise<{
		isBlacklisted: boolean;
		isTemporarilyBlacklisted: boolean;
	}>;
	dynamicRateLimiter(): Promise<void>;
}

export interface HealthCheckServiceInterface {
	performHealthCheck(): Promise<Record<string, unknown>>;
}

export interface HelmetMiddlwareServiceInterface {
	initializeHelmetMiddleware(app: Application): Promise<void>;
	applyHelmet(app: Application): Promise<void>;
	applyCSP(app: Application): Promise<void>;
	applyExpectCT(app: Application): Promise<void>;
	applyPermissionsPolicy(app: Application): Promise<void>;
	helmetOptions?: typeof import('../config/middlewareOptions').helmetOptions;
	permissionsPolicyOptions?: {
		[key: string]: string[];
	};
}

export interface HTTPSServerInterface {
	initialize: () => Promise<void>;
	startServer: () => Promise<void>;
	shutdownServer: () => Promise<void>;
}

export interface JWTAuthMiddlewareServiceInterface {
	initializeJWTAuthMiddleware(): (
		req: Request,
		res: Response,
		next: NextFunction
	) => Promise<void | Response>;
}

export interface JWTServiceInterface {
	generateJWT(id: string, username: string): Promise<string>;
	verifyJWT(token: string): Promise<string | JwtPayload | null>;
}

export interface MiddlewareStatusServiceInterface {
	setStatus(middlewareName: string, status: 'on' | 'off'): void;
	getStatus(middlewareName: string): 'on' | 'off' | undefined | void;
	isMiddlewareOn(middlewareName: string): boolean;
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

export interface PassportAuthMiddlewareServiceInterface {
	initializePassportAuthMiddleware({
		passport,
		authenticateOptions,
		validateDependencies
	}: PassportAuthMiddlewareServiceDeps): RequestHandler;
}

export interface PasswordServiceInterface {
	hashPassword(password: string, pepper: string): Promise<string>;
	comparePassword(
		storedPassword: string,
		providedPassword: string,
		pepper: string
	): Promise<boolean>;
}

export interface RedisServiceInterface {
	getRedisClient(): Promise<RedisClientType | null>;
	get<T>(key: string): Promise<T | null>;
	set<T>(key: string, value: T, expiration?: number): Promise<void>;
	del(key: string): Promise<void>;
	exists(key: string): Promise<boolean>;
	increment(key: string, expiration?: number): Promise<number | null>;
	flushRedisMemoryCache(): Promise<void>;
	cleanUpRedisClient(): Promise<void>;
	delMultiple(service: string, keys: string[]): Promise<void>;
	getKeysByPattern(pattern: string): Promise<string[]>;
	flushCacheByService(service: string): Promise<void>;
}

export interface ResourceManagerInterface {
	getCpuUsage(): Array<{ core: number; usage: string }>;
	getMemoryUsage(): {
		heapUsed: number;
		heapTotal: number;
		heapUsedPercentage: number;
		memoryLimit: number;
		isMemoryHealthy: boolean;
	};
	getDiskUsage(): Promise<Record<string, unknown>>;
	getNetworkUsage(): Record<string, unknown>[];
	clearCaches(service: string): Promise<void>;
	closeIdleConnections(): Promise<void>;
	saveToCache<T>(
		key: string,
		value: T,
		service: string,
		expiration: number
	): Promise<void>;
	getFromCache<T>(key: string, service: string): Promise<T | null>;
}

export interface TOTPServiceInterface {
	generateTOTPSecret(): TOTPSecretInterface;
	generateTOTPToken(secret: string): Promise<string>;
	verifyTOTPToken(secret: string, token: string): boolean;
	generateQRCode(otpauth_url: string): Promise<string>;
}

export interface UserControllerInterface {
	findOne(
		criteria: WhereOptions<InferAttributes<User>>
	): Promise<UserInstanceInterface | null>;
	createUser(
		userDetails: Omit<UserAttributesInterface, 'id' | 'creationDate'>
	): Promise<UserInstanceInterface | null>;
	findUserByEmail(email: string): Promise<UserInstanceInterface | null>;
	updateUser(
		user: UserInstanceInterface,
		updatedDetails: Partial<UserInstanceInterface>
	): Promise<UserInstanceInterface | null>;
	deleteUser(userId: string): Promise<boolean>;
	verifyUserAccount(userId: string): Promise<boolean>;
	findUserById(userId: string): Promise<UserInstanceInterface | null>;
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

export interface VaultServiceInterface {
	storeSecret(key: string, secret: string): Promise<void>;
	retrieveSecret(
		key: keyof SecretsMap,
		usageCallback: (secret: string) => void
	): Promise<string | null>;
	retrieveSecrets(
		secretKeys: (keyof SecretsMap)[],
		usageCallback: (secrets: Partial<SecretsMap>) => void
	): Promise<Partial<SecretsMap> | null>;
	redactSecrets(
		logData: string | Record<string, unknown> | unknown[]
	): Promise<string | Record<string, unknown> | unknown[]>;
	clearExpiredSecretsFromMemory(): void;
	clearSecretsFromMemory(secretKeys: string | string[]): void;
	batchClearSecrets(): Promise<void>;
}

export interface YubicoOTPServiceInterface {
	initializeYubicoOTP(): Promise<void>;
	init(clientId: string, secretKey: string): YubClientInterface;
	validateYubicoOTP(otp: string): Promise<boolean>;
	generateYubicoOTPOptions(): Promise<YubicoOTPOptionsInterface>;
}

///
//// ***** SERVICE DEPENDENCY INTERFACES ***** /////////
///
//

export interface APIRouterDeps {
	UserRoutes: UserControllerInterface;
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
	ErrorClasses: typeof import('../errors/ErrorClasses').ErrorClasses;
	HandleErrorStaticParameters: typeof import('../index/parameters').HandleErrorStaticParameters;
	uuidv4: typeof import('uuid').v4;
	fs: typeof import('fs');
	Sequelize: typeof import('sequelize').Sequelize;
}

export interface BackupCodeServiceDeps {
	UserMfa: typeof import('../models/UserMfaModelFile').UserMfa;
	crypto: typeof import('crypto');
	bcrypt: typeof import('bcrypt');
}

export interface EmailMFAServiceDeps {
	bcrypt: {
		genSalt: (rounds: number) => Promise<string>;
	};
	jwt: {
		sign: (
			payload: string | object | Buffer,
			secretOrPrivateKey: Secret,
			options?: SignOptions
		) => string;
		verify: (
			token: string,
			secretOrPublicKey: Secret
		) => string | JwtPayload;
	};
}

export interface ErrorLoggerServiceDeps {
	readonly validateDependencies: (
		dependencies: DependencyInterface[],
		logger: AppLoggerServiceInterface
	) => void;
	readonly ErrorClasses: typeof import('../errors/ErrorClasses').ErrorClasses;
	readonly ErrorSeverity: string;
	readonly handleError: ErrorHandlerServiceInterface['handleError'];
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
	validateDependencies: (
		dependencies: DependencyInterface[],
		logger: AppLoggerServiceInterface
	) => void;
	logger: AppLoggerServiceInterface;
	errorLogger: AppLoggerServiceInterface;
	errorHandler: ErrorHandlerServiceInterface;
}

export interface PassportAuthMiddlewareServiceDeps {
	passport: import('passport').PassportStatic;
	authenticateOptions: import('passport').AuthenticateOptions;
	validateDependencies: (
		dependencies: DependencyInterface[],
		logger: AppLoggerServiceInterface
	) => void;
}

export interface PassportServiceInterface {
	configurePassport(
		passport: import('passport').PassportStatic,
		UserModel: typeof import('../models/UserModelFile').User
	): Promise<void>;
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

export interface UserControllerDeps {
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
