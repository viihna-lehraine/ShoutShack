import { createLogger, format, Logger as WinstonLogger, transports } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { environmentVariables } from './environmentConfig';
import { validateDependencies, handleGeneralError } from '../middleware/errorHandler';

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
	logLevel = environmentVariables.logLevel || 'debug',
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
			return loggerInstance;
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

		return loggerInstance;
	} catch (error) {
		handleGeneralError(error, console);
		throw error;
	}
}

export type Logger = WinstonLogger;
