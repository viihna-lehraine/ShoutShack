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
export declare function parseBoolean(value: string | boolean | undefined, logger: {
    warn: (message: string) => void;
}): boolean;
export declare function getFeatureFlags(logger: {
    warn: (message: string) => void;
}, env?: NodeJS.ProcessEnv): FeatureFlags;
//# sourceMappingURL=featureFlags.d.ts.map