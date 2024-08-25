interface FeatureFlags {
    apiRoutesCsrfFlag: boolean;
    dbSyncFlag: boolean;
    enableRedisFlag: boolean;
    enableSentryFlag: boolean;
    enableSslFlag: boolean;
    httpsRedirectFlag: boolean;
    ipBlacklistFlag: boolean;
    loadStaticRoutesFlag: boolean;
    loadTestRoutesFlag: boolean;
    secureHeadersFlag: boolean;
    sequelizeLoggingFlag: boolean;
}
export declare const parseBoolean: (value: string | boolean | undefined) => boolean;
export declare function getFeatureFlags(): FeatureFlags;
export {};
//# sourceMappingURL=featureFlags.d.ts.map