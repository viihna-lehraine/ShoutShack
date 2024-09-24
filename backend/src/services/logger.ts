import { Op, Sequelize } from 'sequelize';
import { AppError, ErrorSeverity } from '../errors/errorClasses';
import { ErrorLoggerInterface } from '../index/interfaces';
import fs from 'fs';
import {
	addColors,
	createLogger,
	format,
	Logger as WinstonLogger,
	transports
} from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import LogStashTransport from 'winston-logstash';
import TransportStream from 'winston-transport';
import { configService } from './configService';
import { envSecretsStore } from '../environment/envSecrets';
import { ErrorClasses } from '../errors/errorClasses';
import { ProcessErrorStaticParameters } from 'src/index/parameters';
import { Request } from 'express';
import { sanitizeRequestBody } from '../utils/helpers';
import { v4 as uuidv4 } from 'uuid';
import { errorHandler } from '../services/errorHandler';
import { AppLoggerInterface } from '../index/interfaces';

import '../../types/custom/winston-logstash';

export type AppLoggerType = WinstonLogger;

export class AppLogger {
	public static instance: AppLogger;
	public logger: AppLoggerInterface;

	constructor(logLevel?: string, serviceName?: string) {
		const { colorize, combine, errors, json, printf, timestamp } = format;
		const resolvedLogLevel =
			logLevel || configService.getEnvVariables().logLevel || 'info';
		const resolvedServiceName =
			serviceName ||
			configService.getEnvVariables().loggerServiceName ||
			'Log Service';
		const isProduction =
			configService.getEnvVariables().nodeEnv === 'production';
		const defaultLogLevel = isProduction ? 'info' : 'debug';
		const logDirectory = './data/logs/server/main/';

		const logFormat = printf(({ level, message, timestamp, stack }) => {
			return `${timestamp} ${level}: ${stack || message}`;
		});

		const customLevels = {
			levels: {
				critical: 0,
				error: 1,
				warn: 2,
				info: 3,
				debug: 4,
				notice: 5
			},
			colors: {
				critical: 'red',
				error: 'orange',
				warn: 'yellow',
				info: 'green',
				debug: 'blue',
				notice: 'magenta'
			}
		};

		if (!fs.existsSync(logDirectory)) {
			fs.mkdirSync(logDirectory, { recursive: true });
		}

		const loggerTransports: TransportStream[] = [
			new transports.Console({
				format: combine(colorize(), logFormat),
				level: isProduction ? 'info' : resolvedLogLevel
			}),
			new DailyRotateFile({
				filename: 'server-%DATE%.log',
				dirname: logDirectory,
				datePattern: 'YYYY-MM-DD',
				zippedArchive: true,
				maxSize: '20m',
				maxFiles: '30d',
				format: combine(
					timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
					logFormat
				),
				level: resolvedLogLevel
			})
		];

		this.addLogstashTransport(loggerTransports);

		const winstonLogger: WinstonLogger = createLogger({
			levels: customLevels.levels,
			level: defaultLogLevel,
			format: combine(
				errors({ stack: true }),
				timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
				json()
			),
			defaultMeta: { service: resolvedServiceName },
			transports: loggerTransports
		});

		this.logger = Object.assign(winstonLogger, {
			getRedactedLogger: this.createRedactedLogger.bind(this),
			logDebug: this.logDebug.bind(this),
			logInfo: this.logInfo.bind(this),
			logNotice: this.logNotice.bind(this),
			logWarn: this.logWarn.bind(this),
			logError: this.logError.bind(this),
			logCritical: this.logCritical.bind(this),
			cleanUpOldLogs: this.cleanUpOldLogs.bind(this),
			getErrorDetails: this.getErrorDetails.bind(this),
			createRedactedLogger: this.createRedactedLogger.bind(this),
			isAppLogger: AppLogger.isAppLogger.bind(this)
		});

		addColors(customLevels.colors);
	}

