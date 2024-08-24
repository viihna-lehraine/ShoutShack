interface FeatureFlags {
	apiRoutesCsrfFlag: boolean;
	dbSyncFlag: boolean;
	http1Flag: boolean;
	http2Flag: boolean;
	httpsRedirectFlag: boolean;
	ipBlacklistFlag: boolean;
	loadStaticRoutesFlag: boolean;
	loadTestRoutesFlag: boolean;
	secureHeadersFlag: boolean;
}
declare const featureFlags: FeatureFlags;
export default featureFlags;
//# sourceMappingURL=featureFlags.d.ts.map
