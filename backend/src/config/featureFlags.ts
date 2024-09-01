export interface FeatureFlags {
	apiRoutesCsrfFlag: boolean;
	dbSyncFlag: boolean;
	decryptKeysFlag: boolean;
	enableCsrfFlag: boolean;
	enableErrorHandlerFlag: boolean;
	enableIpBlacklistFlag: boolean;
	enableJwtAuthFlag: boolean;
	enableRedisFlag: boolean;
	enableSentryFlag: boolean;
	enableSslFlag: boolean;
	httpsRedirectFlag: boolean;
	loadStaticRoutesFlag: boolean;
	loadTestRoutesFlag: boolean;
	secureHeadersFlag: boolean;
	sequelizeLoggingFlag: boolean;
}

export function parseBoolean(
	value: string | boolean | undefined,
	logger: { warn: (message: string) => void}
): boolean {
	if (typeof value === 'string') {
		value = value.toLowerCase();
	}

	if (value === true || value === 'true') {
		return true;
	} else if (value === false || value === 'false') {
		return false;
	} else if (value === undefined) {
		return false;
	} else {
		logger.warn(
			`parseBoolean received an invalid value: ${value}. Defaulting to false.`
		);
		return false;
	}
}

export function getFeatureFlags(
	logger: { warn: (message: string) => void },
	env: NodeJS.ProcessEnv = process.env
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
		enableIpBlacklistFlag: parseBoolean(env.FEATURE_ENABLE_IP_BLACKLIST, logger),
		enableJwtAuthFlag: parseBoolean(env.FEATURE_ENABLE_JWT_AUTH, logger),
		enableRedisFlag: parseBoolean(env.FEATURE_ENABLE_REDIS, logger),
		enableSentryFlag: parseBoolean(env.FEATURE_ENABLE_SENTRY, logger),
		enableSslFlag: parseBoolean(env.FEATURE_ENABLE_SSL, logger),
		httpsRedirectFlag: parseBoolean(env.FEATURE_HTTPS_REDIRECT, logger),
		loadStaticRoutesFlag: parseBoolean(env.FEATURE_LOAD_STATIC_ROUTES, logger),
		loadTestRoutesFlag: parseBoolean(env.FEATURE_LOAD_TEST_ROUTES, logger),
		secureHeadersFlag: parseBoolean(env.FEATURE_SECURE_HEADERS, logger),
		sequelizeLoggingFlag: parseBoolean(
			env.FEATURE_SEQUELIZE_LOGGING,
			logger
		)
	};
}
