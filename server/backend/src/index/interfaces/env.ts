export interface EnvVariableTypes {
	batchReEncryptSecretsInterval: number;
	blacklistSyncInterval: number;
	clearExpiredSecretsInterval: number;
	cpuLimit: number;
	cpuThreshold: number;
	cronLoggerSetting: number;
	dbDialect: 'mariadb' | 'mssql' | 'mysql' | 'postgres' | 'sqlite';
	dbInitMaxRetries: number;
	dbInitRetryAfter: number;
	dbName: string;
	dbUser: string;
	diskPath: string;
	emailHost: string;
	emailPort: number;
	emailSecure: boolean;
	emailUser: string;
	eventLoopLagThreshold: number;
	featureApiRoutesCsrf: boolean;
	featureDbSync: boolean;
	featureEnableIpBlacklist: boolean;
	featureEnableJwtAuth: boolean;
	featureEnableLogStash: boolean;
	featureEnableRateLimit: boolean;
	featureEnableResourceAutoScaling: boolean;
	featureEnableSession: boolean;
	featureEncryptSecretsStore: boolean;
	featureHonorCipherOrder: boolean;
	featureHttpsRedirect: boolean;
	featureLoadTestRoutes: boolean;
	featureSequelizeLogging: boolean;
	fido2Timeout: number;
	fidoAuthRequireResidentKey: boolean;
	fidoAuthUserVerification:
		| 'required'
		| 'preferred'
		| 'discouraged'
		| 'enterprise';
	fidoChallengeSize: number;
	fidoCryptoParams: number[];
	gracefulShutdownTimeout: number;
	loggerServiceName: string;
	logLevel: 'debug' | 'info' | 'warn' | 'error';
	logStashHost: string;
	logStashNode: string;
	logStashPort: number;
	maxCacheSize: number;
	maxRedisCacheSize: number;
	memoryLimit: number;
	memoryThreshold: number;
	memoryMonitorInterval: number;
	multerFileSizeLimit: number;
	nodeEnv: 'development' | 'testing' | 'production';
	rateLimiterBaseDuration: number;
	rateLimiterBasePoints: number;
	rateLimiterGlobalReset: number;
	requestTimeout: string;
	revokedTokenRetentionPeriod: number;
	rpName: string;
	secretsExpiryTimeout: number;
	secretsRateLimitMaxAttempts: number;
	secretsRateLimitWindow: number;
	serverPort: number;
	slowdownThreshold: number;
	tokenCacheDuration: number;
}

export interface FeatureFlagTypes {
	[key: string]: boolean;
}
