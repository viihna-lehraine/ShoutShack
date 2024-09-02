import { config } from 'dotenv';
import path from 'path';
import { Logger, setupLogger } from './logger';

const logger = setupLogger();

interface LoadEnvDependencies {
	logger: {
		info: (msg: string) => void;
	};
	envFilePath?: string; // optional, but allows overriding the default path
}

export function loadEnv({ logger, envFilePath }: LoadEnvDependencies): void {
	const envPath =
		envFilePath || path.join(process.cwd(), './backend.dev.env');
	logger.info(`Loading environment variables from ${envPath}`);

	config({ path: envPath });
}

loadEnv({ logger});

interface EnvironmentVariableTypes {
	backendLogExportPath: string;
	emailUser: string;
	featureApiRoutesCsrf: boolean;
	featureDbSync: boolean;
	featureDecryptKeys: boolean;
	featureEnableCsrf: boolean;
	featureEnableErrorHandler: boolean;
	featureEnableIpBlacklist: boolean;
	featureEnableJwtAuth: boolean;
	featureEnableRateLimit: boolean;
	featureEnableRedis: boolean;
	featureEnableSession: boolean;
	featureEnableSsl: boolean;
	featureHttpsRedirect: boolean;
	featureLoadTestRoutes: boolean;
	featureSecureHeaders: boolean;
	featureSequelizeLogging: boolean;
	frontendAppJsPath: string;
	frontendBrowserConfigXmlPath: string;
	frontendCssPath: string;
	frontendFontsPath: string;
	frontendHumansMdPath: string;
	frontendIconsPath: string;
	frontendImagesPath: string;
	frontendJsPath: string;
	frontendKeysPath: string;
	frontendLogosPath: string;
	frontendRobotsTxtPath: string;
	frontendSecurityMdPath: string;
	frontendSecretsPath: string;
	frontendSitemapXmlPath: string;
	loggerLevel: number;
	logLevel: 'debug' | 'info' | 'warn' | 'error';
	nodeEnv: 'development' | 'production';
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
	featureEnableCsrf: process.env.FEATURE_ENABLE_CSRF === 'true',
	featureEnableErrorHandler: process.env.FEATURE_ENABLE_ERROR_HANDLER === 'true',
	featureEnableIpBlacklist: process.env.FEATURE_ENABLE_IP_BLACKLIST === 'true',
	featureEnableJwtAuth: process.env.FEATURE_ENABLE_JWT_AUTH === 'true',
	featureEnableRateLimit: process.env.FEATURE_ENABLE_RATE_LIMIT === 'true',
	featureEnableRedis: process.env.FEATURE_ENABLE_REDIS === 'true',
	featureEnableSession: process.env.FEATURE_ENABLE_SESSION === 'true',
	featureEnableSsl: process.env.FEATURE_ENABLE_SSL === 'true',
	featureHttpsRedirect: process.env.FEATURE_HTTPS_REDIRECT === 'true',
	featureLoadTestRoutes: process.env.FEATURE_LOAD_TEST_ROUTES === 'true',
	featureSecureHeaders: process.env.FEATURE_SECURE_HEADERS === 'true',
	featureSequelizeLogging: process.env.FEATURE_SEQUELIZE_LOGGING === 'true',
	frontendAppJsPath: process.env.FRONTEND_APP_JS_PATH || '',
	frontendBrowserConfigXmlPath: process.env.FRONTEND_BROWSER_CONFIG_XML_PATH || '',
	frontendCssPath: process.env.FRONTEND_CSS_PATH || '',
	frontendFontsPath: process.env.FRONTEND_FONTS_PATH || '',
	frontendHumansMdPath: process.env.FRONTEND_HUMANS_MD_PATH || '',
	frontendIconsPath: process.env.FRONTEND_ICONS_PATH || '',
	frontendImagesPath: process.env.FRONTEND_IMAGES_PATH || '',
	frontendJsPath: process.env.FRONTEND_JS_PATH || '',
	frontendKeysPath: process.env.FRONTEND_KEYS_PATH || '',
	frontendLogosPath: process.env.FRONTEND_LOGOS_PATH || '',
	frontendRobotsTxtPath: process.env.FRONTEND_ROBOTS_TXT_PATH || '',
	frontendSecurityMdPath: process.env.FRONTEND_SECURITY_MD_PATH || '',
	frontendSecretsPath: process.env.FRONTEND_SECRETS_PATH || '',
	frontendSitemapXmlPath: process.env.FRONTEND_SITEMAP_XML_PATH || '',
	loggerLevel: parseInt(process.env.LOGGER || '1', 10),
	logLevel: process.env.LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error',
	nodeEnv: process.env.NODE_ENV as 'development' | 'production',
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

export enum FeatureFlagNames {
	API_ROUTES_CSRF = 'FEATURE_API_ROUTES_CSRF',
	DB_SYNC = 'FEATURE_DB_SYNC',
	DECRYPT_KEYS = 'FEATURE_DECRYPT_KEYS',
	ENABLE_CSRF = 'FEATURE_ENABLE_CSRF',
	ENABLE_ERROR_HANDLER = 'FEATURE_ENABLE_ERROR_HANDLER',
	ENABLE_IP_BLACKLIST = 'FEATURE_ENABLE_IP_BLACKLIST',
	ENABLE_JWT_AUTH = 'FEATURE_ENABLE_JWT_AUTH',
	ENABLE_RATE_LIMIT = 'FEATURE_ENABLE_RATE_LIMIT',
	ENABLE_REDIS = 'FEATURE_ENABLE_REDIS',
	ENABLE_SSL = 'FEATURE_ENABLE_SSL',
	HTTPS_REDIRECT = 'FEATURE_HTTPS_REDIRECT',
	LOAD_TEST_ROUTES = 'FEATURE_LOAD_TEST_ROUTES',
	SECURE_HEADERS = 'FEATURE_SECURE_HEADERS',
	SEQUELIZE_LOGGING = 'FEATURE_SEQUELIZE_LOGGING'
}

export interface FeatureFlags {
	apiRoutesCsrfFlag: boolean;
	dbSyncFlag: boolean;
	decryptKeysFlag: boolean;
	enableCsrfFlag: boolean;
	enableErrorHandlerFlag: boolean;
	enableIpBlacklistFlag: boolean;
	enableJwtAuthFlag: boolean;
	enableRateLimitFlag: boolean;
	enableRedisFlag: boolean;
	enableSslFlag: boolean;
	httpsRedirectFlag: boolean;
	loadTestRoutesFlag: boolean;
	secureHeadersFlag: boolean;
	sequelizeLoggingFlag: boolean;
}

export function parseBoolean(
	value: string | boolean | undefined,
	logger: Logger
): boolean {
	if (value === undefined) {
		logger.warn('Feature flag value is undefined. Defaulting to false');
		return false;
	}
	if (typeof value === 'string') {
		return value.toLowerCase() === 'true';
	}
	return value === true;
}

export function getFeatureFlags(
	logger: Logger,
	env: Partial<NodeJS.ProcessEnv> = process.env
): FeatureFlags {
	return {
		apiRoutesCsrfFlag: parseBoolean(env.FEATURE_API_ROUTES_CSRF, logger),
		dbSyncFlag: parseBoolean(env.FEATURE_DB_SYNC, logger),
		decryptKeysFlag: parseBoolean(env.FEATURE_DECRYPT_KEYS, logger),
		enableCsrfFlag: parseBoolean(env.FEATURE_ENABLE_CSRF, logger),
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
		secureHeadersFlag: parseBoolean(env.FEATURE_SECURE_HEADERS, logger),
		sequelizeLoggingFlag: parseBoolean(
			env.FEATURE_SEQUELIZE_LOGGING,
			logger
		)
	};
}

export function createFeatureEnabler(logger: Logger) {
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
}