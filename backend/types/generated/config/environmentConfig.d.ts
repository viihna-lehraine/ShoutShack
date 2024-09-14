import { Logger } from '../utils/logger';
export declare function loadEnv(): void;
interface EnvironmentVariableTypes {
    backendLogExportPath: string;
    emailUser: string;
    featureApiRoutesCsrf: boolean;
    featureDbSync: boolean;
    featureDecryptKeys: boolean;
    featureEnableErrorHandler: boolean;
    featureEnableIpBlacklist: boolean;
    featureEnableJwtAuth: boolean;
    featureEnableRateLimit: boolean;
    featureEnableRedis: boolean;
    featureEnableSession: boolean;
    featureEnableSsl: boolean;
    featureHttpsRedirect: boolean;
    featureLoadTestRoutes: boolean;
    featureSequelizeLogging: boolean;
    frontendSecretsPath: string;
    loggerLevel: string;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    nodeEnv: 'development' | 'testing' | 'production';
    serverDataFilePath1: string;
    serverDataFilePath2: string;
    serverDataFilePath3: string;
    serverDataFilePath4: string;
    serverLogPath: string;
    serverNpmLogPath: string;
    serverPort: number;
    serverSslCertPath: string;
    serverSslKeyPath: string;
    serviceName: string;
    staticRootPath: string;
    yubicoApiUrl: string;
}
export declare const environmentVariables: EnvironmentVariableTypes;
export declare const FeatureFlagNames: {
    readonly API_ROUTES_CSR: "FEATURE_API_ROUTES_CSRF";
    readonly DB_SYNC: "FEATURE_DB_SYNC";
    readonly DECRYPT_KEYS: "FEATURE_DECRYPT_KEYS";
    readonly ENABLE_CSRF: "FEATURE_ENABLE_CSRF";
    readonly ENABLE_ERROR_HANDLER: "FEATURE_ENABLE_ERROR_HANDLER";
    readonly ENABLE_IP_BLACKLIST: "FEATURE_ENABLE_IP_BLACKLIST";
    readonly ENABLE_JWT_AUTH: "FEATURE_ENABLE_JWT_AUTH";
    readonly ENABLE_RATE_LIMIT: "FEATURE_ENABLE_RATE_LIMIT";
    readonly ENABLE_REDIS: "FEATURE_ENABLE_REDIS";
    readonly ENABLE_SSL: "FEATURE_ENABLE_SSL";
    readonly HTTPS_REDIRECT: "FEATURE_HTTPS_REDIRECT";
    readonly LOAD_TEST_ROUTES: "FEATURE_LOAD_TEST_ROUTES";
    readonly SECURE_HEADERS: "FEATURE_SECURE_HEADERS";
    readonly SEQUELIZE_LOGGING: "FEATURE_SEQUELIZE_LOGGING";
};
export type FeatureFlagNamesType = keyof typeof FeatureFlagNames;
export type FeatureFlagValueType = typeof FeatureFlagNames[FeatureFlagNamesType];
export interface FeatureFlags {
    apiRoutesCsrfFlag: boolean;
    dbSyncFlag: boolean;
    decryptKeysFlag: boolean;
    enableErrorHandlerFlag: boolean;
    enableIpBlacklistFlag: boolean;
    enableJwtAuthFlag: boolean;
    enableRateLimitFlag: boolean;
    enableRedisFlag: boolean;
    enableSslFlag: boolean;
    httpsRedirectFlag: boolean;
    loadTestRoutesFlag: boolean;
    sequelizeLoggingFlag: boolean;
}
export declare function parseBoolean(value: string | boolean | undefined, logger: Logger | Console): boolean;
export declare function getFeatureFlags(logger: Logger | Console, env?: Partial<NodeJS.ProcessEnv>): FeatureFlags;
export declare function createFeatureEnabler(logger: Logger): {
    enableFeatureBasedOnFlag(flag: boolean, description: string, callback: () => void): void;
    enableFeatureWithProdOverride(flag: boolean, description: string, callback: () => void): void;
};
export {};
//# sourceMappingURL=environmentConfig.d.ts.map
