import { config } from 'dotenv';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import { configService } from '../services/configService';
import { AppError, errorClasses, ErrorSeverity } from '../errors/errorClasses';
import {
	FeatureEnabler,
	FeatureFlagTypes
} from '../interfaces/environmentInterfaces';
import { AppLogger } from '../services/appLogger';
import { errorLogger } from '../services/errorLogger';
import { processError } from '../errors/processError';
import { blankRequest, parseBoolean } from '../utils/helpers';
import { errorLoggerDetails, getCallerInfo } from '../utils/helpers';

export const __filename = fileURLToPath(import.meta.url);
export const __dirname = dirname(__filename);

const appLogger: AppLogger = configService.getAppLogger();

export function loadEnv(): void {
	try {
		const masterEnvPath: string = path.join(
			__dirname,
			'../../config/env/backend.master.env'
		);
		config({ path: masterEnvPath });

		const envType = process.env.ENV_TYPE || 'dev';
		console.debug(`envType = ${envType}`);
		const envFile =
			envType === 'docker' ? 'backend.docker-dev.env' : 'backend.dev.env';
		const envPath = path.join(process.cwd(), `./config/env/${envFile}`);
		console.debug(`Loading environment variables from ${envFile}`);

		config({ path: envPath });
	} catch (configError) {
		const configurationError = new errorClasses.ConfigurationError(
			`Failed to load environment variables from .env file\n${configError instanceof Error ? configError.message : configError}\nShutting down...`,
			{
				originalError: configError,
				statusCode: 404,
				severity: ErrorSeverity.FATAL,
				exposeToClient: false
			}
		);
		errorLogger.logError(
			configurationError as AppError,
			errorLoggerDetails(getCallerInfo, blankRequest, 'LOAD_ENV'),
			appLogger,
			ErrorSeverity.FATAL
		);
		processError(configError);
		throw configurationError;
	}
}

export function getFeatureFlags(
	env: Partial<NodeJS.ProcessEnv> = process.env
): FeatureFlagTypes {
	try {
		return {
			apiRoutesCsrf: parseBoolean(env.FEATURE_API_ROUTES_CSRF),
			dbSync: parseBoolean(env.FEATURE_DB_SYNC),
			enableIpBlacklist: parseBoolean(env.FEATURE_ENABLE_IP_BLACKLIST),
			enableJwtAuth: parseBoolean(env.FEATURE_ENABLE_JWT_AUTH),
			enableLogStash: parseBoolean(env.FEATURE_ENABLE_LOGSTASH),
			enableRateLimit: parseBoolean(env.FEATURE_ENABLE_RATE_LIMIT),
			enableRedis: parseBoolean(env.FEATURE_ENABLE_REDIS),
			enableTLS: parseBoolean(env.FEATURE_ENABLE_SSL),
			encryptSecretsStore: parseBoolean(env.FEATURE_ENCRYPT_STORE),
			honorCipherOrder: parseBoolean(env.FEATURE_HONOR_CIPHER_ORDER),
			httpsRedirect: parseBoolean(env.FEATURE_HTTPS_REDIRECT),
			loadTestRoutes: parseBoolean(env.FEATURE_LOAD_TEST_ROUTES),
			sequelizeLogging: parseBoolean(env.FEATURE_SEQUELIZE_LOGGING)
		};
	} catch (utilError) {
		const utility: string = 'getFeatureFlags()';
		const utilityError = new errorClasses.UtilityErrorRecoverable(
			`Failed to get feature flags using the utility ${utility}: ${utilError instanceof Error ? utilError.message : utilError}`,
			{ utility, exposeToClient: false }
		);
		errorLogger.logError(
			utilityError as AppError,
			errorLoggerDetails(
				getCallerInfo,
				blankRequest,
				'GET_FEATURE_FLAGS'
			),
			appLogger,
			ErrorSeverity.RECOVERABLE
		);
		processError(utilityError);
		return {
			apiRoutesCsrf: false,
			dbSync: false,
			enableIpBlacklist: false,
			enableJwtAuth: false,
			enableLogStash: false,
			enableRateLimit: false,
			enableRedis: false,
			enableTLS: false,
			encryptSecretsStore: false,
			honorCipherOrder: true,
			httpsRedirect: false,
			loadTestRoutes: false,
			sequelizeLogging: false
		};
	}
}

// *DEV-NOTE* this is unused, and should be implemented
export function createFeatureEnabler(): FeatureEnabler {
	const appLogger = configService.getAppLogger() || console;

	try {
		return {
			enableFeatureBasedOnFlag(
				flag: boolean,
				description: string,
				callback: () => void
			): void {
				if (flag) {
					appLogger.info(`Enabling ${description} (flag is ${flag})`);
					callback();
				} else {
					appLogger.info(`Skipping ${description} (flag is ${flag})`);
				}
			},
			enableFeatureWithProdOverride(
				flag: boolean,
				description: string,
				callback: () => void
			): void {
				if (process.env.NODE_ENV === 'production') {
					appLogger.info(
						`Enabling ${description} in production regardless of flag value.`
					);
					callback();
				} else if (flag) {
					appLogger.info(`Enabling ${description} (flag is ${flag})`);
					callback();
				} else {
					appLogger.info(`Skipping ${description} (flag is ${flag})`);
				}
			}
		};
	} catch (utilError) {
		const utility: string = 'createFeatureEnabler()';
		const utilityError = new errorClasses.UtilityErrorRecoverable(
			`Failed to create feature enabler using the utility ${utility}: ${utilError instanceof Error ? utilError.message : utilError}`,
			{
				utility,
				originalError: utilError,
				statusCode: 500,
				severity: ErrorSeverity.RECOVERABLE,
				exposeToClient: false
			}
		);
		errorLogger.logError(
			utilityError as AppError,
			errorLoggerDetails(
				getCallerInfo,
				blankRequest,
				'CREATE_FEATURE_ENABLER'
			),
			appLogger,
			ErrorSeverity.RECOVERABLE
		);
		processError(utilityError);
		return {
			enableFeatureBasedOnFlag: (): void => {},
			enableFeatureWithProdOverride: (): void => {}
		};
	}
}

export function displayEnvAndFeatureFlags(): void {
	try {
		console.log('Environment Variables:');
		console.table(configService.getEnvVariables());

		console.log('\nFeature Flags:');
		console.table(configService.getFeatureFlags());
	} catch (displayError) {
		const displayUtility = 'displayEnvAndFeatureFlags()';
		const displayErrorObj = new errorClasses.UtilityErrorRecoverable(
			`Error displaying environment variables and feature flags using ${displayUtility}: ${displayError instanceof Error ? displayError.message : displayError}`,
			{
				originalError: displayError,
				statusCode: 500,
				severity: ErrorSeverity.RECOVERABLE,
				exposeToClient: false
			}
		);
		errorLogger.logError(
			displayErrorObj as AppError,
			errorLoggerDetails(getCallerInfo, blankRequest, 'DISPLAY_ENV'),
			appLogger,
			ErrorSeverity.RECOVERABLE
		);
		processError(displayErrorObj);
	}
}
