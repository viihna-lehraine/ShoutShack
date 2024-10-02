import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import {
	EnvConfigServiceInterface,
	EnvVariableTypes,
	FeatureFlagTypes
} from '../index/interfaces';
import { HandleErrorStaticParameters } from '../index/parameters';
import { ServiceFactory } from '../index/factory';

export const __filename = fileURLToPath(import.meta.url);
export const __dirname = dirname(__filename);

export class EnvConfigService implements EnvConfigServiceInterface {
	private static instance: EnvConfigService;
	private logger = ServiceFactory.getLoggerService();
	private errorLogger = ServiceFactory.getErrorLoggerService();
	private errorHandler = ServiceFactory.getErrorHandlerService();

	private constructor() {
		this.loadEnv();
	}

	public static getInstance(): EnvConfigService {
		if (!EnvConfigService.instance) {
			EnvConfigService.instance = new EnvConfigService();
		}

		return EnvConfigService.instance;
	}

	private loadEnv(): void {
		try {
			const masterEnvPath: string = path.join(
				__dirname,
				'../../config/env/backend.master.env'
			);
			config({ path: masterEnvPath });

			const envType = process.env.ENV_TYPE || 'dev';
			console.debug(`envType = ${envType}`);
			const envFile =
				envType === 'docker'
					? 'backend.docker-dev.env'
					: 'backend.dev.env';
			const envPath = path.join(process.cwd(), `./config/env/${envFile}`);
			console.debug(`Loading environment variables from ${envFile}`);

			config({ path: envPath });
		} catch (configError) {
			const configurationError =
				new this.errorHandler.ErrorClasses.ConfigurationError(
					`Failed to load environment variables from .env file\n${configError instanceof Error ? configError.message : configError}\nShutting down...`,
					{ originalError: configError }
				);
			this.errorLogger.logError(configurationError.message);
			const processErrorParams = {
				...HandleErrorStaticParameters,
				error: configurationError,
				details: {
					reason: 'Failed to load environment variables from .env file'
				}
			};
			this.errorHandler.handleError(processErrorParams);
			throw configurationError;
		}
	}

	public getEnvVariable<K extends keyof EnvVariableTypes>(
		key: K
	): EnvVariableTypes[K] {
		const value = process.env[key as string];

		if (value === undefined) {
			throw new Error(`Environment variable ${String(key)} not found`);
		}

		return this.parseEnvValue(value, key);
	}

	private parseEnvValue<K extends keyof EnvVariableTypes>(
		value: string,
		key: K
	): EnvVariableTypes[K] {
		switch (key) {
			// strings
			case 'baseUrl':
			case 'dbHost':
			case 'dbName':
			case 'dbUser':
			case 'diskPath':
			case 'emailHost':
			case 'emailUser':
			case 'frontendSecretsPath':
			case 'ipWhitelistPath':
			case 'logExportPath':
			case 'loggerServiceName':
			case 'logStashHost':
			case 'logStashNode':
			case 'npmLogPath':
			case 'primaryLogPath':
			case 'redisUrl':
			case 'revokedTokenRetentionPeriod':
			case 'rpName':
			case 'rpIcon':
			case 'rpId':
			case 'rpOrigin':
			case 'secretsFilePath1':
			case 'serverDataFilePath1':
			case 'serverDataFilePath2':
			case 'serverDataFilePath3':
			case 'serverDataFilePath4':
			case 'staticRootPath':
			case 'tempDir':
			case 'tokenExpiryListPath':
			case 'tokenRevokedListPath':
			case 'tlsCertPath1':
			case 'tlsKeyPath1':
			case 'yubicoApiUrl':
				return value as EnvVariableTypes[K];

			// number
			case 'batchReEncryptSecretsInterval':
			case 'blacklistSyncInterval':
			case 'clearExpiredSecretsInterval':
			case 'cpuLimit':
			case 'cpuThreshold':
			case 'cronLoggerSetting':
			case 'dbInitMaxRetries':
			case 'dbInitRetryAfter':
			case 'emailPort':
			case 'eventLoopLagThreshold':
			case 'fido2Timeout':
			case 'fidoChallengeSize':
			case 'gracefulShutdownTimeout':
			case 'logStashPort':
			case 'maxCacheSize':
			case 'maxRedisCacheSize':
			case 'memoryLimit':
			case 'memoryThreshold':
			case 'memoryMonitorInterval':
			case 'multerFileSizeLimit':
			case 'rateLimiterBaseDuration':
			case 'rateLimiterBasePoints':
			case 'rateLimiterGlobalReset':
			case 'secretsExpiryTimeout':
			case 'secretsRateLimitMaxAttempts':
			case 'secretsRateLimitWindow':
			case 'serverPort':
			case 'slowdownThreshold':
			case 'tokenCacheDuration':
				return Number(value) as EnvVariableTypes[K];

			// boolean
			case 'emailSecure':
			case 'featureApiRoutesCsrf':
			case 'featureDbSync':
			case 'featureEnableIpBlacklist':
			case 'featureEnableJwtAuth':
			case 'featureEnableLogStash':
			case 'featureEnableRateLimit':
			case 'featureEnableResourceAutoScaling':
			case 'featureEnableSession':
			case 'featureEncryptSecretsStore':
			case 'featureHonorCipherOrder':
			case 'featureHttpsRedirect':
			case 'featureLoadTestRoutes':
			case 'featureSequelizeLogging':
			case 'fidoAuthRequireResidentKey':
				return (value.toLowerCase() === 'true') as EnvVariableTypes[K];

			// number[]
			case 'fidoCryptoParams':
				return value.split(',').map(Number) as EnvVariableTypes[K];

			// enum-like
			case 'dbDialect':
			case 'nodeEnv':
			case 'fidoAuthUserVerification':
			case 'logLevel':
				return value as EnvVariableTypes[K];

			default:
				throw new Error(
					`Unsupported environment variable key: ${String(key)}`
				);
		}
	}

	public getFeatureFlags(): FeatureFlagTypes {
		return {
			apiRoutesCsrf: this.parseBoolean(
				process.env.FEATURE_API_ROUTES_CSRF
			),
			dbSync: this.parseBoolean(process.env.FEATURE_DB_SYNC),
			enableIpBlacklist: this.parseBoolean(
				process.env.FEATURE_ENABLE_IP_BLACKLIST
			)!,
			enableJwtAuth: this.parseBoolean(
				process.env.FEATURE_ENABLE_JWT_AUTH
			)!,
			enableRateLimit: this.parseBoolean(
				process.env.FEATURE_ENABLE_RATE_LIMIT
			)!,
			enableRedis: this.parseBoolean(process.env.FEATURE_ENABLE_REDIS),
			enableResourceAutoScaling: this.parseBoolean(
				process.env.FEATURE_ENABLE_RESOURCE_AUTO_SCALING
			),
			encryptSecretsStore: this.parseBoolean(
				process.env.FEATURE_ENCRYPT_STORE
			),
			honorCipherOrder: this.parseBoolean(
				process.env.FEATURE_HONOR_CIPHER_ORDER
			),
			httpsRedirect: this.parseBoolean(
				process.env.FEATURE_HTTPS_REDIRECT
			),
			loadTestRoutes: this.parseBoolean(
				process.env.FEATURE_LOAD_TEST_ROUTE!
			),
			sequelizeLogging: this.parseBoolean(
				process.env.FEATURE_SEQUELIZE_LOGGING
			)
		};
	}

	private parseBoolean(value: string | undefined): boolean {
		return value?.toLowerCase() === 'true';
	}
}
