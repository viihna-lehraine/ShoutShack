import { Sequelize } from 'sequelize';
import { logger } from '../utils/logger';
import { AppError } from '../errors/errorClasses';
import { createErrorLogModel } from '../models/ErrorLogModelFile';
import { processError } from '../utils/processError';

const errorCounts = new Map<string, number>();
let sequelize: Sequelize;

export class ErrorLogger {
	static logErrorDetails(error: AppError, logger: Logger | Console): void {
		const logDetails = {
			name: error.name,
			message: error.message,
			statusCode: error.statusCode,
			severity: error.severity,
			errorCode: error.errorCode,
			details: error.details
		};

		// log based on severity
		switch (error.severity) {
			case 'fatal':
				logger.error(`FATAL: ${error.message}`, logDetails);
				break;
			case 'recoverable':
				logger.warn(`RECOVERABLE: ${error.message}`, logDetails);
				break;
			case 'warning':
				logger.info(`WARNING: ${error.message}`, logDetails);
				break;
			case 'info':
				logger.debug(`INFO: ${error.message}`, logDetails);
				break;
			default:
				logger.error(`UNKNOWN SEVERITY: ${error.message}`, logDetails);
		}
	}

	// log to the database
	static async logToDatabase(error: AppError, sequelize: Sequelize, logger: Logger): Promise<void> {
		try {
			const ErrorLog = createErrorLogModel(sequelize, logger);
			await ErrorLog.create({
				name: error.name,
				message: error.message,
				statusCode: error.statusCode || null,
				severity: error.severity,
				errorCode: error.errorCode || null,
				details: JSON.stringify(error.details || {}),
				timestamp: new Date()
			});
			logger.info('Error logged to the database');
		} catch (dbError) {
			ErrorLogger.logErrorDetails(dbError as AppError, logger);
			logger.error('Failed to log error to the database');
		}
	}
}
