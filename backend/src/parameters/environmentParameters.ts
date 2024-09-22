import { EnvVariableTypes } from '../interfaces/environmentInterfaces';
import { parseBoolean } from '../utils/helpers';

const parsedEmailSecure = parseBoolean(process.env.EMAIL_SECURE);
const parsedFidoAuthRequireResidentKey = parseBoolean(
	process.env.FIDO_AUTH_REQUIRE_RESIDENT_KEY
);
const parsedFidoCryptoParams: number[] = JSON.parse(
	process.env.FIDO_CRYPTO_PARAMS || '[]'
);

export const envVariables: EnvVariableTypes = {
	batchReEncryptSecretsInterval: parseInt(
		process.env.BATCH_RE_ENCRYPT_SECRETS_INTERVAL!,
		10
	),
	clearExpiredSecretsInterval: parseInt(
		process.env.TZ_CLEAR_EXPIRED_SECRETS_INTERVAL!,
		10
	),
	dbHost: process.env.DB_HOST!,
	dbName: process.env.DB_NAME!,
	dbDialect: process.env.DB_DIALECT! as
		| 'mariadb'
		| 'mssql'
		| 'mysql'
		| 'postgres'
		| 'sqlite',
	dbUser: process.env.DB_USER!,
	emailHost: process.env.EMAIL_HOST!,
	emailPort: parseInt(process.env.EMAIL_PORT!, 10),
	emailSecure: parsedEmailSecure!,
	emailUser: process.env.EMAIL_USER!,
	featureApiRoutesCsrf: process.env.FEATURE_API_ROUTES_CSRF === 'true',
	featureDbSync: process.env.FEATURE_DB_SYNC === 'true',
	featureEnableIpBlacklist:
		process.env.FEATURE_ENABLE_IP_BLACKLIST === 'true',
	featureEnableJwtAuth: process.env.FEATURE_ENABLE_JWT_AUTH === 'true',
	featureEnableLogStash: process.env.FEATURE_ENABLE_LOGSTASH === 'true',
	featureEnableRateLimit: process.env.FEATURE_ENABLE_RATE_LIMIT === 'true',
	featureEnableRedis: process.env.FEATURE_ENABLE_REDIS! === 'true',
	featureEnableSession: process.env.FEATURE_ENABLE_SESSION! === 'true',
	featureEnableSsl: process.env.FEATURE_ENABLE_SSL! === 'true',
	featureEncryptSecretsStore: process.env.FEATURE_ENCRYPTS_STORE! === 'true',
	featureHttpsRedirect: process.env.FEATURE_HTTPS_REDIRECT! === 'true',
	featureLoadTestRoutes: process.env.FEATURE_LOAD_TEST_ROUTES! === 'true',
	featureSequelizeLogging: process.env.FEATURE_SEQUELIZE_LOGGING! === 'true',
	featureHonorCipherOrder: process.env.FEATURE_HONOR_CIPHER_ORDER! === 'true',
	fidoAuthRequireResidentKey: parsedFidoAuthRequireResidentKey!,
	fidoAuthUserVerification: process.env
		.FIDO_AUTHENTICATOR_USER_VERIFICATION! as
		| 'required'
		| 'preferred'
		| 'discouraged'
		| 'enterprise',
	fidoChallengeSize: parseInt(process.env.FIDO_CHALLENGE_SIZE!, 10),
	fidoCryptoParams: parsedFidoCryptoParams!,
	frontendSecretsPath: process.env.FRONTEND_SECRETS_PATH!,
	logExportPath: process.env.LOG_EXPORT_PATH!,
	loggerLevel: process.env.LOGGER!,
	logLevel: process.env.LOG_LEVEL! as 'debug' | 'info' | 'warn' | 'error',
	logStashHost: process.env.LOGSTASH_HOST!,
	logStashNode: process.env.LOGSTASH_NODE!,
	logStashPort: parseInt(process.env.LOGSTASH_PORT!, 10),
	memoryMonitorInterval: parseInt(process.env.MEMORY_MONITOR_INTERVAL!, 10),
	nodeEnv: process.env.NODE_ENV! as 'development' | 'testing' | 'production',
	npmLogPath: process.env.SERVER_NPM_LOG_PATH!,
	primaryLogPath: process.env.SERVER_LOG_PATH!,
	rateLimiterBaseDuration: process.env.RATE_LIMITER_BASE_DURATION!,
	rateLimiterBasePoints: process.env.RATE_LIMITER_BASE_POINTS!,
	redisUrl: process.env.REDIS_URL!,
	rpName: process.env.RP_NAME!,
	rpIcon: process.env.RP_ICON!,
	rpId: process.env.RP_ID!,
	secretsFilePath1: process.env.SECRETS_FILE_PATH_1!,
	secretsRateLimitMaxAttempts: parseInt(
		process.env.SECRETS_RATE_LIMIT_MAX_ATTEMPTS!,
		10
	),
	secretsRateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW!, 10),
	secretsReEncryptionCooldown: parseInt(
		process.env.SECRETS_RE_ENCRYPTION_COOLDOWN!,
		10
	),
	serverDataFilePath1: process.env.SERVER_DATA_FILE_PATH_1!,
	serverDataFilePath2: process.env.SERVER_DATA_FILE_PATH_2!,
	serverDataFilePath3: process.env.SERVER_DATA_FILE_PATH_3!,
	serverDataFilePath4: process.env.SERVER_DATA_FILE_PATH_4!,
	serverPort: parseInt(process.env.SERVER_PORT!, 10),
	serviceName: process.env.SERVICE_NAME!,
	staticRootPath: process.env.STATIC_ROOT_PATH!,
	tlsCertPath1: process.env.TLS_CERT_PATH_1!,
	tlsKeyPath1: process.env.TLS_KEY_PATH_1!,
	yubicoApiUrl: process.env.YUBICO_API_URL!
};

export const FeatureFlagNames = {
	API_ROUTES_CSR: 'FEATURE_API_ROUTES_CSRF',
	DB_SYNC: 'FEATURE_DB_SYNC',
	ENABLE_CSRF: 'FEATURE_ENABLE_CSRF',
	ENABLE_IP_BLACKLIST: 'FEATURE_ENABLE_IP_BLACKLIST',
	ENABLE_JWT_AUTH: 'FEATURE_ENABLE_JWT_AUTH',
	ENABLE_LOG_STASH: 'FEATURE_ENABLE_LOG_STASH',
	ENABLE_RATE_LIMIT: 'FEATURE_ENABLE_RATE_LIMIT',
	ENABLE_REDIS: 'FEATURE_ENABLE_REDIS',
	ENABLE_TLS: 'FEATURE_ENABLE_TLS',
	ENCRYPT_SECRETS_STORE: 'FEATURE_ENCRYPT_SECRETS_STORE',
	HONOR_CIPHER_ORDER: 'FEATURE_HONOR_CIPHER_ORDER',
	HTTPS_REDIRECT: 'FEATURE_HTTPS_REDIRECT',
	LOAD_TEST_ROUTES: 'FEATURE_LOAD_TEST_ROUTES',
	SECURE_HEADERS: 'FEATURE_SECURE_HEADERS',
	SEQUELIZE_LOGGING: 'FEATURE_SEQUELIZE_LOGGING'
} as const;
