import argon2 from 'argon2';
import * as cryptoConstants from 'constants';
import { execSync } from 'child_process';
import RedisStore from 'connect-redis';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { randomBytes } from 'crypto';
import express from 'express';
import fs, { promises as fsPromises } from 'fs';
import hpp from 'hpp';
import jwt from 'jsonwebtoken';
import morgan from 'morgan';
import passport, { session } from 'passport';
import { inRange } from 'range_check';
import { createClient } from 'redis';
import sequelize from 'sequelize';
import { configService } from '../services/configService';
import { errorClasses, ErrorSeverity } from '../errors/errorClasses';
import { expressErrorHandler, processError } from '../errors/processError';
import { errorLogger } from '../services/errorLogger';
import {
	blankRequest,
	errorLoggerDetails,
	getCallerInfo,
	parseBoolean,
	validateDependencies
} from '../utils/helpers';
import { envSecretsStore } from '../environment/envSecrets';
import { isAppLogger } from '../services/appLogger';
import { createJwt } from '../auth/jwt';
import * as interfaces from './interfaces';
import { getRedisClient } from '../services/redis';
import { initCsrf } from '../middleware/csrf';
import { initIpBlacklist } from '../middleware/ipBlacklist';
import { initializeRateLimitMiddleware } from 'src/middleware/rateLimit';
import { initializeSecurityHeaders } from 'src/middleware/securityHeaders';
import { initializeSlowdownMiddleware } from 'src/middleware/slowdown';
import { initializeValidatorMiddleware } from 'src/middleware/validator';

// ***** UTILITY CONSTANTS ***** //

export const tlsCiphers: string[] = [
	'ECDHE-ECDSA-AES256-GCM-SHA384',
	'ECDHE-RSA-AES256-GCM-SHA384',
	'ECDHE-ECDSA-CHACHA20-POLY1305',
	'ECDHE-RSA-CHACHA20-POLY1305',
	'ECDHE-ECDSA-AES128-GCM-SHA256',
	'ECDHE-RSA-AES128-GCM-SHA256',
	'ECDHE-ECDSA-AES256-SHA384',
	'ECDHE-RSA-AES256-SHA384',
	'ECDHE-ECDSA-AES128-SHA256',
	'ECDHE-RSA-AES128-SHA256'
];

const parsedEmailSecure = parseBoolean(process.env.EMAIL_SECURE);
const parsedFidoAuthRequireResidentKey = parseBoolean(
	process.env.FIDO_AUTH_REQUIRE_RESIDENT_KEY
);
const parsedFidoCryptoParams: number[] = JSON.parse(
	process.env.FIDO_CRYPTO_PARAMS || '[]'
);

export const hashConfig = {
	type: argon2.argon2id,
	memoryCost: 48640,
	timeCost: 4,
	parallelism: 1
};

// ****** PARAMETER OBJECTS ****** //

export const AddIpToBlacklistStaticParameters: Omit<
	interfaces.AddIpToBlacklistInterface,
	'ip'
> = {
	appLogger: configService.getAppLogger(),
	errorLogger,
	errorLoggerDetails,
	getCallerInfo,
	configService,
	errorClasses,
	ErrorSeverity,
	processError,
	validateDependencies
};

export const CreateFeatureEnablerParameters: interfaces.CreateFeatureEnablerInterface =
	{
		appLogger: configService.getAppLogger(),
		errorClasses,
		ErrorSeverity,
		errorLogger,
		errorLoggerDetails,
		getCallerInfo,
		processError
	};

export const CreateJwtParameters: interfaces.CreateJwtInterface = {
	jwt,
	execSync,
	configService,
	appLogger: configService.getAppLogger(),
	errorClasses,
	errorLogger,
	errorLoggerDetails,
	getCallerInfo,
	ErrorSeverity,
	processError,
	validateDependencies,
	envSecretsStore
};

export const DeclareWebServerOptionsStaticParameters: interfaces.DeclareWebServerOptionsInterface =
	{
		appLogger: configService.getAppLogger(),
		blankRequest,
		configService,
		constants: cryptoConstants,
		fs: fs.promises,
		errorClasses,
		errorLogger,
		errorLoggerDetails,
		ErrorSeverity,
		getCallerInfo,
		processError,
		tlsCiphers,
		validateDependencies
	};

