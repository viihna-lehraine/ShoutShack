import { config } from 'dotenv';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import { configService } from '../config/configService';
import { errorClasses, ErrorSeverity } from '../errors/errorClasses';
import { ErrorLogger } from '../errors/errorLogger';
import { processError } from '../errors/processError';
import { validateDependencies } from '../utils/validateDependencies';

export const __filename = fileURLToPath(import.meta.url);
export const __dirname = dirname(__filename);

interface FeatureEnabler {
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
			`Failed to load environment variables from .env files using loadEnv()\n${configError instanceof Error ? configError.message : configError}`,
			{
				originalError: configError,
				statusCode: 404,
				severity: ErrorSeverity.FATAL,
				exposeToClient: false
			}
		);
		ErrorLogger.logError(configurationError);
		processError(configError);
		throw configurationError;
	}
}

export interface EnvVariableTypes {
	backendLogExportPath: string;
	dbDialect: 'mariadb' | 'mssql' | 'mysql' | 'postgres' | 'sqlite';
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
	fidoCryptoParams: number[];
	frontendSecretsPath: string;
	loggerLevel: string;
	logLevel: 'debug' | 'info' | 'warn' | 'error';
	logStashHost: string;
	logStashNode: string;
	logStashPort: number;
	memoryMonitorInterval: number;
	nodeEnv: 'development' | 'testing' | 'production';
	rateLimiterBaseDuration: string;
	rateLimiterBasePoints: string;
	redisUrl: string;
	rpName: string;
	rpIcon: string;
	rpId: string;
	secretsFilePath: string;
	serverDataFilePath1: string;
	serverDataFilePath2: string;
	serverDataFilePath3: string;
	serverDataFilePath4: string;
	serverLogPath: string;
	serverNpmLogPath: string;
	serverPort: number;
	serviceName: string;
	staticRootPath: string;
	tlsCertPath: string;
	tlsKeyPath: string;
	yubicoApiUrl: string;
}

const fidoCryptoParams = process.env.FIDO_CRYPTO_PARAMS;

const parsedFidoCryptoParams: number[] = JSON.parse(fidoCryptoParams || '[]');
const parsedFidoAuthRequireResidentKey = parseBoolean(
	process.env.FIDO_AUTH_REQUIRE_RESIDENT_KEY
);
const parsedEmailSecure = parseBoolean(process.env.EMAIL_SECURE);

