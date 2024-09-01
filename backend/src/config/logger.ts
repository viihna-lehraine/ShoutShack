import { createLogger, format, Logger, transports } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const { colorize, combine, errors, json, printf, timestamp } = format;

const logFormat = printf(({ level, message, timestamp, stack }) => {
	return `${timestamp} ${level}: ${stack || message}`;
});

export interface LoggerDependencies {
	logLevel?: string | undefined;
	logDirectory?: string | undefined;
	serviceName?: string | undefined;
	isProduction?: boolean | undefined;
}

function setupLogger({
	logLevel = 'debug',
	logDirectory = '../../data/logs/server/main',
	serviceName = 'guestbook-service',
	isProduction = process.env.NODE_ENV === 'development'
}: LoggerDependencies = {}): Logger {
	const logger = createLogger({
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

	return logger;
}

export default setupLogger;
