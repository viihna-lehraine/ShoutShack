import * as cryptoConstants from 'constants';
import { execSync } from 'child_process';
import fs, { promises as fsPromises } from 'fs';
import jwt from 'jsonwebtoken';
import { inRange } from 'range_check';
import { validateDependencies } from '../utils/helpers';
import { blankRequest } from '../config/express';
import * as interfaces from './interfaces';
import { tlsCiphers } from '../config/security';
import { createLogger, format, transports, addColors } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import LogStashTransport from 'winston-logstash';
import { ErrorClasses, ErrorSeverity } from '../errors/ErrorClasses';
import { v4 as uuidv4 } from 'uuid';
import { Sequelize } from 'sequelize';
import { sanitizeRequestBody } from '../utils/validator';

// ****** PARAMETER OBJECTS ****** //

export const AddIpToBlacklistStaticParameters: Omit<
	interfaces.AddIpToBlacklistInterface,
	'ip'
> = {
	validateDependencies
};

export const CreateJwtParameters: interfaces.CreateJwtInterface = {
	jwt,
	execSync,
	validateDependencies
};

export const DeclareWebServerOptionsStaticParameters: interfaces.DeclareWebServerOptionsInterface =
	{
		blankRequest,
		constants: cryptoConstants,
		fs: fs.promises,
		tlsCiphers,
		validateDependencies
	};

