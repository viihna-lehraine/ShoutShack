import { ErrorLoggerInterface } from '../interfaces/serviceInterfaces';
import { ValidateDependencies } from '../interfaces/utilityInterfaces';
import { ConfigServiceInterface } from '../interfaces/environmentInterfaces';
import { ConfigService } from './configService';
import { validateDependencies } from '../utils/helpers';
import { ErrorSeverity } from '../errors/errorClasses';
import { errorLoggerDetails } from '../utils/helpers';
import { getCallerInfo } from '../utils/helpers';

const errorCounts = new Map<string, number>();

export class ErrorLogger implements ErrorLoggerInterface {
	private configService: ConfigServiceInterface;
	private validationService: ValidateDependencies;

	constructor(
		configService: ConfigServiceInterface,
		validationService: ValidateDependencies
	) {
		this.configService = configService;
		this.validationService = validationService;
	}

	public logDebug(
		debugMessage: string,
		details: Record<string, unknown> = {},
		appLogger: import('../services/appLogger').AppLogger,
		severity: string
	): void {
		this.validationService.validateDependencies(
			[
				{ name: 'debugMessage', instance: debugMessage },
				{ name: 'details', instance: details }
			],
			appLogger
		);

		const logDetails = { severity, ...details };

		appLogger.debug(`DEBUG: ${debugMessage}`, logDetails);
	}

	public logInfo(
		infoMessage: string,
		details: Record<string, unknown> = {},
		appLogger: import('../services/appLogger').AppLogger,
		severity: string
	): void {
		this.validationService.validateDependencies(
			[
				{ name: 'infoMessage', instance: infoMessage },
				{ name: 'details', instance: details }
			],
			appLogger
		);

		const logDetails = { severity, ...details };

		const isProduction =
			this.configService.getEnvVariables().nodeEnv === 'production';

		if (isProduction) {
			appLogger.info(`PROD INFO: ${infoMessage}`, logDetails);
		} else {
			appLogger.info(`DEV INFO: ${infoMessage}`, logDetails);
		}
	}

	public logWarning(
		warningMessage: string,
		details: Record<string, unknown> = {},
		appLogger: import('../services/appLogger').AppLogger,
		severity: string
	): void {
		this.validationService.validateDependencies(
			[
				{ name: 'warningMessage', instance: warningMessage },
				{ name: 'details', instance: details }
			],
			appLogger
		);

		const logDetails = { severity, ...details };

		const isProduction =
			this.configService.getEnvVariables().nodeEnv === 'production';

		if (isProduction) {
			appLogger.warn(`PROD WARNING: ${warningMessage}`, logDetails);
		} else {
			appLogger.warn(`DEV WARNING: ${warningMessage}`, logDetails);
		}
	}

	public logError(
		error: import('../errors/errorClasses').AppError,
		details: Record<string, unknown> = {},
		appLogger: import('../services/appLogger').AppLogger,
		severity: string
	): void {
		this.validationService.validateDependencies(
			[
				{ name: 'error', instance: error },
				{ name: 'details', instance: details }
			],
			appLogger
		);

		const logDetails = {
			name: error.name,
			message: error.message,
			statusCode: error.statusCode,
			severity,
			errorCode: error.errorCode,
			details: error.details
		};

		const currentCount = errorCounts.get(error.name) || 0;
		errorCounts.set(error.name, currentCount + 1);

		const { nodeEnv } = this.configService.getEnvVariables();
		const isProduction = nodeEnv === 'production';

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

	public logCritical(
		errorMessage: string,
		details: Record<string, unknown> = {},
		appLogger: import('../services/appLogger').AppLogger,
		severity: string
	): void {
		this.validationService.validateDependencies(
			[
				{ name: 'errorMessage', instance: errorMessage },
				{ name: 'details', instance: details }
			],
			appLogger
		);

		const logDetails = { severity, ...details };

		appLogger.error(`CRITICAL: ${errorMessage}`, logDetails);
	}

	public async logToDatabase(
		error: import('../errors/errorClasses').AppError,
		sequelize: import('sequelize').Sequelize,
		appLogger: import('../services/appLogger').AppLogger,
		retryCount: number = 3,
		retryDelay: number = 1000,
		severity?: string
	): Promise<void> {
		const ErrorLog = sequelize.model('ErrorLog');
		const errorSeverity: string = severity || error.severity;

		try {
			await ErrorLog.create({
				name: error.name,
				message: error.message,
				statusCode: error.statusCode || null,
				errorSeverity,
				errorCode: error.errorCode || null,
				details: JSON.stringify(error.details || {}),
				timestamp: new Date(),
				count: errorCounts.get(error.name) || 1
			});
			appLogger.info('Error logged to the database');
		} catch (dbLogError) {
			const severity = ErrorSeverity.FATAL;

			if (retryCount > 0) {
				appLogger.warn(
					`Database logging failed, retrying... Attempts left: ${retryCount}`,
					dbLogError
				);

				setTimeout(() => {
					this.logToDatabase(
						error,
						sequelize,
						appLogger,
						retryCount - 1,
						retryDelay * 2,
						severity
					);
				}, retryDelay);
			} else {
				appLogger.error(
					'Database logging failed after multiple retries.'
				);
				const details: Record<string, unknown> =
					errorLoggerDetails(getCallerInfo);
				const severity = ErrorSeverity.FATAL;
				this.logError(
					dbLogError as import('../errors/errorClasses').AppError,
					details,
					appLogger,
					severity
				);
			}
		}
	}

	public getErrorCount(errorName: string): number {
		return errorCounts.get(errorName) || 0;
	}

	public async cleanUpOldLogs(
		appLogger: import('../services/appLogger').AppLogger,
		sequelize: import('sequelize').Sequelize,
		Op: typeof import('sequelize').Op,
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
			appLogger.info(
				`Old logs older than ${retentionPeriodDays} days have been deleted.`
			);
		} catch (cleanupError) {
			appLogger.error('Failed to clean up old logs', cleanupError);
		}
	}
}

const errorLogger = new ErrorLogger(ConfigService.getInstance(), {
	validateDependencies
});

export { errorLogger };
