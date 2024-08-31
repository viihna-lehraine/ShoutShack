import { afterEach, describe, expect, it, vi } from 'vitest';
import { getFeatureFlags } from '../../dist/config/featureFlags.mjs';

describe('getFeatureFlags', () => {
	const originalEnv = process.env;

	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		process.env = { ...originalEnv };
	});

	it('should return correct flags when all features are enabled', () => {
		process.env.FEATURE_API_ROUTES_CSRF = 'true';
		process.env.FEATURE_DB_SYNC = 'true';
		process.env.FEATURE_DECRYPT_KEYS = 'true';
		process.env.FEATURE_ENABLE_CSRF = 'true';
		process.env.FEATURE_ENABLE_ERROR_HANDLER = 'true';
		process.env.FEATURE_ENABLE_IP_BLACKLIST = 'true';
		process.env.FEATURE_ENABLE_JWT_AUTH = 'true';
		process.env.FEATURE_ENABLE_REDIS = 'true';
		process.env.FEATURE_ENABLE_SENTRY = 'true';
		process.env.FEATURE_ENABLE_SSL = 'true';
		process.env.FEATURE_HTTPS_REDIRECT = 'true';
		process.env.FEATURE_LOAD_STATIC_ROUTES = 'true';
		process.env.FEATURE_LOAD_TEST_ROUTES = 'true';
		process.env.FEATURE_SECURE_HEADERS = 'true';
		process.env.FEATURE_SEQUELIZE_LOGGING = 'true';

		const flags = getFeatureFlags();

		expect(flags).toEqual({
			apiRoutesCsrfFlag: true,
			dbSyncFlag: true,
			decryptKeysFlag: true,
			enableCsrfFlag: true,
			enableErrorHandlerFlag: true,
			enableIpBlacklistFlag: true,
			enableJwtAuthFlag: true,
			enableRedisFlag: true,
			enableSentryFlag: true,
			enableSslFlag: true,
			httpsRedirectFlag: true,
			loadStaticRoutesFlag: true,
			loadTestRoutesFlag: true,
			secureHeadersFlag: true,
			sequelizeLoggingFlag: true
		});
	});

	it('should return correct flags when all features are disabled', () => {
		process.env.FEATURE_API_ROUTES_CSRF = 'false';
		process.env.FEATURE_DB_SYNC = 'false';
		process.env.FEATURE_DECRYPT_KEYS = 'false';
		process.env.FEATURE_ENABLE_CSRF = 'false';
		process.env.FEATURE_ENABLE_ERROR_HANDLER = 'false';
		process.env.FEATURE_ENABLE_IP_BLACKLIST = 'false';
		process.env.FEATURE_ENABLE_JWT_AUTH = 'false';
		process.env.FEATURE_ENABLE_REDIS = 'false';
		process.env.FEATURE_ENABLE_SENTRY = 'false';
		process.env.FEATURE_ENABLE_SSL = 'false';
		process.env.FEATURE_HTTPS_REDIRECT = 'false';
		process.env.FEATURE_LOAD_STATIC_ROUTES = 'false';
		process.env.FEATURE_LOAD_TEST_ROUTES = 'false';
		process.env.FEATURE_SECURE_HEADERS = 'false';
		process.env.FEATURE_SEQUELIZE_LOGGING = 'false';

		const flags = getFeatureFlags();

		expect(flags).toEqual({
			apiRoutesCsrfFlag: false,
			dbSyncFlag: false,
			decryptKeysFlag: false,
			enableCsrfFlag: false,
			enableErrorHandlerFlag: false,
			enableIpBlacklistFlag: false,
			enableJwtAuthFlag: false,
			enableRedisFlag: false,
			enableSentryFlag: false,
			enableSslFlag: false,
			httpsRedirectFlag: false,
			loadStaticRoutesFlag: false,
			loadTestRoutesFlag: false,
			secureHeadersFlag: false,
			sequelizeLoggingFlag: false
		});
	});

	it('should handle cases where environment variables are not set (default to false)', () => {
		delete process.env.FEATURE_API_ROUTES_CSRF;
		delete process.env.FEATURE_DB_SYNC;
		delete process.env.FEATURE_DECRYPT_KEYS;
		delete process.env.FEATURE_ENABLE_CSRF;
		delete process.env.FEATURE_ENABLE_ERROR_HANDLER;
		delete process.env.FEATURE_ENABLE_IP_BLACKLIST;
		delete process.env.FEATURE_ENABLE_JWT_AUTH;
		delete process.env.FEATURE_ENABLE_REDIS;
		delete process.env.FEATURE_ENABLE_SENTRY;
		delete process.env.FEATURE_ENABLE_SSL;
		delete process.env.FEATURE_HTTPS_REDIRECT;
		delete process.env.FEATURE_LOAD_STATIC_ROUTES;
		delete process.env.FEATURE_LOAD_TEST_ROUTES;
		delete process.env.FEATURE_SECURE_HEADERS;
		delete process.env.FEATURE_SEQUELIZE_LOGGING;

		const flags = getFeatureFlags();

		expect(flags).toEqual({
			apiRoutesCsrfFlag: false,
			dbSyncFlag: false,
			decryptKeysFlag: false,
			enableCsrfFlag: false,
			enableErrorHandlerFlag: false,
			enableIpBlacklistFlag: false,
			enableJwtAuthFlag: false,
			enableRedisFlag: false,
			enableSentryFlag: false,
			enableSslFlag: false,
			httpsRedirectFlag: false,
			loadStaticRoutesFlag: false,
			loadTestRoutesFlag: false,
			secureHeadersFlag: false,
			sequelizeLoggingFlag: false
		});
	});

	it('should return false for unexpected values without logging', () => {
		process.env.FEATURE_API_ROUTES_CSRF = 'unexpected';
		process.env.FEATURE_DB_SYNC = 'unexpected';
		process.env.FEATURE_DECRYPT_KEYS = 'unexpected';
		process.env.FEATURE_ENABLE_CSRF = 'unexpected';
		process.env.FEATURE_ENABLE_ERROR_HANDLER = 'unexpected';
		process.env.FEATURE_ENABLE_IP_BLACKLIST = 'unexpected';
		process.env.FEATURE_ENABLE_JWT_AUTH = 'unexpected';
		process.env.FEATURE_ENABLE_REDIS = 'unexpected';
		process.env.FEATURE_ENABLE_SENTRY = 'unexpected';
		process.env.FEATURE_ENABLE_SSL = 'unexpected';
		process.env.FEATURE_HTTPS_REDIRECT = 'unexpected';
		process.env.FEATURE_LOAD_STATIC_ROUTES = 'unexpected';
		process.env.FEATURE_LOAD_TEST_ROUTES = 'unexpected';
		process.env.FEATURE_SECURE_HEADERS = 'unexpected';
		process.env.FEATURE_SEQUELIZE_LOGGING = 'unexpected';

		const flags = getFeatureFlags();

		expect(flags.apiRoutesCsrfFlag).toBe(false);
		expect(flags.dbSyncFlag).toBe(false);
		expect(flags.decryptKeysFlag).toBe(false);
		expect(flags.enableCsrfFlag).toBe(false);
		expect(flags.enableErrorHandlerFlag).toBe(false);
		expect(flags.enableIpBlacklistFlag).toBe(false);
		expect(flags.enableJwtAuthFlag).toBe(false);
		expect(flags.enableRedisFlag).toBe(false);
		expect(flags.enableSentryFlag).toBe(false);
		expect(flags.enableSslFlag).toBe(false);
		expect(flags.httpsRedirectFlag).toBe(false);
		expect(flags.loadStaticRoutesFlag).toBe(false);
		expect(flags.loadTestRoutesFlag).toBe(false);
		expect(flags.secureHeadersFlag).toBe(false);
		expect(flags.sequelizeLoggingFlag).toBe(false);
	});

	it('should return true for mixed case strings like "True" or "FALSE"', () => {
		process.env.FEATURE_API_ROUTES_CSRF = 'True';
		process.env.FEATURE_DB_SYNC = 'FALSE';
		process.env.FEATURE_DECRYPT_KEYS = 'TrUe';
		process.env.FEATURE_ENABLE_CSRF = 'FaLsE';
		process.env.FEATURE_ENABLE_ERROR_HANDLER = 'TRUE';
		process.env.FEATURE_ENABLE_IP_BLACKLIST = 'FALsE';
		process.env.FEATURE_ENABLE_JWT_AUTH = 'TRuE';
		process.env.FEATURE_ENABLE_REDIS = 'fAlSe';
		process.env.FEATURE_ENABLE_SENTRY = 'tRuE';
		process.env.FEATURE_ENABLE_SSL = 'fAlSe';
		process.env.FEATURE_HTTPS_REDIRECT = 'TrUe';
		process.env.FEATURE_LOAD_STATIC_ROUTES = 'FaLsE';
		process.env.FEATURE_LOAD_TEST_ROUTES = 'tRUE';
		process.env.FEATURE_SECURE_HEADERS = 'fALsE';
		process.env.FEATURE_SEQUELIZE_LOGGING = 'TrUe';

		const flags = getFeatureFlags();

		expect(flags.apiRoutesCsrfFlag).toBe(true);
		expect(flags.dbSyncFlag).toBe(false);
		expect(flags.decryptKeysFlag).toBe(true);
		expect(flags.enableCsrfFlag).toBe(false);
		expect(flags.enableErrorHandlerFlag).toBe(true);
		expect(flags.enableIpBlacklistFlag).toBe(false);
		expect(flags.enableJwtAuthFlag).toBe(true);
		expect(flags.enableRedisFlag).toBe(false);
		expect(flags.enableSentryFlag).toBe(true);
		expect(flags.enableSslFlag).toBe(false);
		expect(flags.httpsRedirectFlag).toBe(true);
		expect(flags.loadStaticRoutesFlag).toBe(false);
		expect(flags.loadTestRoutesFlag).toBe(true);
		expect(flags.secureHeadersFlag).toBe(false);
		expect(flags.sequelizeLoggingFlag).toBe(true);
	});
});
