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
export declare const parseBoolean: (value: string | boolean | undefined) => boolean;
export declare function getFeatureFlags(): FeatureFlags;
export {};
//# sourceMappingURL=featureFlags.d.ts.map