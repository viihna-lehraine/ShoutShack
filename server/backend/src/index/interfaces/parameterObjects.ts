import { execSync } from 'child_process';
import * as cryptoConstants from 'constants';
import fs, { promises as fsPromises } from 'fs';
import jwt from 'jsonwebtoken';
import { inRange } from 'range_check';
import { Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import { addColors, createLogger, format, transports } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import LogStashTransport from 'winston-logstash';
import { EnvVariableTypes } from './env';
import {
	AddIpToBlacklistInterface,
	CreateJwtInterface,
	DeclareWebServerOptionsInterface,
	InitializeDatabaseInterface,
	InitIpBlacklistInterface,
	LoadIpBlacklistInterface,
	SetUpDatabaseInterface
} from './serviceComponents';
import { blankRequest } from '../../config/express';
import { tlsCiphers } from '../../config/security';
import { ErrorClasses, ErrorSeverity } from '../../errors/ErrorClasses';

export const addIpToBlacklistStaticParameters = async (): Promise<
	Omit<AddIpToBlacklistInterface, 'ip'>
> => {
	const { validateDependencies } = await import('../../utils/helpers');

	return {
		validateDependencies
	};
};

export const createJwtParameters = async (): Promise<CreateJwtInterface> => {
	const { validateDependencies } = await import('../../utils/helpers');

	return {
		jwt,
		execSync,
		validateDependencies
	};
};

export const declareWebServerOptionsStaticParameters =
	async (): Promise<DeclareWebServerOptionsInterface> => {
		const { validateDependencies } = await import('../../utils/helpers');

		return {
			blankRequest,
			constants: cryptoConstants,
			fs: fs.promises,
			tlsCiphers,
			validateDependencies
		};
	};

export const envVariables: EnvVariableTypes = {
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
	gracefulShutdownTimeout: Number(process.env.GRACEFUL_SHUTDOWN_TIMEOUT!),
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
	nodeEnv: process.env.NODE_ENV! as 'development' | 'testing' | 'production',
	rateLimiterBaseDuration: Number(process.env.RATE_LIMITER_BASE_DURATION!),
	rateLimiterBasePoints: Number(process.env.RATE_LIMITER_BASE_POINTS!),
	rateLimiterGlobalReset: Number(process.env.RATE_LIMITER_GLOBAL_RESET!),
	requestTimeout: process.env.REQUEST_TIMEOUT!,
	revokedTokenRetentionPeriod: Number(
		process.env.REVOKED_TOKEN_RETENTION_PERIOD!
	),
	rpName: process.env.RP_NAME!,
	secretsExpiryTimeout: Number(process.env.SECRETS_EXPIRY_TIMEOUT!),
	secretsRateLimitMaxAttempts: Number(
		process.env.SECRETS_RATE_LIMIT_MAX_ATTEMPTS!
	),
	secretsRateLimitWindow: Number(process.env.RATE_LIMIT_WINDOW!),
	serverPort: Number(process.env.SERVER_PORT!),
	slowdownThreshold: Number(process.env.SLOWDOWN_THRESHOLD!),
	tokenCacheDuration: Number(process.env.TOKEN_CACHE_DURATION!)
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

export const InitializeDatabaseStaticParameters: InitializeDatabaseInterface = {
	blankRequest
};

export const InitIpBlacklistParameters: InitIpBlacklistInterface = {
	fsModule: fs,
	inRange,
	validateDependencies: await import('../../utils/helpers').then(
		module => module.validateDependencies
	)
};

export const LoadIpBlacklistParameters: LoadIpBlacklistInterface = {
	fsModule: fsPromises
};

export const SetUpDatabaseParameters: SetUpDatabaseInterface = {
	blankRequest
};

//
///
////
///// ***** SERVICE PARAMETER OBJECTS *****
////
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
	sanitizeRequestBody: await import('../../utils/validator').then(
		module => module.sanitizeRequestBody
	),
	fs,
	Sequelize
};