export const envVariables: EnvVariableTypes = {
	backendLogExportPath: process.env.BACKEND_LOG_EXPORT_PATH || '',
	dbName: process.env.DB_NAME || '',
	dbDialect: process.env.DB_DIALECT as
		| 'mariadb'
		| 'mssql'
		| 'mysql'
		| 'postgres'
		| 'sqlite',
	dbUser: process.env.DB_USER || '',
	emailHost: process.env.EMAIL_HOST || '',
	emailPort: parseInt(process.env.EMAIL_PORT || '587', 10),
	emailSecure: parsedEmailSecure || false,
	emailUser: process.env.EMAIL_USER || '',
	featureApiRoutesCsrf: process.env.FEATURE_API_ROUTES_CSRF === 'true',
	featureDbSync: process.env.FEATURE_DB_SYNC === 'true',
	featureEnableIpBlacklist:
		process.env.FEATURE_ENABLE_IP_BLACKLIST === 'true',
	featureEnableJwtAuth: process.env.FEATURE_ENABLE_JWT_AUTH === 'true',
	featureEnableLogStash: process.env.FEATURE_ENABLE_LOGSTASH === 'true',
	featureEnableRateLimit: process.env.FEATURE_ENABLE_RATE_LIMIT === 'true',
	featureEnableRedis: process.env.FEATURE_ENABLE_REDIS === 'true',
	featureEnableSession: process.env.FEATURE_ENABLE_SESSION === 'true',
	featureEnableSsl: process.env.FEATURE_ENABLE_SSL === 'true',
	featureEncryptSecretsStore: process.env.FEATURE_ENCRYPTS_STORE === 'true',
	featureHttpsRedirect: process.env.FEATURE_HTTPS_REDIRECT === 'true',
	featureLoadTestRoutes: process.env.FEATURE_LOAD_TEST_ROUTES === 'true',
	featureSequelizeLogging: process.env.FEATURE_SEQUELIZE_LOGGING === 'true',
	featureHonorCipherOrder: process.env.FEATURE_HONOR_CIPHER_ORDER === 'true',
	fidoAuthRequireResidentKey: parsedFidoAuthRequireResidentKey === false,
	fidoAuthUserVerification: process.env
		.FIDO_AUTHENTICATOR_USER_VERIFICATION as
		| 'required'
		| 'preferred'
		| 'discouraged'
		| 'enterprise',
	fidoCryptoParams: parsedFidoCryptoParams,
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
	rateLimiterBaseDuration: process.env.RATE_LIMITER_BASE_DURATION || '',
	rateLimiterBasePoints: process.env.RATE_LIMITER_BASE_POINTS || '',
	redisUrl: process.env.REDIS_URL || '',
	rpName: process.env.RP_NAME || '',
	rpIcon: process.env.RP_ICON || '',
	rpId: process.env.RP_ID || '',
	secretsFilePath: process.env.SECRETS_FILE_PATH || '',
	serverDataFilePath1: process.env.SERVER_DATA_FILE_PATH_1 || '',
	serverDataFilePath2: process.env.SERVER_DATA_FILE_PATH_2 || '',
	serverDataFilePath3: process.env.SERVER_DATA_FILE_PATH_3 || '',
	serverDataFilePath4: process.env.SERVER_DATA_FILE_PATH_4 || '',
	serverLogPath: process.env.SERVER_LOG_PATH || '',
	serverNpmLogPath: process.env.SERVER_NPM_LOG_PATH || '',
	serverPort: parseInt(process.env.SERVER_PORT || '3000', 10),
	serviceName: process.env.SERVICE_NAME || '',
	staticRootPath: process.env.STATIC_ROOT_PATH || '',
	tlsCertPath: process.env.SERVER_TLS_CERT_PATH || '',
	tlsKeyPath: process.env.SERVER_TLS_KEY_PATH || '',
	yubicoApiUrl: process.env.YUBICO_API_URL || ''
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

export type FeatureFlagNamesType = keyof typeof FeatureFlagNames;

export type FeatureFlagValueType =
	(typeof FeatureFlagNames)[FeatureFlagNamesType];

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

export function parseBoolean(value: string | boolean | undefined): boolean {
	const appLogger = configService.getLogger() || console;

	try {
		validateDependencies([{ name: 'value', instance: value }], appLogger);

		if (value === undefined) {
			appLogger.warn(
				'Feature flag value is undefined. Defaulting to false'
			);
			return false;
		}
		if (typeof value === 'string') {
			return value.toLowerCase() === 'true';
		}
		return value === true;
	} catch (utilError) {
		const utilityError = new errorClasses.UtilityErrorFatal(
			`Fatal error: Unable to parse boolean value ${value} using 'parseBoolean()'\n${utilError instanceof Error ? utilError.message : utilError}`,
			{
				utility: 'parseBoolean()',
				originalError: utilError,
				statusCode: 500,
				severity: ErrorSeverity.FATAL,
				exposeToClient: false
			}
		);
		ErrorLogger.logError(utilityError);
		processError(utilityError);
		throw utilityError;
	}
}

export function getFeatureFlags(
	env: Partial<NodeJS.ProcessEnv> = process.env
): FeatureFlagTypes {
	try {
		validateDependencies([{ name: 'env', instance: env }], console);

		return {
			apiRoutesCsrf: parseBoolean(env.FEATURE_API_ROUTES_CSRF),
			dbSync: parseBoolean(env.FEATURE_DB_SYNC),
			enableIpBlacklist: parseBoolean(env.FEATURE_ENABLE_IP_BLACKLIST),
			enableJwtAuth: parseBoolean(env.FEATURE_ENABLE_JWT_AUTH),
			enableLogStash: parseBoolean(env.FEATURE_ENABLE_LOGSTASH),
			enableRateLimit: parseBoolean(env.FEATURE_ENABLE_RATE_LIMIT),
			enableRedis: parseBoolean(env.FEATURE_ENABLE_REDIS),
			enableTLS: parseBoolean(env.FEATURE_ENABLE_SSL),
			encryptSecretsStore: parseBoolean(env.FEATURE_ENCRYPT_STORE),
			honorCipherOrder: parseBoolean(env.FEATURE_HONOR_CIPHER_ORDER),
			httpsRedirect: parseBoolean(env.FEATURE_HTTPS_REDIRECT),
			loadTestRoutes: parseBoolean(env.FEATURE_LOAD_TEST_ROUTES),
			sequelizeLogging: parseBoolean(env.FEATURE_SEQUELIZE_LOGGING)
		};
	} catch (utilError) {
		const utility: string = 'getFeatureFlags()';
		const utilityError = new errorClasses.UtilityErrorRecoverable(
			`Failed to get feature flags using the utility ${utility}: ${utilError instanceof Error ? utilError.message : utilError}`,
			{ utility, exposeToClient: false }
		);
		ErrorLogger.logError(utilityError);
		processError(utilityError);
		return {
			apiRoutesCsrf: false,
			dbSync: false,
			enableIpBlacklist: false,
			enableJwtAuth: false,
			enableLogStash: false,
			enableRateLimit: false,
			enableRedis: false,
			enableTLS: false,
			encryptSecretsStore: false,
			honorCipherOrder: true,
			httpsRedirect: false,
			loadTestRoutes: false,
			sequelizeLogging: false
		};
	}
}

// *DEV-NOTE* this is unused, and should be implemented
export function createFeatureEnabler(): FeatureEnabler {
	const appLogger = configService.getLogger() || console;

	try {
		return {
			enableFeatureBasedOnFlag(
				flag: boolean,
				description: string,
				callback: () => void
			): void {
				if (flag) {
					appLogger.info(`Enabling ${description} (flag is ${flag})`);
					callback();
				} else {
					appLogger.info(`Skipping ${description} (flag is ${flag})`);
				}
			},
			enableFeatureWithProdOverride(
				flag: boolean,
				description: string,
				callback: () => void
			): void {
				if (process.env.NODE_ENV === 'production') {
					appLogger.info(
						`Enabling ${description} in production regardless of flag value.`
					);
					callback();
				} else if (flag) {
					appLogger.info(`Enabling ${description} (flag is ${flag})`);
					callback();
				} else {
					appLogger.info(`Skipping ${description} (flag is ${flag})`);
				}
			}
		};
	} catch (utilError) {
		const utility: string = 'createFeatureEnabler()';
		const utilityError = new errorClasses.UtilityErrorRecoverable(
			`Failed to create feature enabler using the utility ${utility}: ${utilError instanceof Error ? utilError.message : utilError}`,
			{
				utility,
				originalError: utilError,
				statusCode: 500,
				severity: ErrorSeverity.RECOVERABLE,
				exposeToClient: false
			}
		);
		ErrorLogger.logError(utilityError);
		processError(utilityError);
		return {
			enableFeatureBasedOnFlag: (): void => {},
			enableFeatureWithProdOverride: (): void => {}
		};
	}
}

export function displayEnvAndFeatureFlags(): void {
	const featureFlags = configService.getFeatureFlags();

	try {
		console.log('Environment Variables:');
		console.table(envVariables);

		console.log('\nFeature Flags:');
		console.table(featureFlags);
	} catch (displayError) {
		const displayUtility = 'displayEnvAndFeatureFlags()';
		const displayErrorObj = new errorClasses.UtilityErrorRecoverable(
			`Error displaying environment variables and feature flags using ${displayUtility}: ${displayError instanceof Error ? displayError.message : displayError}`,
			{
				originalError: displayError,
				statusCode: 500,
				severity: ErrorSeverity.RECOVERABLE,
				exposeToClient: false
			}
		);
		ErrorLogger.logError(displayErrorObj);
		processError(displayErrorObj);
	}
}