	public static getInstance(
		logLevel?: string,
		serviceName?: string
	): AppLoggerInterface {
		if (!AppLogger.instance) {
			AppLogger.instance = new AppLogger(logLevel, serviceName);
		}
		return AppLogger.instance.logger;
	}

	private createRedactedLogger(): AppLoggerInterface {
		const redactedLogger: AppLoggerType = Object.create(this.logger);

		const levels: (
			| 'debug'
			| 'info'
			| 'notice'
			| 'warn'
			| 'error'
			| 'crit'
		)[] = ['debug', 'info', 'notice', 'warn', 'error', 'crit'];

		levels.forEach(level => {
			const originalMethod = this.logger[level].bind(this.logger);

			redactedLogger[level] = ((
				message: string,
				meta?: Record<string, unknown> | string
			): void => {
				const redactedMeta =
					typeof meta === 'object'
						? envSecretsStore.redactSecrets(meta)
						: meta;
				originalMethod(message, redactedMeta);
			}) as typeof originalMethod;
		});

		return Object.assign(redactedLogger, {
			getRedactedLogger: this.getRedactedLogger.bind(this),
			logDebug: this.logDebug.bind(this),
			logInfo: this.logInfo.bind(this),
			logNotice: this.logNotice.bind(this),
			logWarn: this.logWarn.bind(this),
			logError: this.logError.bind(this),
			logCritical: this.logCritical.bind(this),
			cleanUpOldLogs: this.cleanUpOldLogs.bind(this),
			getErrorDetails: this.getErrorDetails.bind(this),
			isAppLogger: AppLogger.isAppLogger.bind(this)
		}) as AppLoggerInterface;
	}

	public getLogger(): AppLoggerInterface {
		return this.logger;
	}

	public getRedactedLogger(): AppLoggerInterface {
		return this.createRedactedLogger();
	}

	private addLogstashTransport(transportsArray: TransportStream[]): void {
		if (configService.getFeatureFlags().enableLogStash) {
			const logStashTransport = this.createLogstashTransport();
			if (logStashTransport) {
				transportsArray.push(logStashTransport);
			}
		}
	}

	private createLogstashTransport(): TransportStream | null {
		try {
			return new LogStashTransport({
				port: configService.getEnvVariables().logStashPort,
				node_name: configService.getEnvVariables().logStashNode,
				host: configService.getEnvVariables().logStashHost
			}) as unknown as TransportStream;
		} catch (error) {
			const logstashError = new ErrorClasses.ServiceUnavailableError(
				60,
				'Application Logger Service',
				{
					message:
						'Logger Service Error: Failed to create Logstash transport'
				}
			);
			this.logError(
				`Logstash error: ${error instanceof Error ? error.message : error}`
			);
			errorHandler.handleError({
				...ProcessErrorStaticParameters,
				error: logstashError,
				details: { reason: 'Failed to create Logstash transport' }
			});
			return null;
		}
	}

	public logDebug(message: string, details?: Record<string, unknown>): void {
		this.logger.error(message, details);
	}

	public logInfo(message: string, details?: Record<string, unknown>): void {
		this.logger.error(message, details);
	}

	public logNotice(message: string, details?: Record<string, unknown>): void {
		this.logger.error(message, details);
	}

	public logWarn(message: string, details?: Record<string, unknown>): void {
		this.logger.error(message, details);
	}

	public logError(message: string, details?: Record<string, unknown>): void {
		this.logger.error(message, details);
	}

	public logCritical(
		message: string,
		details?: Record<string, unknown>
	): void {
		this.logger.error(message, details);
	}

