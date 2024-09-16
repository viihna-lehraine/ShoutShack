import { Op, Sequelize } from 'sequelize';
import { Logger } from '../utils/logger';
import { envVariables } from '../environment/envVars';
import { AppError, ErrorSeverity } from '../errors/errorClasses';
import { createErrorLogModel } from '../models/ErrorLogModelFile';
import { validateDependencies } from '../utils/validateDependencies';

const errorCounts = new Map<string, number>();

export class ErrorLogger {
	static logError(
		error: AppError,
		logger: Logger | Console,
		details: Record<string, unknown> = {}
	): void {
		validateDependencies(
			[
				{ name: 'error', instance: error },
				{ name: 'logger', instance: logger },
				{ name: 'details', instance: details }
			],
			logger || console
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
				logger.error(`PROD ERROR: ${error.message}`, logDetails);
			} else if (error.severity === ErrorSeverity.WARNING) {
				logger.warn(`PROD WARNING: ${error.message}`, logDetails);
			}
		} else {
			// development - log everything including debug
			switch (error.severity) {
				case ErrorSeverity.FATAL:
					logger.error(`DEV FATAL: ${error.message}`, logDetails);
					break;
				case ErrorSeverity.RECOVERABLE:
					logger.warn(
						`DEV RECOVERABLE: ${error.message}`,
						logDetails
					);
					break;
				case ErrorSeverity.WARNING:
					logger.info(`DEV WARNING: ${error.message}`, logDetails);
					break;
				case ErrorSeverity.INFO:
					logger.debug(`DEV INFO: ${error.message}`, logDetails);
					break;
				default:
					logger.error(
						`DEV UNKNOWN SEVERITY: ${error.message}`,
						logDetails
					);
			}
		}
	}

	static logCritical(
		errorMessage: string,
		logger: Logger | Console,
		details: Record<string, unknown> = {}
	): void {
		validateDependencies(
			[
				{ name: 'errorMessage', instance: errorMessage },
				{ name: 'logger', instance: logger },
				{ name: 'details', instance: details }
			],
			logger || console
		);

		const logDetails = {
			severity: ErrorSeverity.FATAL,
			...details
		};

		logger.error(`CRITICAL: ${errorMessage}`, logDetails);
	}

	static logWarning(
		warningMessage: string,
		logger: Logger | Console,
		details: Record<string, unknown> = {}
	): void {
		validateDependencies(
			[
				{ name: 'warningMessage', instance: warningMessage },
				{ name: 'logger', instance: logger },
				{ name: 'details', instance: details }
			],
			logger || console
		);

		const logDetails = {
			severity: ErrorSeverity.WARNING,
			...details
		};

		const isProduction = envVariables.nodeEnv === 'production';

		if (isProduction) {
			logger.warn(`PROD WARNING: ${warningMessage}`, logDetails);
		} else {
			logger.warn(`DEV WARNING: ${warningMessage}`, logDetails);
		}
	}

	static logInfo(
		infoMessage: string,
		logger: Logger | Console,
		details: Record<string, unknown> = {}
	): void {
		validateDependencies(
			[
				{ name: 'infoMessage', instance: infoMessage },
				{ name: 'logger', instance: logger },
				{ name: 'details', instance: details }
			],
			logger || console
		);

		const logDetails = {
			severity: ErrorSeverity.INFO,
			...details
		};

		const isProduction = envVariables.nodeEnv === 'production';

		if (isProduction) {
			logger.info(`PROD INFO: ${infoMessage}`, logDetails);
		} else {
			logger.info(`DEV INFO: ${infoMessage}`, logDetails);
		}
	}

	static logDebug(
		debugMessage: string,
		logger: Logger | Console,
		details: Record<string, unknown> = {}
	): void {
		validateDependencies(
			[
				{ name: 'debugMessage', instance: debugMessage },
				{ name: 'logger', instance: logger },
				{ name: 'details', instance: details }
			],
			logger || console
		);

		const logDetails = {
			severity: ErrorSeverity.INFO,
			...details
		};

		logger.debug(`DEBUG: ${debugMessage}`, logDetails);
	}

	// log to the database
	static async logToDatabase(
		error: AppError,
		sequelize: Sequelize,
		logger: Logger,
		retryCount: number = 3,
		retryDelay: number = 1000
	): Promise<void> {
		try {
			const ErrorLog = createErrorLogModel(sequelize, logger);

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
			logger.info('Error logged to the database');
		} catch (dbError) {
			if (retryCount > 0) {
				logger.warn(
					`Database logging faild, retrying... Attempts left: ${retryCount}`,
					dbError
				);
				setTimeout(() => {
					ErrorLogger.logToDatabase(
						error,
						sequelize,
						logger,
						retryCount - 1,
						retryDelay * 2
					);
				}, retryDelay);
			} else {
				logger.error(
					'Database logging failed after multiple retries. Fallback to file logging'
				);
				ErrorLogger.logError(dbError as AppError, logger);
			}
		}
	}

	static getErrorCount(errorName: string): number {
		return errorCounts.get(errorName) || 0;
	}

	static async cleanupOldLogs(
		sequelize: Sequelize,
		logger: Logger,
		retentionPeriodDays: number = 30
	): Promise<void> {
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
			logger.info(
				`Old logs older than ${retentionPeriodDays} days have been deleted.`
			);
		} catch (cleanupError) {
			logger.error('Failed to clean up old logs', cleanupError);
		}
	}
}
