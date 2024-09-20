import { Op, Sequelize } from 'sequelize';
import { ConfigService } from '../config/configService';
import { envVariables } from '../environment/envVars';
import { AppError, ErrorSeverity } from '../errors/errorClasses';
import { createErrorLogModel } from '../models/ErrorLogModelFile';
import { validateDependencies } from '../utils/validateDependencies';
import { processError } from './processError';

const errorCounts = new Map<string, number>();

export class ErrorLogger {
	static logError(
		error: AppError,
		details: Record<string, unknown> = {}
	): void {
		const configService = ConfigService.getInstance();
		const appLogger = configService.getLogger();

		validateDependencies(
			[
				{ name: 'error', instance: error },
				{ name: 'details', instance: details }
			],
			appLogger || console
		);

		const logDetails = {
			name: error.name,
			message: error.message,
			statusCode: error.statusCode,
			severity: error.severity,
			errorCode: error.errorCode,
			details: error.details
		};

		const currentCount = errorCounts.get(error.name) || 0;
		errorCounts.set(error.name, currentCount + 1);

		const isProduction = envVariables.nodeEnv === 'production';

		// production - log warnings and errors only
		if (isProduction) {
			if (
				error.severity === ErrorSeverity.FATAL ||
				error.severity === ErrorSeverity.RECOVERABLE
			) {
				appLogger.error(`PROD ERROR: ${error.message}`, logDetails);
			} else if (error.severity === ErrorSeverity.WARNING) {
				appLogger.warn(`PROD WARNING: ${error.message}`, logDetails);
			}
		} else {
			// development - log everything including debug
			switch (error.severity) {
				case ErrorSeverity.FATAL:
					appLogger.error(`DEV FATAL: ${error.message}`, logDetails);
					break;
				case ErrorSeverity.RECOVERABLE:
					appLogger.warn(
						`DEV RECOVERABLE: ${error.message}`,
						logDetails
					);
					break;
				case ErrorSeverity.WARNING:
					appLogger.info(`DEV WARNING: ${error.message}`, logDetails);
					break;
				case ErrorSeverity.INFO:
					appLogger.debug(`DEV INFO: ${error.message}`, logDetails);
					break;
				default:
					appLogger.error(
						`DEV UNKNOWN SEVERITY: ${error.message}`,
						logDetails
					);
			}
		}
	}

	static logCritical(
		errorMessage: string,
		details: Record<string, unknown> = {}
	): void {
		const configService = ConfigService.getInstance();
		const appLogger = configService.getLogger();

		validateDependencies(
			[
				{ name: 'errorMessage', instance: errorMessage },
				{ name: 'details', instance: details }
			],
			appLogger || console
		);

		const logDetails = {
			severity: ErrorSeverity.FATAL,
			...details
		};

		appLogger.error(`CRITICAL: ${errorMessage}`, logDetails);
	}

	static logWarning(
		warningMessage: string,
		details: Record<string, unknown> = {}
	): void {
		const configService = ConfigService.getInstance();
		const appLogger = configService.getLogger();

		validateDependencies(
			[
				{ name: 'warningMessage', instance: warningMessage },
				{ name: 'details', instance: details }
			],
			appLogger || console
		);

		const logDetails = {
			severity: ErrorSeverity.WARNING,
			...details
		};

		const isProduction = envVariables.nodeEnv === 'production';

		if (isProduction) {
			appLogger.warn(`PROD WARNING: ${warningMessage}`, logDetails);
		} else {
			appLogger.warn(`DEV WARNING: ${warningMessage}`, logDetails);
		}
	}

	static logInfo(
		infoMessage: string,
		details: Record<string, unknown> = {}
	): void {
		const configService = ConfigService.getInstance();
		const appLogger = configService.getLogger();

		validateDependencies(
			[
				{ name: 'infoMessage', instance: infoMessage },
				{ name: 'details', instance: details }
			],
			appLogger || console
		);

		const logDetails = {
			severity: ErrorSeverity.INFO,
			...details
		};

		const isProduction = envVariables.nodeEnv === 'production';

		if (isProduction) {
			appLogger.info(`PROD INFO: ${infoMessage}`, logDetails);
		} else {
			appLogger.info(`DEV INFO: ${infoMessage}`, logDetails);
		}
	}

	static logDebug(
		debugMessage: string,
		details: Record<string, unknown> = {}
	): void {
		const configService = ConfigService.getInstance();
		const appLogger = configService.getLogger();

		validateDependencies(
			[
				{ name: 'debugMessage', instance: debugMessage },
				{ name: 'details', instance: details }
			],
			appLogger || console
		);

		const logDetails = {
			severity: ErrorSeverity.INFO,
			...details
		};

		appLogger.debug(`DEBUG: ${debugMessage}`, logDetails);
	}

	// log to the database
	static async logToDatabase(
		error: AppError,
		sequelize: Sequelize,
		retryCount: number = 3,
		retryDelay: number = 1000
	): Promise<void> {
		const configService = ConfigService.getInstance();
		const appLogger = configService.getLogger();
		const ErrorLog = createErrorLogModel(sequelize);

		try {
			await ErrorLog!.create({
				name: error.name,
				message: error.message,
				statusCode: error.statusCode || null,
				severity: error.severity,
				errorCode: error.errorCode || null,
				details: JSON.stringify(error.details || {}),
				timestamp: new Date(),
				count: errorCounts.get(error.name) || 1
			});
			appLogger.info('Error logged to the database');
		} catch (dbLogError) {
			if (retryCount > 0) {
				appLogger.warn(
					`Database logging faild, retrying... Attempts left: ${retryCount}`,
					dbLogError
				);
				setTimeout(() => {
					ErrorLogger.logToDatabase(
						error,
						sequelize,
						retryCount - 1,
						retryDelay * 2
					);
				}, retryDelay);
			} else {
				appLogger.error(
					'Database logging failed after multiple retries. Fallback to file logging'
				);
				ErrorLogger.logError(dbLogError as AppError);
				processError(dbLogError as AppError);
			}
		}
	}

	static getErrorCount(errorName: string): number {
		return errorCounts.get(errorName) || 0;
	}

	static async cleanupOldLogs(
		sequelize: Sequelize,
		retentionPeriodDays: number = 30
	): Promise<void> {
		const configService = ConfigService.getInstance();
		const appLogger = configService.getLogger();
		const retentionDate = new Date();
		retentionDate.setDate(retentionDate.getDate() - retentionPeriodDays);

		try {
			const ErrorLog = sequelize.model('ErrorLog');
			await ErrorLog.destroy({
				where: {
					timestamp: {
						[Op.lt]: retentionDate
					}
				}
			});
			appLogger.info(
				`Old logs older than ${retentionPeriodDays} days have been deleted.`
			);
		} catch (cleanupError) {
			appLogger.error('Failed to clean up old logs', cleanupError);
		}
	}
}
