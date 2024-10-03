import TransportStream from 'winston-transport';
import {
	AppLoggerServiceInterface,
	ErrorHandlerServiceInterface,
	ErrorLoggerServiceInterface,
	VaultServiceInterface
} from '../index/interfaces/services';
import { AppLoggerServiceDeps } from '../index/interfaces/serviceDeps';
import { Op } from 'sequelize';
import { Logger as WinstonLogger } from 'winston';
import { Request } from 'express';

export class AppLoggerService
	extends WinstonLogger
	implements AppLoggerServiceInterface
{
	public static instance: AppLoggerService | null = null;
	protected _deps: AppLoggerServiceDeps;
	private adminId: number | null = null;
	private redactedLogger: AppLoggerServiceInterface | null = null;
	protected errorHandler: ErrorHandlerServiceInterface | null = null;
	private secrets: VaultServiceInterface | null = null;

	constructor(
		deps: AppLoggerServiceDeps,
		logLevel?: string,
		serviceName?: string
	) {
		const { format, transports, addColors } = deps.winston;
		const { colorize, combine, errors, json, printf, timestamp } = format;

		const resolvedLogLevel = logLevel || process.env.LOG_LEVEL || 'info';
		const resolvedServiceName =
			serviceName || process.env.LOGGER_SERVICE_NAME || 'Log Service';
		const isProduction = process.env.NODE_ENV === 'production';
		const logDirectory = './data/logs/server/main/';
		const logFormat = printf(({ level, message, timestamp, stack }) => {
			return `${timestamp} ${level}: ${stack || message}`;
		});

		if (!deps.fs.existsSync(logDirectory)) {
			deps.fs.mkdirSync(logDirectory, { recursive: true });
		}

		const loggerTransports: TransportStream[] = [
			new transports.Console({
				format: combine(colorize(), logFormat),
				level: isProduction ? 'info' : resolvedLogLevel
			}),
			new deps.DailyRotateFile({
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

		super({
			levels: AppLoggerService.getCustomLogLevels().levels,
			level: resolvedLogLevel,
			format: combine(errors({ stack: true }), json()),
			defaultMeta: { service: resolvedServiceName },
			transports: loggerTransports
		});

		this.addLogstashTransport(loggerTransports);

		this._deps = deps;
		addColors(AppLoggerService.getCustomLogLevels().colors);
	}

	public static getCustomLogLevels(): {
		levels: Record<string, number>;
		colors: Record<string, string>;
	} {
		return {
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
	}

	public static getInstance(
		deps: AppLoggerServiceDeps,
		logLevel?: string,
		serviceName?: string
	): AppLoggerServiceInterface {
		if (!AppLoggerService.instance) {
			AppLoggerService.instance = new AppLoggerService(
				deps,
				logLevel,
				serviceName
			);
		}
		return AppLoggerService.instance;
	}

	public setErrorHandler(errorHandler: ErrorHandlerServiceInterface): void {
		this.errorHandler = errorHandler;
	}

	public setUpSecrets(secrets: VaultServiceInterface): void {
		this.secrets = secrets;
		this.setupRedactedLogger();
		console.info('Vault Service injected and redacted logger setup.');
	}

	private setupRedactedLogger(): void {
		if (this.redactedLogger || !this.secrets)
			this.redactedLogger = this.createRedactedLogger();
		this.logInfo('Redacted logger initialized.');
	}

	private createRedactedLogger(): AppLoggerServiceInterface {
		const redactedLogger: AppLoggerServiceInterface = Object.create(this);

		const levels: (
			| 'debug'
			| 'info'
			| 'notice'
			| 'warn'
			| 'error'
			| 'crit'
		)[] = ['debug', 'info', 'notice', 'warn', 'error', 'crit'];

		levels.forEach(level => {
			const originalMethod = this[level].bind(this);

			redactedLogger[level] = ((
				message: string,
				meta?: Record<string, unknown> | string
			): void => {
				const redactedMeta =
					typeof meta === 'object'
						? this.secrets?.redactSecrets(meta)
						: meta;
				originalMethod(message, redactedMeta);
			}) as typeof originalMethod;
		});

		return Object.assign(redactedLogger, {
			getRedactedLogger: this.getRedactedLogger.bind(this)
		}) as AppLoggerServiceInterface;
	}

	public getLogger(): AppLoggerServiceInterface {
		return this.redactedLogger ? this.redactedLogger : this;
	}

	public getRedactedLogger(): AppLoggerServiceInterface {
		return this.createRedactedLogger();
	}

	private addLogstashTransport(transportsArray: TransportStream[]): void {
		const logStashTransport = this.createLogstashTransport();
		if (logStashTransport) {
			transportsArray.push(logStashTransport);
		}
	}

	private createLogstashTransport(): TransportStream | null {
		try {
			return new this._deps.LogStashTransport({
				port: parseInt(process.env.LOGSTASH_PORT!, 10),
				node_name: process.env.LOGSTASH_NODE!,
				host: process.env.LOGSTASH_HOST!
			}) as unknown as TransportStream;
		} catch (error) {
			const logstashError =
				new this._deps.ErrorClasses.ServiceUnavailableError(
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
			if (this.errorHandler) {
				this.errorHandler.handleError({
					...this._deps.HandleErrorStaticParameters,
					error: logstashError,
					details: { reason: 'Failed to create Logstash transport' }
				});
			} else {
				this.handleError(
					'Failed to create Logstash transport',
					logstashError
				);
			}
			return null;
		}
	}

	public logDebug(message: string, details?: Record<string, unknown>): void {
		this.debug(message, details);
	}

	public logInfo(message: string, details?: Record<string, unknown>): void {
		this.info(message, details);
	}

	public logNotice(message: string, details?: Record<string, unknown>): void {
		this.notice(message, details);
	}

	public logWarn(message: string, details?: Record<string, unknown>): void {
		this.warn(message, details);
	}

	public logError(message: string, details?: Record<string, unknown>): void {
		this.error(message, details);
	}

	public logCritical(
		message: string,
		details?: Record<string, unknown>
	): void {
		this.crit(message, details);
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
			this.info(
				`Old logs older than ${retentionPeriodDays} days have been deleted.`
			);
		} catch (cleanupError) {
			this.error('Failed to clean up old logs', cleanupError);
		}
	}

	public setAdminId(adminId: number): void {
		this.adminId = adminId;
	}

	public getErrorDetails(
		getCallerInfo: () => string,
		action: string = 'unknown',
		req?: Request,
		userId?: string | null,
		additionalData?: Record<string, unknown>
	): Record<string, unknown> {
		const details: Record<string, unknown> = {
			requestId: req?.headers['x-request-id'] || this._deps.uuidv4(),
			adminId: this.adminId || 'Unknown Admin',
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
				body: req?.body ? this.sanitizeRequestBody(req?.body) : null
			},
			...additionalData
		};

		return details;
	}

	protected get __deps(): AppLoggerServiceDeps {
		return this._deps;
	}

	private sanitizeRequestBody(
		body: Record<string, unknown>
	): Record<string, unknown> {
		const sanitizedBody = new Map(Object.entries(body));
		const sensitiveFields = [
			'email',
			'key',
			'newPassword',
			'oldPassword',
			'passphrase',
			'password',
			'secret',
			'token',
			'username'
		];

		sensitiveFields.forEach(field => {
			if (sanitizedBody.has(field)) {
				sanitizedBody.set(field, '[REDACTED]');
			}
		});

		return Object.fromEntries(sanitizedBody);
	}

	public async shutdown(): Promise<void> {
		this.info('Shutting down logger services...');

		await new Promise<void>((resolve, reject) => {
			this.on('finish', () => {
				this.info('All logs have been flushed.');
				resolve();
			});

			this.on('error', error => {
				this.error(
					`Error while shutting down logger: ${error.message}`
				);
				reject(error);
			});

			this.end();
		});
	}

	protected handleError(message: string, error: Error): void {
		if (this.errorHandler) {
			this.errorHandler.handleError({
				error,
				details: { message }
			});
		} else {
			this.logError(`Error Handler not set. Error: ${message}`);
		}
	}
}

export class ErrorLoggerService
	extends AppLoggerService
	implements ErrorLoggerServiceInterface
{
	public static override instance: ErrorLoggerService;
	private errorCounts: Map<string, number>;

	constructor(
		deps: AppLoggerServiceDeps,
		logLevel?: string,
		serviceName?: string
	) {
		super(deps, logLevel, serviceName);
		this.errorCounts = new Map<string, number>();
	}

	public static override getInstance(
		deps: AppLoggerServiceDeps,
		logLevel?: string,
		serviceName?: string
	): AppLoggerServiceInterface {
		if (!ErrorLoggerService.instance) {
			ErrorLoggerService.instance = new ErrorLoggerService(
				deps,
				logLevel,
				serviceName
			);
		}
		return Object.assign(ErrorLoggerService.instance, {
			logAppError: ErrorLoggerService.instance.logAppError.bind(
				ErrorLoggerService.instance
			),
			getErrorCount: ErrorLoggerService.instance.getErrorCount.bind(
				ErrorLoggerService.instance
			),
			getRedactedLogger:
				ErrorLoggerService.instance.getRedactedLogger.bind(
					ErrorLoggerService.instance
				),
			logDebug: ErrorLoggerService.instance.logDebug.bind(
				ErrorLoggerService.instance
			),
			logInfo: ErrorLoggerService.instance.logInfo.bind(
				ErrorLoggerService.instance
			),
			logNotice: ErrorLoggerService.instance.logNotice.bind(
				ErrorLoggerService.instance
			),
			logWarn: ErrorLoggerService.instance.logWarn.bind(
				ErrorLoggerService.instance
			),
			logError: ErrorLoggerService.instance.logError.bind(
				ErrorLoggerService.instance
			),
			logCritical: ErrorLoggerService.instance.logCritical.bind(
				ErrorLoggerService.instance
			),
			cleanUpOldLogs: ErrorLoggerService.instance.cleanUpOldLogs.bind(
				ErrorLoggerService.instance
			),
			getErrorDetails: ErrorLoggerService.instance.getErrorDetails.bind(
				ErrorLoggerService.instance
			)
		}) as AppLoggerServiceInterface;
	}

	public logAppError(
		error: import('../errors/ErrorClasses').AppError,
		sequelize?: import('sequelize').Sequelize,
		details: Record<string, unknown> = {}
	): void {
		if (sequelize) {
			this.logToDatabase(error, sequelize).catch(databaseError => {
				this.warn(
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

		if (this.errorHandler) {
			if (error.severity === this.errorHandler.ErrorSeverity.FATAL) {
				this.logError(`FATAL: ${error.message}`, {
					...details,
					severity: error.severity
				});
			} else if (
				error.severity === this.errorHandler.ErrorSeverity.RECOVERABLE
			) {
				this.logWarn(`RECOVERABLE: ${error.message}`, { ...details });
			}
		} else {
			this.handleError('Error Handler not set', error);
		}
	}

	public async logToDatabase(
		error: import('../errors/ErrorClasses').AppError,
		sequelize: import('sequelize').Sequelize,
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
			this.info('Error logged to database');
		} catch (databaseError) {
			this.error(`Failed to log error to the database: ${databaseError}`);
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
