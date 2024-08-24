import { parseBoolean } from '../utils/parseBoolean';

interface FeatureFlags {
	apiRoutesCsrfFlag: boolean;
	dbSyncFlag: boolean;
	httpsRedirectFlag: boolean;
	ipBlacklistFlag: boolean;
	loadStaticRoutesFlag: boolean;
	loadTestRoutesFlag: boolean;
	secureHeadersFlag: boolean;
	sequelizeLoggingFlag: boolean;
}

let featureFlags: FeatureFlags = {
	apiRoutesCsrfFlag: parseBoolean(process.env.FEATURE_API_ROUTES_CSRF),
	dbSyncFlag: parseBoolean(process.env.FEATURE_DB_SYNC),
	httpsRedirectFlag: parseBoolean(process.env.FEATURE_HTTPS_REDIRECT),
	ipBlacklistFlag: parseBoolean(process.env.FEATURE_IP_BLACKLIST),
	loadStaticRoutesFlag: parseBoolean(process.env.FEATURE_LOAD_STATIC_ROUTES),
	loadTestRoutesFlag: parseBoolean(process.env.FEATURE_LOAD_TEST_ROUTES),
	secureHeadersFlag: parseBoolean(process.env.FEATURE_SECURE_HEADERS),
	sequelizeLoggingFlag: parseBoolean(process.env.FEATURE_SEQUELIZE_LOGGING)
};

export default featureFlags;
