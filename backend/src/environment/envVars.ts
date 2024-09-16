import { config } from 'dotenv';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import { errorClasses } from '../errors/errorClasses';
import { ErrorLogger } from '../errors/errorLogger';
import { processError } from '../errors/processError';
import { logger, Logger } from '../utils/logger';
import { validateDependencies } from '../utils/validateDependencies';

export const __filename = fileURLToPath(import.meta.url);
export const __dirname = dirname(__filename);

export function loadEnv(): void {
	try {
		const masterEnvPath: string = path.join(
			__dirname,
			'../../config/env/backend.master.env'
		);
		config({ path: masterEnvPath });

		const envType = process.env.ENV_TYPE || 'dev';
		console.log(`envType = ${envType}`);
		const envFile =
			envType === 'docker' ? 'backend.docker-dev.env' : 'backend.dev.env';
		const envPath = path.join(process.cwd(), `./config/env/${envFile}`);
		console.log(`Loading environment variables from ${envFile}`);

		config({ path: envPath });
	} catch (configError) {
		const configurationError = new errorClasses.ConfigurationError(
			'Failed to load environment variables from .env files using loadEnv(): ${configError instanceof Error ? configError.message : configError}',
			{ exposeToClient: false }
		);
		ErrorLogger.logError(configurationError, console);
		processError(configError, console);
		throw configurationError;
	}
}

export interface EnvVariableTypes {
	backendLogExportPath: string;
	emailUser: string;
	featureApiRoutesCsrf: boolean;
	featureDbSync: boolean;
	featureDecryptKeys: boolean;
	featureEnableIpBlacklist: boolean;
	featureEnableJwtAuth: boolean;
	featureEnableLogStash: boolean;
	featureEnableRateLimit: boolean;
	featureEnableRedis: boolean;
	featureEnableSession: boolean;
	featureEnableSsl: boolean;
	featureHttpsRedirect: boolean;
	featureLoadTestRoutes: boolean;
	featureSequelizeLogging: boolean;
	frontendSecretsPath: string;
	loggerLevel: string;
	logLevel: 'debug' | 'info' | 'warn' | 'error';
	logStashHost: string;
	logStashNode: string;
	logStashPort: number;
	memoryMonitorInterval: number;
	nodeEnv: 'development' | 'testing' | 'production';
	redisUrl: string;
	secretsFilePath: string;
	serverDataFilePath1: string;
	serverDataFilePath2: string;
	serverDataFilePath3: string;
	serverDataFilePath4: string;
	serverLogPath: string;
	serverNpmLogPath: string;
	serverPort: number;
	serverSslCertPath: string;
	serverSslKeyPath: string;
	serviceName: string;
	staticRootPath: string;
	yubicoApiUrl: string;
}

export const envVariables: EnvironmentVariableTypes = {
	backendLogExportPath: process.env.BACKEND_LOG_EXPORT_PATH || '',
	emailUser: process.env.EMAIL_USER || '',
	featureApiRoutesCsrf: process.env.FEATURE_API_ROUTES_CSRF === 'true',
	featureDbSync: process.env.FEATURE_DB_SYNC === 'true',
	featureDecryptKeys: process.env.FEATURE_DECRYPT_KEYS === 'true',
	featureEnableIpBlacklist:
		process.env.FEATURE_ENABLE_IP_BLACKLIST === 'true',
	featureEnableJwtAuth: process.env.FEATURE_ENABLE_JWT_AUTH === 'true',
	featureEnableLogStash: process.env.FEATURE_ENABLE_LOGSTASH === 'true',
	featureEnableRateLimit: process.env.FEATURE_ENABLE_RATE_LIMIT === 'true',
	featureEnableRedis: process.env.FEATURE_ENABLE_REDIS === 'true',
	featureEnableSession: process.env.FEATURE_ENABLE_SESSION === 'true',
	featureEnableSsl: process.env.FEATURE_ENABLE_SSL === 'true',
	featureHttpsRedirect: process.env.FEATURE_HTTPS_REDIRECT === 'true',
	featureLoadTestRoutes: process.env.FEATURE_LOAD_TEST_ROUTES === 'true',
	featureSequelizeLogging: process.env.FEATURE_SEQUELIZE_LOGGING === 'true',
	frontendSecretsPath: process.env.FRONTEND_SECRETS_PATH || '',
	loggerLevel: process.env.LOGGER || '1',
	logLevel: process.env.LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error',
	logStashHost: process.env.LOGSTASH_HOST || 'localhost',
	logStashNode: process.env.LOGSTASH_NODE || 'guestbook-logstash-node',
	logStashPort: parseInt(process.env.LOGSTASH_PORT || '5000', 10),
	memoryMonitorInterval: parseInt(
		process.env.MEMORY_MONITOR_INTERVAL || '300000',
		10
	),
	nodeEnv: process.env.NODE_ENV as 'development' | 'testing' | 'production',
	redisUrl: process.env.REDIS_URL || '',
	secretsFilePath: process.env.SECRETS_FILE_PATH || '',
	serverDataFilePath1: process.env.SERVER_DATA_FILE_PATH_1 || '',
	serverDataFilePath2: process.env.SERVER_DATA_FILE_PATH_2 || '',
	serverDataFilePath3: process.env.SERVER_DATA_FILE_PATH_3 || '',
	serverDataFilePath4: process.env.SERVER_DATA_FILE_PATH_4 || '',
	serverLogPath: process.env.SERVER_LOG_PATH || '',
	serverNpmLogPath: process.env.SERVER_NPM_LOG_PATH || '',
	serverPort: parseInt(process.env.SERVER_PORT || '3000', 10),
	serverSslCertPath: process.env.SERVER_SSL_CERT_PATH || '',
	serverSslKeyPath: process.env.SERVER_SSL_KEY_PATH || '',
	serviceName: process.env.SERVICE_NAME || '',
	staticRootPath: process.env.STATIC_ROOT_PATH || '',
	yubicoApiUrl: process.env.YUBICO_API_URL || ''
};

