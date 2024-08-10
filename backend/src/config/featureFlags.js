import loadEnv from './loadEnv.js';
import { parseBoolean } from '../utils/parseBoolean.js';

loadEnv();

const featureFlags = {
	apiRoutesCsrfFlag: parseBoolean(process.env.FEATURE_API_ROUTES_CSRF),
	dbSyncFlag: parseBoolean(process.env.FEATURE_DB_SYNC),
	http1Flag: parseBoolean(process.env.FEATURE_HTTP1),
	http2Flag: parseBoolean(process.env.FEATURE_HTTP2),
	httpsRedirectFlag: parseBoolean(process.env.FEATURE_HTTPS_REDIRECT),
	ipBlacklistFlag: parseBoolean(process.env.FEATURE_IP_BLACKLIST),
	loadStaticRoutesFlag: parseBoolean(process.env.FEATURE_LOAD_STATIC_ROUTES),
	loadTestRoutesFlag: parseBoolean(process.env.FEATURE_LOAD_TEST_ROUTES),
	secureHeadersFlag: parseBoolean(process.env.FEATURE_SECURE_HEADERS),
};

// export default featureFlags;
