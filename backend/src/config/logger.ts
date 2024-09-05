import fs from 'fs';
import { createLogger, format, Logger as WinstonLogger, transports } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { environmentVariables } from './environmentConfig';
import { validateDependencies } from '../utils/validateDependencies';

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
	isProduction = environmentVariables.nodeEnv === 'production',
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
			console.log('Logger instance already exists. Returning the existing instance.');
			return loggerInstance;
		}

		if (!fs.existsSync(logDirectory)) {
			console.error('Log directory does not exist. Attempting to create it...');
			try {
				fs.mkdirSync(logDirectory, { recursive: true });
				console.log(`Log directory ${logDirectory} created successfully.`);
			} catch (error) {
				if (error instanceof Error) {
					console.error(`Failed to create log directory: ${error.message}`);
					throw new Error(`Failed to create log directory: ${error.message}`);
				} else {
					console.error(`Failed to create log directory: ${String(error)}`);
					throw new Error(`Failed to create log directory: ${String(error)}`);
				}
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

		console.log = (...args) => {
			loggerInstance?.info(args.join(' '));
		};
		console.info = (...args) => {
			loggerInstance?.info(args.join(' '));
		}
		console.warn = (...args) => {
			loggerInstance?.warn(args.join(' '));
		}
		console.error = (...args) => {
			loggerInstance?.error(args.join(' '));
		}
		console.debug = (...args) => {
			loggerInstance?.debug(args.join(' '));
		}

		return Object.assign(loggerInstance, {
			stream: {
				write: (message: string) => {
					loggerInstance?.info(message.trim());
				}
			}
		});
	} catch (error) {
		console.error(`Failed to initialize logger: ${error}`);
		return Object.assign(createLogger({
			level: 'error',
			format: combine(timestamp(), logFormat),
			transports: [
				new transports.Console({
					format: combine(colorize(), logFormat)
				})
			]
		}), {
			stream: {
				write: (message: string) => {
					console.error(message.trim());
				}
			}
		});
	}
}

export function isLogger(logger: Logger | Console | undefined): logger is Logger {
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