export const envVariables: interfaces.EnvVariableTypes = {
	batchReEncryptSecretsInterval: parseInt(
		process.env.BATCH_RE_ENCRYPT_SECRETS_INTERVAL!,
		10
	),
	clearExpiredSecretsInterval: parseInt(
		process.env.TZ_CLEAR_EXPIRED_SECRETS_INTERVAL!,
		10
	),
	dbDialect: process.env.DB_DIALECT! as
		| 'mariadb'
		| 'mssql'
		| 'mysql'
		| 'postgres'
		| 'sqlite',
	dbHost: process.env.DB_HOST!,
	dbInitMaxRetries: parseInt(process.env.DB_INIT_MAX_RETRIES!, 10),
	dbInitRetryAfter: parseInt(process.env.DB_INIT_RETRY_AFTER!, 10),
	dbName: process.env.DB_NAME!,
	dbUser: process.env.DB_USER!,
	emailHost: process.env.EMAIL_HOST!,
	emailPort: parseInt(process.env.EMAIL_PORT!, 10),
	emailSecure: parsedEmailSecure!,
	emailUser: process.env.EMAIL_USER!,
	featureApiRoutesCsrf: process.env.FEATURE_API_ROUTES_CSRF === 'true',
	featureDbSync: process.env.FEATURE_DB_SYNC === 'true',
	featureEnableIpBlacklist:
		process.env.FEATURE_ENABLE_IP_BLACKLIST === 'true',
	featureEnableJwtAuth: process.env.FEATURE_ENABLE_JWT_AUTH === 'true',
	featureEnableLogStash: process.env.FEATURE_ENABLE_LOGSTASH === 'true',
	featureEnableRateLimit: process.env.FEATURE_ENABLE_RATE_LIMIT === 'true',
	featureEnableRedis: process.env.FEATURE_ENABLE_REDIS! === 'true',
	featureEnableSession: process.env.FEATURE_ENABLE_SESSION! === 'true',
	featureEnableSsl: process.env.FEATURE_ENABLE_SSL! === 'true',
	featureEncryptSecretsStore: process.env.FEATURE_ENCRYPTS_STORE! === 'true',
	featureHttpsRedirect: process.env.FEATURE_HTTPS_REDIRECT! === 'true',
	featureLoadTestRoutes: process.env.FEATURE_LOAD_TEST_ROUTES! === 'true',
	featureSequelizeLogging: process.env.FEATURE_SEQUELIZE_LOGGING! === 'true',
	featureHonorCipherOrder: process.env.FEATURE_HONOR_CIPHER_ORDER! === 'true',
	fidoAuthRequireResidentKey: parsedFidoAuthRequireResidentKey!,
	fidoAuthUserVerification: process.env
		.FIDO_AUTHENTICATOR_USER_VERIFICATION! as
		| 'required'
		| 'preferred'
		| 'discouraged'
		| 'enterprise',
	fidoChallengeSize: parseInt(process.env.FIDO_CHALLENGE_SIZE!, 10),
	fidoCryptoParams: parsedFidoCryptoParams!,
	frontendSecretsPath: process.env.FRONTEND_SECRETS_PATH!,
	logExportPath: process.env.LOG_EXPORT_PATH!,
	loggerLevel: process.env.LOGGER!,
	logLevel: process.env.LOG_LEVEL! as 'debug' | 'info' | 'warn' | 'error',
	logStashHost: process.env.LOGSTASH_HOST!,
	logStashNode: process.env.LOGSTASH_NODE!,
	logStashPort: parseInt(process.env.LOGSTASH_PORT!, 10),
	memoryMonitorInterval: parseInt(process.env.MEMORY_MONITOR_INTERVAL!, 10),
	nodeEnv: process.env.NODE_ENV! as 'development' | 'testing' | 'production',
	npmLogPath: process.env.SERVER_NPM_LOG_PATH!,
	primaryLogPath: process.env.SERVER_LOG_PATH!,
	rateLimiterBaseDuration: process.env.RATE_LIMITER_BASE_DURATION!,
	rateLimiterBasePoints: process.env.RATE_LIMITER_BASE_POINTS!,
	redisUrl: process.env.REDIS_URL!,
	rpName: process.env.RP_NAME!,
	rpIcon: process.env.RP_ICON!,
	rpId: process.env.RP_ID!,
	secretsFilePath1: process.env.SECRETS_FILE_PATH_1!,
	secretsRateLimitMaxAttempts: parseInt(
		process.env.SECRETS_RATE_LIMIT_MAX_ATTEMPTS!,
		10
	),
	secretsRateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW!, 10),
	secretsReEncryptionCooldown: parseInt(
		process.env.SECRETS_RE_ENCRYPTION_COOLDOWN!,
		10
	),
	serverDataFilePath1: process.env.SERVER_DATA_FILE_PATH_1!,
	serverDataFilePath2: process.env.SERVER_DATA_FILE_PATH_2!,
	serverDataFilePath3: process.env.SERVER_DATA_FILE_PATH_3!,
	serverDataFilePath4: process.env.SERVER_DATA_FILE_PATH_4!,
	serverPort: parseInt(process.env.SERVER_PORT!, 10),
	serviceName: process.env.SERVICE_NAME!,
	staticRootPath: process.env.STATIC_ROOT_PATH!,
	tlsCertPath1: process.env.TLS_CERT_PATH_1!,
	tlsKeyPath1: process.env.TLS_KEY_PATH_1!,
	yubicoApiUrl: process.env.YUBICO_API_URL!
};

