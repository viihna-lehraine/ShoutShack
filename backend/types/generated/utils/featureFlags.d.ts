export declare enum FeatureFlagNames {
    API_ROUTES_CSRF = "FEATURE_API_ROUTES_CSRF",
    DB_SYNC = "FEATURE_DB_SYNC",
    DECRYPT_KEYS = "FEATURE_DECRYPT_KEYS",
    ENABLE_CSRF = "FEATURE_ENABLE_CSRF",
    ENABLE_ERROR_HANDLER = "FEATURE_ENABLE_ERROR_HANDLER",
    ENABLE_IP_BLACKLIST = "FEATURE_ENABLE_IP_BLACKLIST",
    ENABLE_JWT_AUTH = "FEATURE_ENABLE_JWT_AUTH",
    ENABLE_RATE_LIMIT = "FEATURE_ENABLE_RATE_LIMIT",
    ENABLE_REDIS = "FEATURE_ENABLE_REDIS",
    ENABLE_SSL = "FEATURE_ENABLE_SSL",
    HTTPS_REDIRECT = "FEATURE_HTTPS_REDIRECT",
    LOAD_TEST_ROUTES = "FEATURE_LOAD_TEST_ROUTES",
    SECURE_HEADERS = "FEATURE_SECURE_HEADERS",
    SEQUELIZE_LOGGING = "FEATURE_SEQUELIZE_LOGGING"
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
export declare function parseBoolean(value: string | boolean | undefined, logger: Logger): boolean;
export declare function getFeatureFlags(logger: Logger, env?: Partial<NodeJS.ProcessEnv>): FeatureFlags;
//# sourceMappingURL=featureFlags.d.ts.map