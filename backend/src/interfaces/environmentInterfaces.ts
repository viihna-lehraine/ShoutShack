export interface ConfigServiceInterface {
	getAppLogger(): import('../services/appLogger').AppLogger;
	getEnvVariables(): EnvVariableTypes;
	getFeatureFlags(): FeatureFlagTypes;
	getSecrets(
		keys: string | string[],
		appLogger: import('../services/appLogger').AppLogger
	): Record<string, string | undefined> | string | undefined;
	refreshSecrets(dependencies: ConfigSecretsInterface): void;
}

export interface ConfigSecretsInterface {
	readonly appLogger: import('../services/appLogger').AppLogger;
	readonly execSync: typeof import('child_process').execSync;
	readonly getDirectoryPath: () => string;
	readonly gpgPassphrase: string;
}

export interface EnvVariableTypes {
	batchReEncryptSecretsInterval: number;
	clearExpiredSecretsInterval: number;
	dbDialect: 'mariadb' | 'mssql' | 'mysql' | 'postgres' | 'sqlite';
	dbHost: string;
	dbName: string;
	dbUser: string;
	emailHost: string;
	emailPort: number;
	emailSecure: boolean;
	emailUser: string;
	featureApiRoutesCsrf: boolean;
	featureDbSync: boolean;
	featureEnableIpBlacklist: boolean;
	featureEnableJwtAuth: boolean;
	featureEnableLogStash: boolean;
	featureEnableRateLimit: boolean;
	featureEnableRedis: boolean;
	featureEnableSession: boolean;
	featureEnableSsl: boolean;
	featureEncryptSecretsStore: boolean;
	featureHonorCipherOrder: boolean;
	featureHttpsRedirect: boolean;
	featureLoadTestRoutes: boolean;
	featureSequelizeLogging: boolean;
	fidoAuthRequireResidentKey: boolean;
	fidoAuthUserVerification:
		| 'required'
		| 'preferred'
		| 'discouraged'
		| 'enterprise';
	fidoChallengeSize: number;
	fidoCryptoParams: number[];
	frontendSecretsPath: string;
	logExportPath: string;
	loggerLevel: string;
	logLevel: 'debug' | 'info' | 'warn' | 'error';
	logStashHost: string;
	logStashNode: string;
	logStashPort: number;
	memoryMonitorInterval: number;
	npmLogPath: string;
	nodeEnv: 'development' | 'testing' | 'production';
	primaryLogPath: string;
	rateLimiterBaseDuration: string;
	rateLimiterBasePoints: string;
	redisUrl: string;
	rpName: string;
	rpIcon: string;
	rpId: string;
	secretsFilePath1: string;
	secretsRateLimitMaxAttempts: number;
	secretsRateLimitWindow: number;
	secretsReEncryptionCooldown: number;
	serverDataFilePath1: string;
	serverDataFilePath2: string;
	serverDataFilePath3: string;
	serverDataFilePath4: string;
	serverPort: number;
	serviceName: string;
	staticRootPath: string;
	tlsCertPath1: string;
	tlsKeyPath1: string;
	yubicoApiUrl: string;
}

export interface FeatureEnabler {
	enableFeatureBasedOnFlag: (
		flag: boolean,
		description: string,
		callback: () => void
	) => void;
	enableFeatureWithProdOverride: (
		flag: boolean,
		description: string,
		callback: () => void
	) => void;
}

export interface FeatureFlagTypes {
	apiRoutesCsrf: boolean;
	dbSync: boolean;
	enableIpBlacklist: boolean;
	enableJwtAuth: boolean;
	enableLogStash: boolean;
	enableRateLimit: boolean;
	enableRedis: boolean;
	enableTLS: boolean;
	encryptSecretsStore: boolean;
	honorCipherOrder: boolean;
	httpsRedirect: boolean;
	loadTestRoutes: boolean;
	sequelizeLogging: boolean;
}

export type FeatureFlagNamesType =
	keyof typeof import('../parameters/environmentParameters').FeatureFlagNames;

export interface FeatureFlagTypes {
	[key: string]: boolean;
}

export type FeatureFlagValueType =
	(typeof import('../parameters/environmentParameters').FeatureFlagNames)[FeatureFlagNamesType];

export interface SecretsMap {
	[key: string]: string;
}