export const FeatureFlagNames = {
	API_ROUTES_CSR: 'FEATURE_API_ROUTES_CSRF',
	DB_SYNC: 'FEATURE_DB_SYNC',
	DECRYPT_KEYS: 'FEATURE_DECRYPT_KEYS',
	ENABLE_CSRF: 'FEATURE_ENABLE_CSRF',
	ENABLE_IP_BLACKLIST: 'FEATURE_ENABLE_IP_BLACKLIST',
	ENABLE_JWT_AUTH: 'FEATURE_ENABLE_JWT_AUTH',
	ENABLE_LOG_STASH: 'FEATURE_ENABLE_LOG_STASH',
	ENABLE_RATE_LIMIT: 'FEATURE_ENABLE_RATE_LIMIT',
	ENABLE_REDIS: 'FEATURE_ENABLE_REDIS',
	ENABLE_SSL: 'FEATURE_ENABLE_SSL',
	HTTPS_REDIRECT: 'FEATURE_HTTPS_REDIRECT',
	LOAD_TEST_ROUTES: 'FEATURE_LOAD_TEST_ROUTES',
	SECURE_HEADERS: 'FEATURE_SECURE_HEADERS',
	SEQUELIZE_LOGGING: 'FEATURE_SEQUELIZE_LOGGING'
} as const;

export type FeatureFlagNamesType = keyof typeof FeatureFlagNames;

export type FeatureFlagValueType =
	(typeof FeatureFlagNames)[FeatureFlagNamesType];

export interface FeatureFlagTypes {
	apiRoutesCsrfFlag: boolean;
	dbSyncFlag: boolean;
	decryptKeysFlag: boolean;
	enableIpBlacklistFlag: boolean;
	enableJwtAuthFlag: boolean;
	enableLogStashFlag: boolean;
	enableRateLimitFlag: boolean;
	enableRedisFlag: boolean;
	enableSslFlag: boolean;
	httpsRedirectFlag: boolean;
	loadTestRoutesFlag: boolean;
	sequelizeLoggingFlag: boolean;
}

export function parseBoolean(
	value: string | boolean | undefined,
	logger: Logger | Console
): boolean {
	try {
		validateDependencies(
			[
				{ name: 'logger', instance: logger },
				{ name: 'value', instance: value }
			],
			logger
		);

		if (value === undefined) {
			logger.warn('Feature flag value is undefined. Defaulting to false');
			return false;
		}
		if (typeof value === 'string') {
			return value.toLowerCase() === 'true';
		}
		return value === true;
	} catch (utilError) {
		const utility: string = 'parseBoolean()';
		const utilityError = new errorClasses.UtilityErrorFatal(
			`Failed to parse boolean value ${value} using the utility ${utility}: ${utilError instanceof Error ? utilError.message : utilError}`,
			{ exposeToClient: false, value, logger }
		);
		ErrorLogger.logError(utilityError, logger);
		processError(utilityError, logger);
		throw utilityError;
	}
}