export const ExpressErrorHandlerStaticParameters = {
	appLogger: configService.getAppLogger(),
	configService,
	errorLogger,
	errorLoggerDetails,
	fallbackLogger: console,
	isAppLogger
};

export const FeatureFlagNames = {
	API_ROUTES_CSR: 'FEATURE_API_ROUTES_CSRF',
	DB_SYNC: 'FEATURE_DB_SYNC',
	ENABLE_CSRF: 'FEATURE_ENABLE_CSRF',
	ENABLE_IP_BLACKLIST: 'FEATURE_ENABLE_IP_BLACKLIST',
	ENABLE_JWT_AUTH: 'FEATURE_ENABLE_JWT_AUTH',
	ENABLE_LOG_STASH: 'FEATURE_ENABLE_LOG_STASH',
	ENABLE_RATE_LIMIT: 'FEATURE_ENABLE_RATE_LIMIT',
	ENABLE_REDIS: 'FEATURE_ENABLE_REDIS',
	ENABLE_TLS: 'FEATURE_ENABLE_TLS',
	ENCRYPT_SECRETS_STORE: 'FEATURE_ENCRYPT_SECRETS_STORE',
	HONOR_CIPHER_ORDER: 'FEATURE_HONOR_CIPHER_ORDER',
	HTTPS_REDIRECT: 'FEATURE_HTTPS_REDIRECT',
	LOAD_TEST_ROUTES: 'FEATURE_LOAD_TEST_ROUTES',
	SECURE_HEADERS: 'FEATURE_SECURE_HEADERS',
	SEQUELIZE_LOGGING: 'FEATURE_SEQUELIZE_LOGGING'
} as const;

export const GetFeatureFlagsStaticParameters = {
	blankRequest,
	errorClasses,
	errorLogger,
	errorLoggerDetails,
	processError
};

export const InitializeDatabaseStaticParameters: interfaces.InitializeDatabaseInterface =
	{
		dbInitMaxRetries: configService.getEnvVariables().dbInitMaxRetries,
		dbInitRetryAfter: configService.getEnvVariables().dbInitRetryAfter,
		appLogger: configService.getAppLogger(),
		envVariables: configService.getEnvVariables(),
		featureFlags: configService.getFeatureFlags(),
		errorClasses,
		errorLoggerDetails,
		ErrorSeverity,
		errorLogger,
		getCallerInfo,
		processError,
		envSecretsStore,
		blankRequest
	};

