import { config } from 'dotenv';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import { configService } from '../services/configService';
import { AppError, errorClasses, ErrorSeverity } from '../errors/errorClasses';
import {
	FeatureEnabler,
	FeatureFlagTypes
} from '../index/environmentInterfaces';
import { ProcessErrorStaticParameters } from '../parameters/errorParameters';
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
		const processErrorParams = {
			...ProcessErrorStaticParameters,
			error: configurationError,
			req: blankRequest,
			details: {
				reason: 'Failed to load environment variables from .env file'
			}
		};
		processError(processErrorParams);
		throw configurationError;
	}
}

export function getFeatureFlags(): FeatureFlagTypes {
	try {
		return {
			apiRoutesCsrf: parseBoolean(process.env.FEATURE_API_ROUTES_CSRF),
			dbSync: parseBoolean(process.env.FEATURE_DB_SYNC),
			enableIpBlacklist: parseBoolean(
				process.env.FEATURE_ENABLE_IP_BLACKLIST
			),
			enableJwtAuth: parseBoolean(process.env.FEATURE_ENABLE_JWT_AUTH),
			enableLogStash: parseBoolean(process.env.FEATURE_ENABLE_LOGSTASH),
			enableRateLimit: parseBoolean(
				process.env.FEATURE_ENABLE_RATE_LIMIT
			),
			enableRedis: parseBoolean(process.env.FEATURE_ENABLE_REDIS),
			enableTLS: parseBoolean(process.env.FEATURE_ENABLE_SSL),
			encryptSecretsStore: parseBoolean(
				process.env.FEATURE_ENCRYPT_STORE
			),
			honorCipherOrder: parseBoolean(
				process.env.FEATURE_HONOR_CIPHER_ORDER
			),
			httpsRedirect: parseBoolean(process.env.FEATURE_HTTPS_REDIRECT),
			loadTestRoutes: parseBoolean(process.env.FEATURE_LOAD_TEST_ROUTES),
			sequelizeLogging: parseBoolean(
				process.env.FEATURE_SEQUELIZE_LOGGING
			)
		};
	} catch (utilError) {
		const utilityError = new errorClasses.UtilityErrorRecoverable(
			`Failed to get feature flags using the utility 'getFeatureFlags()\n${utilError instanceof Error ? utilError.message : utilError}`,
			{
				utility: 'getFeatureFlags()',
				originalError: utilError,
				statusCode: 500,
				severity: ErrorSeverity.RECOVERABLE,
				exposeToClient: false
			}
		);

		// Log the error
		errorLogger.logError(
			utilityError as AppError,
			errorLoggerDetails(
				() => 'getFeatureFlags()',
				blankRequest,
				'GET_FEATURE_FLAGS'
			),
			appLogger,
			ErrorSeverity.RECOVERABLE
		);

		processError({
			...ProcessErrorStaticParameters,
			error: utilityError,
			req: blankRequest,
			details: { reason: 'Failed to retrieve feature flags' }
		});

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
		const utilityError = new errorClasses.UtilityErrorRecoverable(
			`Failed to create feature enabler using the utility 'displayEnvAndFeatureFlags()'\n${utilError instanceof Error ? utilError.message : utilError}`,
			{
				utility: 'createFeatureEnabler()',
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
		processError({
			...ProcessErrorStaticParameters,
			error: utilityError,
			req: blankRequest,
			details: { reason: 'Failed to create feature enabler' }
		});
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
		const displayErrorObj = new errorClasses.UtilityErrorRecoverable(
			`Error displaying environment variables and feature flags using 'displayEnvAndFeatureFlags()'\n${displayError instanceof Error ? displayError.message : displayError}`,
			{
				utility: 'displayEnvAndFeatureFlags()',
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
		processError({
			...ProcessErrorStaticParameters,
			error: displayError,
			req: blankRequest,
			details: {
				reason: 'Unable to display env variables and feature flags'
			}
		});
	}
}
