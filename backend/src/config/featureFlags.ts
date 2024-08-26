import setupLogger from './logger';
import loadEnv from './loadEnv';

loadEnv();

const logger = setupLogger();

interface FeatureFlags {
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

export const parseBoolean = (value: string | boolean | undefined): boolean => {
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
			`parseBoolean received an unexpected value: "${value}". Defaulting to false.`
		);
		return false;
	}
};

export function getFeatureFlags(): FeatureFlags {
	return {
		apiRoutesCsrfFlag: parseBoolean(process.env.FEATURE_API_ROUTES_CSRF),
		dbSyncFlag: parseBoolean(process.env.FEATURE_DB_SYNC),
		decryptKeysFlag: parseBoolean(process.env.FEATURE_DECRYPT_KEYS),
		enableCsrfFlag: parseBoolean(process.env.FEATURE_ENABLE_CSRF),
		enableErrorHandlerFlag: parseBoolean(process.env.FEATURE_ENABLE_ERROR_HANDLER),
		enableIpBlacklistFlag: parseBoolean(process.env.FEATURE_ENABLE_IP_BLACKLIST),
		enableJwtAuthFlag: parseBoolean(process.env.FEATURE_ENABLE_JWT_AUTH),
		enableRedisFlag: parseBoolean(process.env.FEATURE_ENABLE_REDIS),
		enableSentryFlag: parseBoolean(process.env.FEATURE_ENABLE_SENTRY),
		enableSslFlag: parseBoolean(process.env.FEATURE_ENABLE_SSL),
		httpsRedirectFlag: parseBoolean(process.env.FEATURE_HTTPS_REDIRECT),
		loadStaticRoutesFlag: parseBoolean(
			process.env.FEATURE_LOAD_STATIC_ROUTES
		),
		loadTestRoutesFlag: parseBoolean(process.env.FEATURE_LOAD_TEST_ROUTES),
		secureHeadersFlag: parseBoolean(process.env.FEATURE_SECURE_HEADERS),
		sequelizeLoggingFlag: parseBoolean(
			process.env.FEATURE_SEQUELIZE_LOGGING
		)
	};
}
