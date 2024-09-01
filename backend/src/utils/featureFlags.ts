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

export type Logger = Record<'warn', (msg: string) => void>;

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