export function getFeatureFlags(
	logger: Logger | Console,
	env: Partial<NodeJS.ProcessEnv> = process.env
): FeatureFlagTypes {
	try {
		validateDependencies(
			[
				{ name: 'logger', instance: logger },
				{ name: 'env', instance: env }
			],
			logger || console
		);

		return {
			apiRoutesCsrfFlag: parseBoolean(
				env.FEATURE_API_ROUTES_CSRF,
				logger
			),
			dbSyncFlag: parseBoolean(env.FEATURE_DB_SYNC, logger),
			decryptKeysFlag: parseBoolean(env.FEATURE_DECRYPT_KEYS, logger),
			enableIpBlacklistFlag: parseBoolean(
				env.FEATURE_ENABLE_IP_BLACKLIST,
				logger
			),
			enableJwtAuthFlag: parseBoolean(
				env.FEATURE_ENABLE_JWT_AUTH,
				logger
			),
			enableLogStashFlag: parseBoolean(
				env.FEATURE_ENABLE_LOGSTASH,
				logger
			),
			enableRateLimitFlag: parseBoolean(
				env.FEATURE_ENABLE_RATE_LIMIT,
				logger
			),
			enableRedisFlag: parseBoolean(env.FEATURE_ENABLE_REDIS, logger),
			enableSslFlag: parseBoolean(env.FEATURE_ENABLE_SSL, logger),
			httpsRedirectFlag: parseBoolean(env.FEATURE_HTTPS_REDIRECT, logger),
			loadTestRoutesFlag: parseBoolean(
				env.FEATURE_LOAD_TEST_ROUTES,
				logger
			),
			sequelizeLoggingFlag: parseBoolean(
				env.FEATURE_SEQUELIZE_LOGGING,
				logger
			)
		};
	} catch (utilError) {
		const utility: string = 'getFeatureFlags()';
		const utilityError = new errorClasses.UtilityErrorRecoverable(
			`Failed to get feature flags using the utility ${utility}: ${utilError instanceof Error ? utilError.message : utilError}`,
			{ utility, exposeToClient: false }
		);
		ErrorLogger.logError(utilityError, logger);
		processError(utilityError, logger);
		return {
			apiRoutesCsrfFlag: false,
			dbSyncFlag: false,
			decryptKeysFlag: false,
			enableIpBlacklistFlag: false,
			enableJwtAuthFlag: false,
			enableLogStashFlag: false,
			enableRateLimitFlag: false,
			enableRedisFlag: false,
			enableSslFlag: false,
			httpsRedirectFlag: false,
			loadTestRoutesFlag: false,
			sequelizeLoggingFlag: false
		};
	}
}

export function createFeatureEnabler(logger: Logger) {
	try {
		validateDependencies(
			[{ name: 'logger', instance: logger }],
			logger || console
		);

		return {
			enableFeatureBasedOnFlag(
				flag: boolean,
				description: string,
				callback: () => void
			): void {
				if (flag) {
					logger.info(`Enabling ${description} (flag is ${flag})`);
					callback();
				} else {
					logger.info(`Skipping ${description} (flag is ${flag})`);
				}
			},
			enableFeatureWithProdOverride(
				flag: boolean,
				description: string,
				callback: () => void
			): void {
				if (process.env.NODE_ENV === 'production') {
					logger.info(
						`Enabling ${description} in production regardless of flag value.`
					);
					callback();
				} else if (flag) {
					logger.info(`Enabling ${description} (flag is ${flag})`);
					callback();
				} else {
					logger.info(`Skipping ${description} (flag is ${flag})`);
				}
			}
		};
	} catch (utilError) {
		const utility: string = 'createFeatureEnabler()';
		const utilityError = new errorClasses.UtilityErrorRecoverable(
			`Failed to create feature enabler using the utility ${utility}: ${utilError instanceof Error ? utilError.message : utilError}`,
			{
				utility,
				exposeToClient: false
			}
		);
		ErrorLogger.logError(utilityError, logger);
		processError(utilityError, logger || console);
		return {
			enableFeatureBasedOnFlag: (): void => {},
			enableFeatureWithProdOverride: (): void => {}
		};
	}
}

export const featureFlags = getFeatureFlags(logger || console);

export function displayEnvAndFeatureFlags(): void {
	try {
		console.log('Environment Variables:');
		console.table(envVariables);

		console.log('\nFeature Flags:');
		console.table(featureFlags);
	} catch (displayError) {
		const displayUtility = 'displayEnvAndFeatureFlags()';
		const displayErrorObj = new errorClasses.UtilityErrorRecoverable(
			`Error displaying environment variables and feature flags using ${displayUtility}: ${displayError instanceof Error ? displayError.message : displayError}`,
			{ exposeToClient: false }
		);
		ErrorLogger.logError(displayErrorObj, logger);
		processError(displayErrorObj, logger);
	}
}