export const envVariables: interfaces.EnvVariableTypes = {
	baseUrl: process.env.BASE_URL!,
	batchReEncryptSecretsInterval: Number(
		process.env.BATCH_RE_ENCRYPT_SECRETS_INTERVAL!
	),
	blacklistSyncInterval: Number(process.env.BLACKLIST_SYNC_INTERVAL!),
	clearExpiredSecretsInterval: Number(
		process.env.TZ_CLEAR_EXPIRED_SECRETS_INTERVAL!
	),
	cpuLimit: Number(process.env.CPU_LIMIT!),
	cpuThreshold: Number(process.env.CPU_THRESHOLD!),
	cronLoggerSetting: Number(process.env.CRON_LOGGER_SETTING!),
	dbDialect: process.env.DB_DIALECT! as
		| 'mariadb'
		| 'mssql'
		| 'mysql'
		| 'postgres'
		| 'sqlite',
	dbHost: process.env.DB_HOST! || 'localhost',
	dbInitMaxRetries: Number(process.env.DB_INIT_MAX_RETRIES!),
	dbInitRetryAfter: Number(process.env.DB_INIT_RETRY_AFTER!),
	dbName: process.env.DB_NAME!,
	dbUser: process.env.DB_USER!,
	diskPath: process.env.DISK_PATH!,
	emailHost: process.env.EMAIL_HOST!,
	emailPort: Number(process.env.EMAIL_PORT!),
	emailSecure: process.env.EMAIL_SECURE === 'true',
	emailUser: process.env.EMAIL_USER!,
	eventLoopLagThreshold: Number(process.env.EVENT_LOOP_LAG!),
	featureApiRoutesCsrf: process.env.FEATURE_API_ROUTES_CSRF === 'true',
	featureDbSync: process.env.FEATURE_DB_SYNC === 'true',
	featureEnableIpBlacklist:
		process.env.FEATURE_ENABLE_IP_BLACKLIST === 'true',
	featureEnableJwtAuth: process.env.FEATURE_ENABLE_JWT_AUTH === 'true',
	featureEnableLogStash: process.env.FEATURE_ENABLE_LOGSTASH === 'true',
	featureEnableRateLimit: process.env.FEATURE_ENABLE_RATE_LIMIT === 'true',
	featureEnableResourceAutoScaling:
		process.env.FEATURE_ENABLE_RESOURCE_AUTO_SCALING! === 'true',
	featureEnableSession: process.env.FEATURE_ENABLE_SESSION! === 'true',
	featureEncryptSecretsStore: process.env.FEATURE_ENCRYPTS_STORE! === 'true',
	featureHttpsRedirect: process.env.FEATURE_HTTPS_REDIRECT! === 'true',
	featureLoadTestRoutes: process.env.FEATURE_LOAD_TEST_ROUTES! === 'true',
	featureSequelizeLogging: process.env.FEATURE_SEQUELIZE_LOGGING! === 'true',
	featureHonorCipherOrder: process.env.FEATURE_HONOR_CIPHER_ORDER! === 'true',
	fido2Timeout: Number(process.env.FIDO2_TIMEOUT!),
	fidoAuthRequireResidentKey:
		process.env.FIDO_AUTHENTICATOR_REQUIRE_RESIDENT_KEY! === 'true',
	fidoAuthUserVerification: process.env
		.FIDO_AUTHENTICATOR_USER_VERIFICATION! as
		| 'required'
		| 'preferred'
		| 'discouraged'
		| 'enterprise',
	fidoChallengeSize: Number(process.env.FIDO_CHALLENGE_SIZE!),
	fidoCryptoParams: process.env.FIDO_CRYPTO_PARAMS!.split(',').map(Number),
	frontendSecretsPath: process.env.FRONTEND_SECRETS_PATH!,
	gracefulShutdownTimeout: Number(process.env.GRACEFUL_SHUTDOWN_TIMEOUT!),
	ipWhitelistPath: process.env.IP_WHITELIST_PATH!,
	logExportPath: process.env.LOG_EXPORT_PATH!,
	logLevel: process.env.LOG_LEVEL! as 'debug' | 'info' | 'warn' | 'error',
	loggerServiceName: process.env.LOG_SERVICE_NAME!,
	logStashHost: process.env.LOGSTASH_HOST!,
	logStashNode: process.env.LOGSTASH_NODE!,
	logStashPort: Number(process.env.LOGSTASH_PORT!),
	maxCacheSize: Number(process.env.MAX_CACHE_SIZE!),
	maxRedisCacheSize: Number(process.env.MAX_REDIS_CACHE_SIZE!),
	memoryLimit: Number(process.env.MEMORY_LIMIT!),
	memoryThreshold: Number(process.env.MEMORY_THRESHOLD!),
	memoryMonitorInterval: Number(process.env.MEMORY_MONITOR_INTERVAL!),
	multerFileSizeLimit: Number(process.env.MULTER_FILE_SIZE_LIMIT!),
	multerStorageDir: process.env.MULTER_STORAGE_DIR!,
	multerUploadDir: process.env.UPLOAD_DIR!,
	nodeEnv: process.env.NODE_ENV! as 'development' | 'testing' | 'production',
	npmLogPath: process.env.SERVER_NPM_LOG_PATH!,
	primaryLogPath: process.env.SERVER_LOG_PATH!,
	rateLimiterBaseDuration: Number(process.env.RATE_LIMITER_BASE_DURATION!),
	rateLimiterBasePoints: Number(process.env.RATE_LIMITER_BASE_POINTS!),
	rateLimiterGlobalReset: Number(process.env.RATE_LIMITER_GLOBAL_RESET!),
	redisUrl: process.env.REDIS_URL!,
	revokedTokenRetentionPeriod: Number(
		process.env.REVOKED_TOKEN_RETENTION_PERIOD!
	),
	rpName: process.env.RP_NAME!,
	rpIcon: process.env.RP_ICON!,
	rpId: process.env.RP_ID!,
	rpOrigin: process.env.RP_ORIGIN!,
	secretsExpiryTimeout: Number(process.env.SECRETS_EXPIRY_TIMEOUT!),
	secretsFilePath1: process.env.SECRETS_FILE_PATH_1!,
	secretsRateLimitMaxAttempts: Number(
		process.env.SECRETS_RATE_LIMIT_MAX_ATTEMPTS!
	),
	secretsRateLimitWindow: Number(process.env.RATE_LIMIT_WINDOW!),
	serverDataFilePath1: process.env.SERVER_DATA_FILE_PATH_1!,
	serverDataFilePath2: process.env.SERVER_DATA_FILE_PATH_2!,
	serverDataFilePath3: process.env.SERVER_DATA_FILE_PATH_3!,
	serverDataFilePath4: process.env.SERVER_DATA_FILE_PATH_4!,
	serverPort: Number(process.env.SERVER_PORT!),
	slowdownThreshold: Number(process.env.SLOWDOWN_THRESHOLD!),
	staticRootPath: process.env.STATIC_ROOT_PATH!,
	tempDir: process.env.TEMP_DIR!,
	tlsCertPath1: process.env.TLS_CERT_PATH_1!,
	tlsKeyPath1: process.env.TLS_KEY_PATH_1!,
	tokenExpiryListPath: process.env.TOKEN_REVOCATION_LIST_PATH!,
	tokenRevokedListPath: process.env.TOKEN_BLACKLIST_PATH!,
	tokenCacheDuration: Number(process.env.TOKEN_CACHE_DURATION!),
	yubicoApiUrl: process.env.YUBICO_API_URL!
};