	public async cleanUpOldLogs(
		sequelize: import('sequelize').Sequelize,
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
			this.logger.info(
				`Old logs older than ${retentionPeriodDays} days have been deleted.`
			);
		} catch (cleanupError) {
			this.logger.error('Failed to clean up old logs', cleanupError);
		}
	}

	public getErrorDetails(
		getCallerInfo: () => string,
		action: string = 'unknown',
		req?: Request,
		userId?: string | null,
		additionalData?: Record<string, unknown>
	): Record<string, unknown> {
		const details: Record<string, unknown> = {
			requestId: req?.headers['x-request-id'] || uuidv4(),
			adminId: configService.getAdminId() || null,
			userId: userId || null,
			action: action || 'unknown',
			caller: String(getCallerInfo()),
			timestamp: Date.now(),
			requestInfo: {
				method: req?.method || null,
				url: req?.originalUrl || req?.url || null,
				ip:
					req?.ip ||
					req?.headers['x-forwarded-for'] ||
					req?.socket.remoteAddress ||
					null,
				userAgent: req?.headers['user-agent'] || null,
				referrer:
					req?.headers['referer'] || req?.headers['referrer'] || null,
				query: req?.query || null,
				params: req?.params || null,
				body: req?.body ? sanitizeRequestBody(req?.body) : null
			},
			...additionalData
		};

		return details;
	}

	public static isAppLogger(
		logger: AppLoggerType | Console | undefined
	): logger is AppLoggerType {
		return (
			logger !== undefined &&
			logger !== null &&
			typeof logger.error === 'function' &&
			typeof logger.warn === 'function' &&
			typeof logger.debug === 'function' &&
			typeof logger.info === 'function' &&
			typeof logger.log === 'function'
		);
	}
}

export class ErrorLogger extends AppLogger implements ErrorLoggerInterface {
	public static override instance: ErrorLogger;
	private errorCounts: Map<string, number>;

	constructor(logLevel?: string, serviceName?: string) {
		super(logLevel, serviceName);
		this.errorCounts = new Map<string, number>();
	}

	public static override getInstance(
		logLevel?: string,
		serviceName?: string
	): AppLoggerInterface {
		if (!ErrorLogger.instance) {
			ErrorLogger.instance = new ErrorLogger(logLevel, serviceName);
		}
		return Object.assign(ErrorLogger.instance.logger, {
			logAppError: ErrorLogger.instance.logAppError.bind(
				ErrorLogger.instance
			),
			getErrorCount: ErrorLogger.instance.getErrorCount.bind(
				ErrorLogger.instance
			)
		});
	}

	public logAppError(
		error: AppError,
		sequelize?: Sequelize,
		details: Record<string, unknown> = {}
	): void {
		if (sequelize) {
			this.logToDatabase(error, sequelize).catch(databaseError => {
				this.logger.warn(
					`Could not log error to database: ${databaseError.message || databaseError}`
				);
			});
		} else {
			this.logWarn(
				'Sequelize instance not provided for logging error to database'
			);
		}

		const errorCount = this.errorCounts.get(error.name) || 0;
		this.errorCounts.set(error.name, errorCount + 1);

		if (error.severity === ErrorSeverity.FATAL) {
			this.logError(`FATAL: ${error.message}`, {
				...details,
				severity: error.severity
			});
		} else if (error.severity === ErrorSeverity.RECOVERABLE) {
			this.logWarn(`RECOVERABLE: ${error.message}`, { ...details });
		}
	}

	public async logToDatabase(
		error: AppError,
		sequelize: Sequelize,
		retryCount: number = 3
	): Promise<void> {
		try {
			const ErrorLog = sequelize.model('ErrorLog');
			await ErrorLog.create({
				name: error.name,
				message: error.message,
				statusCode: error.statusCode,
				severity: error.severity,
				timestamp: new Date(),
				count: this.errorCounts.get(error.name) || 1
			});
			this.logger.info('Error logged to database');
		} catch (databaseError) {
			this.logger.error(
				`Failed to log error to the database: ${databaseError}`
			);
			if (retryCount > 0) {
				setTimeout(
					() => {
						this.logToDatabase(error, sequelize, retryCount - 1);
					},
					1000 * (4 - retryCount)
				);
			}
		}
	}

	public getErrorCount(errorName: string): number {
		return this.errorCounts.get(errorName) || 0;
	}
}
