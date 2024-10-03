export interface EnvVariableTypes {
	baseUrl: string;
	batchReEncryptSecretsInterval: number;
	blacklistSyncInterval: number;
	clearExpiredSecretsInterval: number;
	cpuLimit: number;
	cpuThreshold: number;
	cronLoggerSetting: number;
	dbDialect: 'mariadb' | 'mssql' | 'mysql' | 'postgres' | 'sqlite';
	dbHost: string;
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
	frontendSecretsPath: string;
	gracefulShutdownTimeout: number;
	ipWhitelistPath: string;
	logExportPath: string;
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
	multerStorageDir: string;
	multerUploadDir: string;
	npmLogPath: string;
	nodeEnv: 'development' | 'testing' | 'production';
	primaryLogPath: string;
	rateLimiterBaseDuration: number;
	rateLimiterBasePoints: number;
	rateLimiterGlobalReset: number;
	redisUrl: string;
	requestTimeout: string;
	revokedTokenRetentionPeriod: number;
	rpName: string;
	rpIcon: string;
	rpId: string;
	rpOrigin: string;
	secretsExpiryTimeout: number;
	secretsFilePath1: string;
	secretsRateLimitMaxAttempts: number;
	secretsRateLimitWindow: number;
	serverDataFilePath1: string;
	serverDataFilePath2: string;
	serverDataFilePath3: string;
	serverDataFilePath4: string;
	serverPort: number;
	staticRootPath: string;
	slowdownThreshold: number;
	tempDir: string;
	tlsCertPath1: string;
	tlsKeyPath1: string;
	tokenExpiryListPath: string;
	tokenRevokedListPath: string;
	tokenCacheDuration: number;
	yubicoApiUrl: string;
}

export interface FeatureFlagTypes {
	[key: string]: boolean;
}

export interface SecretsMap {
	DB_PASSWORD: string;
	DB_HOST: string;
	EMAIL_MFA_KEY: string;
	JWT_SECRET: string;
	PEPPER: string;
	REDIS_PASSWORD: string;
	REDIS_URL: string;
	SMTP_TOKEN: string;
	YUBICO_CLIENT_ID: number;
	YUBICO_SECRET_KEY: string;
}