export const InitIpBlacklistParameters: interfaces.InitIpBlacklistInterface = {
	fsModule: fs,
	inRange,
	appLogger: configService.getAppLogger(),
	errorLogger,
	errorLoggerDetails,
	getCallerInfo,
	configService,
	errorClasses,
	ErrorSeverity,
	expressErrorHandler,
	validateDependencies
};

export const InitJwtAuthParameters: interfaces.InitJwtAuthInterface = {
	verifyJwt: createJwt().verifyJwt,
	appLogger: configService.getAppLogger(),
	errorClasses,
	errorLogger,
	errorLoggerDetails,
	getCallerInfo,
	ErrorSeverity,
	expressErrorHandler,
	processError,
	validateDependencies
};

export const InitMiddlewareStaticParameters = {
	appLogger: configService.getAppLogger(),
	authenticateOptions: { session: false },
	configService,
	cookieParser,
	cors,
	express,
	expressErrorHandler,
	fsModule: fs,
	getRedisClient,
	hpp,
	initCsrf,
	initIpBlacklist,
	initJwtAuth: () => passport.authenticate('jwt', { session: false }),
	initializePassportAuthMiddleware: () => passport.authenticate('local'),
	initializeRateLimitMiddleware,
	initializeSecurityHeaders,
	initializeSlowdownMiddleware,
	initializeValidatorMiddleware,
	morgan,
	passport,
	processError,
	session,
	randomBytes,
	redisClient: () => getRedisClient(createClient),
	RedisStore,
	verifyJwt: passport.authenticate('jwt', { session: false })
};

export const LoadIpBlacklistParameters: interfaces.LoadIpBlacklistInterface = {
	fsModule: fsPromises,
	appLogger: configService.getAppLogger(),
	errorLogger,
	errorLoggerDetails,
	getCallerInfo,
	configService,
	errorClasses,
	processError,
	ErrorSeverity,
	validateDependencies
};

export const PreInitIpBlacklistParameters: interfaces.PreInitIpBlacklistInterface =
	{
		fsModule: fsPromises,
		appLogger: configService.getAppLogger(),
		errorLogger,
		errorLoggerDetails,
		errorClasses,
		getCallerInfo,
		ErrorSeverity,
		configService,
		processError,
		validateDependencies
	};

export const ProcessCriticalErrorStaticParameters = {
	appLogger: configService.getAppLogger(),
	configService,
	fallbackLogger: console,
	isAppLogger
};

export const ProcessErrorStaticParameters = {
	appLogger: configService.getAppLogger(),
	configService,
	errorLogger,
	errorLoggerDetails,
	fallbackLogger: console,
	isAppLogger
};

export const RemoveIpFromBlacklistStaticParameters: Omit<
	interfaces.RemoveIpFromBlacklistInterface,
	'ip'
> = {
	appLogger: configService.getAppLogger(),
	errorLogger,
	errorLoggerDetails,
	getCallerInfo,
	configService,
	errorClasses,
	ErrorSeverity,
	processError,
	validateDependencies
};

export const SaveIpBlacklistParameters: interfaces.SaveIpBlacklistInterface = {
	fsModule: fsPromises,
	appLogger: configService.getAppLogger(),
	errorLogger,
	getCallerInfo,
	errorLoggerDetails,
	configService,
	errorClasses,
	ErrorSeverity,
	processError,
	validateDependencies
};

export const SetUpDatabaseParameters: interfaces.SetUpDatabaseInterface = {
	appLogger: configService.getAppLogger(),
	errorLoggerDetails,
	getCallerInfo,
	processError,
	configService,
	errorLogger,
	errorClasses,
	ErrorSeverity,
	envSecretsStore,
	blankRequest
};

export const SetUpWebServerParameters: interfaces.SetUpWebServerInterface = {
	app: express(),
	appLogger: configService.getAppLogger(),
	blankRequest,
	DeclareWebServerOptionsStaticParameters,
	envVariables: configService.getEnvVariables(),
	errorLogger,
	errorLoggerDetails,
	featureFlags: configService.getFeatureFlags(),
	getCallerInfo,
	processError,
	sequelize
};
