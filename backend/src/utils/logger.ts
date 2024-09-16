import fs from 'fs';
import {
	createLogger,
	format,
	Logger as WinstonLogger,
	transports
} from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import LogStashTransport from 'winston-logstash';
import TransportStream from 'winston-transport';
import {
	envVariables,
	FeatureFlags,
	getFeatureFlags
} from '../environment/envVars';
import { errorClasses } from '../errors/errorClasses';
import { ErrorLogger } from '../errors/errorLogger';
import { processError } from '../errors/processError';
import { validateDependencies } from './validateDependencies';

import '../../types/custom/winston-logstash';

const { ServiceUnavailableError } = errorClasses;

const { colorize, combine, errors, json, printf, timestamp } = format;

const logFormat = printf(({ level, message, timestamp, stack }) => {
	return `${timestamp} ${level}: ${stack || message}`;
});

const customLevels = {
	levels: {
		critical: 0,
		error: 1,
		warn: 2,
		info: 3,
		debug: 4
	},
	colors: {
		critical: 'red',
		error: 'orange',
		warn: 'yellow',
		info: 'green',
		debug: 'blue'
	}
};

export interface LoggerDependencies {
	logLevel?: string | undefined;
	logDirectory?: string | undefined;
	serviceName?: string | undefined;
	isProduction?: boolean | undefined;
	console?: typeof console;
}

const service: string = 'Logger Service';

let loggerInstance: WinstonLogger | null = null;

function createLogStashTransport(): TransportStream | null {
	try {
		return new LogStashTransport({
			port: envVariables.logStashPort,
			node_name: envVariables.logStashNode,
			host: envVariables.logStashHost
		}) as unknown as TransportStream;
	} catch (error) {
		const appError = new ServiceUnavailableError(60, service, {
			exposeToClient: false,
			message: `${service} Error: Failed to create Logstash transport`
		});
		ErrorLogger.logError(appError, logger);
		processError(error, logger);
		return null;
	}
}

function addLogStashTransportIfEnabled(
	transportsArray: TransportStream[],
	logger: Logger
): void {
	validateDependencies(
		[
			{ name: 'transportsArray', instance: transportsArray },
			{ name: 'logger', instance: logger }
		],
		logger
	);

	const featureFlags: FeatureFlags = getFeatureFlags(logger);

	if (featureFlags.enableLogStashFlag) {
		console.log('Logstash flag enabled. Adding Logstash transport...');
		const logStashTransport = createLogStashTransport();
		if (logStashTransport) {
			transportsArray.push(logStashTransport);
		}
	}
}

export function setupLogger({
	logLevel = envVariables.logLevel || 'info',
	logDirectory = envVariables.serverLogPath,
	serviceName = envVariables.serviceName,
	isProduction = envVariables.nodeEnv === 'production'
}: LoggerDependencies = {}): WinstonLogger {
	try {
		validateDependencies(
			[
				{ name: 'logLevel', instance: logLevel },
				{ name: 'logDirectory', instance: logDirectory },
				{ name: 'serviceName', instance: serviceName },
				{ name: 'isProduction', instance: isProduction }
			],
			console
		);

		if (loggerInstance) {
			console.log(
				'Logger instance already exists. Returning the existing instance.'
			);
			return loggerInstance;
		}

		if (!logDirectory || typeof logDirectory !== 'string') {
			logDirectory = './data/logs/server/main/';
			console.warn(
				'Invalid or missing log directory path. Using default path, ./data/logs/server/main/.'
			);
		}

		if (!fs.existsSync(logDirectory)) {
			console.error(
				`Log directory does not exist at ${logDirectory}. Attempting to create it...`
			);
			try {
				fs.mkdirSync(logDirectory, { recursive: true });
				console.log(
					`Log directory ${logDirectory} created successfully.`
				);
			} catch (error) {
				const appError = new ServiceUnavailableError(60, service, {
					message: `${service} Error: Failed to create the log directory ${error instanceof Error ? error.stack : error}`,
					exposeToClient: false
				});
				ErrorLogger.logError(appError, logger);
				processError(error, logger);
				throw appError;
			}
		}

		const envLogLevel = isProduction
			? 'info'
			: envVariables.nodeEnv === 'testing'
				? 'warn'
				: logLevel;

		const loggerTransports: TransportStream[] = [
			new transports.Console({
				format: combine(colorize(), logFormat),
				level: envLogLevel
			}),
			new DailyRotateFile({
				filename: 'server-%DATE%.log',
				dirname: logDirectory,
				datePattern: 'YYYY-MM-DD',
				zippedArchive: true,
				maxSize: '20m',
				maxFiles: '14d',
				format: combine(
					timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
					logFormat
				),
				level: envLogLevel
			})
		];

		addLogStashTransportIfEnabled(loggerTransports, logger);

		loggerInstance = createLogger({
			levels: customLevels.levels,
			level: envLogLevel,
			format: combine(
				errors({ stack: true }),
				timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
				json()
			),
			defaultMeta: { service: serviceName },
			transports: loggerTransports
		});

		console.log = (...args): void => {
			if (loggerInstance) {
				loggerInstance.info(args.join(' '));
			}
		};

		console.info = (...args): void => {
			if (loggerInstance) {
				loggerInstance.info(args.join(' '));
			}
		};

		console.warn = (...args): void => {
			if (loggerInstance) {
				loggerInstance.warn(args.join(' '));
			}
		};

		console.error = (...args): void => {
			if (loggerInstance) {
				loggerInstance.error(args.join(' '));
			}
		};

		console.debug = (...args): void => {
			if (loggerInstance) {
				loggerInstance.debug(args.join(' '));
			}
		};

		return loggerInstance;
	} catch (error) {
		const appError = new ServiceUnavailableError(60, service, {
			exposeToClient: false,
			message: `${service} Error: Failed to initialize logger`
		});
		ErrorLogger.logError(appError, logger);
		processError(error, logger);

		// fallback to console logger in case of initialization failure
		return Object.assign(
			createLogger({
				level: 'error',
				format: combine(timestamp(), logFormat),
				transports: [
					new transports.Console({
						format: combine(colorize(), logFormat)
					})
				]
			}),
			{
				stream: {
					write: (message: string) => {
						console.error(message.trim());
					}
				}
			}
		);
	}
}

export function logCritical(message: string): void {
	if (loggerInstance) {
		loggerInstance.log('critical', message);
	} else {
		console.error(`Critical: ${message}`);
	}
}

export function isLogger(
	logger: Logger | Console | undefined
): logger is Logger {
	return (
		logger !== undefined &&
		logger !== null &&
		typeof logger.error === 'function' &&
		typeof logger.warn === 'function' &&
		typeof logger.debug === 'function' &&
		typeof logger.info === 'function'
	);
}

export type Logger = WinstonLogger;
export const logger: Logger = setupLogger();