export const ExpressErrorHandlerStaticParameters = {
	fallbackLogger: console
};

export const FeatureFlagNames = {
	API_ROUTES_CSR: 'FEATURE_API_ROUTES_CSRF',
	DB_SYNC: 'FEATURE_DB_SYNC',
	ENABLE_CSRF: 'FEATURE_ENABLE_CSRF',
	ENABLE_IP_BLACKLIST: 'FEATURE_ENABLE_IP_BLACKLIST',
	ENABLE_JWT_AUTH: 'FEATURE_ENABLE_JWT_AUTH',
	ENABLE_LOG_STASH: 'FEATURE_ENABLE_LOG_STASH',
	ENABLE_RATE_LIMIT: 'FEATURE_ENABLE_RATE_LIMIT',
	ENABLE_TLS: 'FEATURE_ENABLE_TLS',
	ENCRYPT_SECRETS_STORE: 'FEATURE_ENCRYPT_SECRETS_STORE',
	HONOR_CIPHER_ORDER: 'FEATURE_HONOR_CIPHER_ORDER',
	HTTPS_REDIRECT: 'FEATURE_HTTPS_REDIRECT',
	LOAD_TEST_ROUTES: 'FEATURE_LOAD_TEST_ROUTES',
	SECURE_HEADERS: 'FEATURE_SECURE_HEADERS',
	SEQUELIZE_LOGGING: 'FEATURE_SEQUELIZE_LOGGING'
} as const;

export const GetFeatureFlagsStaticParameters = {
	blankRequest
};

export const HandleCriticalErrorStaticParameters = {
	fallbackLogger: console
};

export const HandleErrorStaticParameters = {
	fallbackLogger: console
};

export const InitializeDatabaseStaticParameters: interfaces.InitializeDatabaseInterface =
	{
		blankRequest
	};

export const InitIpBlacklistParameters: interfaces.InitIpBlacklistInterface = {
	fsModule: fs,
	inRange,
	validateDependencies
};

export const LoadIpBlacklistParameters: interfaces.LoadIpBlacklistInterface = {
	fsModule: fsPromises
};

export const SetUpDatabaseParameters: interfaces.SetUpDatabaseInterface = {
	blankRequest
};

//
///
//// ***** SERVICE FACTORY PARAMETER OBJECTS ***** ////
///
//

export const AppLoggerServiceParameters = {
	winston: {
		createLogger,
		format,
		transports,
		addColors
	},
	DailyRotateFile,
	LogStashTransport,
	ErrorClasses,
	ErrorSeverity,
	HandleErrorStaticParameters,
	uuidv4,
	sanitizeRequestBody,
	fs,
	Sequelize
};
