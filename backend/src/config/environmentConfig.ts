import { config } from 'dotenv';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import { Logger } from '../utils/logger';
import { processError } from '../utils/processError';
import { validateDependencies } from '../utils/validateDependencies';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function loadEnv(): void {
	try {
		const masterEnvPath: string = path.join(__dirname, '../../config/env/backend.master.env');
		config({ path: masterEnvPath });

		const envType = process.env.ENV_TYPE || 'dev';
		console.log(`envType = ${envType}`)
		const envFile = envType === 'docker' ? 'backend.docker-dev.env' : 'backend.dev.env';
		const envPath = path.join(process.cwd(), `./config/env/${envFile}`);
		console.log(`Loading environment variables from ${envFile}`);

		config({ path: envPath });
	} catch (error) {
		processError(error, console);
	}
}

interface EnvironmentVariableTypes {
	backendLogExportPath: string;
	emailUser: string;
	featureApiRoutesCsrf: boolean;
	featureDbSync: boolean;
	featureDecryptKeys: boolean;
	featureEnableErrorHandler: boolean;
	featureEnableIpBlacklist: boolean;
	featureEnableJwtAuth: boolean;
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
	nodeEnv: 'development' | 'testing' | 'production';
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

export const environmentVariables: EnvironmentVariableTypes = {
	backendLogExportPath: process.env.BACKEND_LOG_EXPORT_PATH || '',
	emailUser: process.env.EMAIL_USER || '',
	featureApiRoutesCsrf: process.env.FEATURE_API_ROUTES_CSRF === 'true',
	featureDbSync: process.env.FEATURE_DB_SYNC === 'true',
	featureDecryptKeys: process.env.FEATURE_DECRYPT_KEYS === 'true',
	featureEnableErrorHandler: process.env.FEATURE_ENABLE_ERROR_HANDLER === 'true',
	featureEnableIpBlacklist: process.env.FEATURE_ENABLE_IP_BLACKLIST === 'true',
	featureEnableJwtAuth: process.env.FEATURE_ENABLE_JWT_AUTH === 'true',
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
	nodeEnv: process.env.NODE_ENV as 'development' | 'testing' | 'production',
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
	ENABLE_ERROR_HANDLER: 'FEATURE_ENABLE_ERROR_HANDLER',
	ENABLE_IP_BLACKLIST: 'FEATURE_ENABLE_IP_BLACKLIST',
	ENABLE_JWT_AUTH: 'FEATURE_ENABLE_JWT_AUTH',
	ENABLE_RATE_LIMIT: 'FEATURE_ENABLE_RATE_LIMIT',
	ENABLE_REDIS: 'FEATURE_ENABLE_REDIS',
	ENABLE_SSL: 'FEATURE_ENABLE_SSL',
	HTTPS_REDIRECT: 'FEATURE_HTTPS_REDIRECT',
	LOAD_TEST_ROUTES: 'FEATURE_LOAD_TEST_ROUTES',
	SECURE_HEADERS: 'FEATURE_SECURE_HEADERS',
	SEQUELIZE_LOGGING: 'FEATURE_SEQUELIZE_LOGGING'
} as const;

export type FeatureFlagNamesType = keyof typeof FeatureFlagNames;

export type FeatureFlagValueType = typeof FeatureFlagNames[FeatureFlagNamesType];

export interface FeatureFlags {
	apiRoutesCsrfFlag: boolean;
	dbSyncFlag: boolean;
	decryptKeysFlag: boolean;
	enableErrorHandlerFlag: boolean;
	enableIpBlacklistFlag: boolean;
	enableJwtAuthFlag: boolean;
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
		)

		if (value === undefined) {
			logger.warn('Feature flag value is undefined. Defaulting to false');
			return false;
		}
		if (typeof value === 'string') {
			return value.toLowerCase() === 'true';
		}
		return value === true;
	} catch (error) {
		processError(error, logger || console);
		return false;
	}
}

export function getFeatureFlags(
	logger: Logger | Console,
	env: Partial<NodeJS.ProcessEnv> = process.env
): FeatureFlags {
	try {
		validateDependencies(
			[
				{ name: 'logger', instance: logger },
				{ name: 'env', instance: env }
			],
			logger || console
		);

		return {
			apiRoutesCsrfFlag: parseBoolean(env.FEATURE_API_ROUTES_CSRF, logger),
			dbSyncFlag: parseBoolean(env.FEATURE_DB_SYNC, logger),
			decryptKeysFlag: parseBoolean(env.FEATURE_DECRYPT_KEYS, logger),
			enableErrorHandlerFlag: parseBoolean(
				env.FEATURE_ENABLE_ERROR_HANDLER,
				logger
			),
			enableIpBlacklistFlag: parseBoolean(
				env.FEATURE_ENABLE_IP_BLACKLIST,
				logger
			),
			enableJwtAuthFlag: parseBoolean(env.FEATURE_ENABLE_JWT_AUTH, logger),
			enableRateLimitFlag: parseBoolean(
				env.FEATURE_ENABLE_RATE_LIMIT,
				logger
			),
			enableRedisFlag: parseBoolean(env.FEATURE_ENABLE_REDIS, logger),
			enableSslFlag: parseBoolean(env.FEATURE_ENABLE_SSL, logger),
			httpsRedirectFlag: parseBoolean(env.FEATURE_HTTPS_REDIRECT, logger),
			loadTestRoutesFlag: parseBoolean(env.FEATURE_LOAD_TEST_ROUTES, logger),
			sequelizeLoggingFlag: parseBoolean(
				env.FEATURE_SEQUELIZE_LOGGING,
				logger
			)
		}
	} catch (error) {
		processError(error, logger || console);
		logger.error(`Returning 'false' for all feature flags`);
		return {
			apiRoutesCsrfFlag: false,
			dbSyncFlag: false,
			decryptKeysFlag: false,
			enableErrorHandlerFlag: false,
			enableIpBlacklistFlag: false,
			enableJwtAuthFlag: false,
			enableRateLimitFlag: false,
			enableRedisFlag: false,
			enableSslFlag: false,
			httpsRedirectFlag: false,
			loadTestRoutesFlag: false,
			sequelizeLoggingFlag: false
		}
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
			) {
    	        if (flag) {
    	            logger.info(
						`Enabling ${description} (flag is ${flag})`
					);
    	            callback();
    	        } else {
    	            logger.info(
						`Skipping ${description} (flag is ${flag})`
					);
    	        }
    	    },
    	    enableFeatureWithProdOverride(
				flag: boolean,
				description: string,
				callback: () => void
			) {
    	        if (process.env.NODE_ENV === 'production') {
    	            logger.info(
						`Enabling ${description} in production regardless of flag value.`
					);
    	            callback();
    	        } else if (flag) {
    	            logger.info(
						`Enabling ${description} (flag is ${flag})`
					);
    	            callback();
    	        } else {
    	            logger.info(
						`Skipping ${description} (flag is ${flag})`
					);
    	        }
    	    },
    	};
	} catch (error) {
		processError(error, logger || console);
		return {
			enableFeatureBasedOnFlag: () => {},
			enableFeatureWithProdOverride: () => {}
		};
	}
}
