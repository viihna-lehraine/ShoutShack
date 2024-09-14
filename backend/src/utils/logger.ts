import fs from 'fs';
import {
	createLogger,
	format,
	Logger as WinstonLogger,
	transports
} from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { environmentVariables } from '../config/environmentConfig';
import { validateDependencies } from './validateDependencies';

const { colorize, combine, errors, json, printf, timestamp } = format;

const logFormat = printf(({ level, message, timestamp, stack }) => {
	return `${timestamp} ${level}: ${stack || message}`;
});

export interface LoggerDependencies {
	logLevel?: string | undefined;
	logDirectory?: string | undefined;
	serviceName?: string | undefined;
	isProduction?: boolean | undefined;
	console?: typeof console;
}

let loggerInstance: WinstonLogger | null = null;

export function setupLogger({
	logLevel = environmentVariables.logLevel || 'info',
	logDirectory = environmentVariables.serverLogPath,
	serviceName = environmentVariables.serviceName,
	isProduction = environmentVariables.nodeEnv === 'production'
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
			logDirectory = './logs';
			console.warn(
				'Invalid or missing log directory path. Using default "./logs".'
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
				console.error(`Failed to create log directory: ${error}`);
				throw new Error(`Failed to create log directory`);
			}
		}

		loggerInstance = createLogger({
			level: isProduction ? 'info' : logLevel,
			format: combine(
				errors({ stack: true }),
				timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
				json()
			),
			defaultMeta: { service: serviceName },
			transports: [
				new transports.Console({
					format: combine(colorize(), logFormat)
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
					)
				})
			]
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
		console.error(`Failed to initialize logger: ${error}`);
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
export const logger = setupLogger();
