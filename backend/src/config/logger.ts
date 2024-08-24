import pkg from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const { createLogger, format, transports } = pkg;
const { combine, timestamp, printf, colorize, errors, json } = format;

const logFormat = printf(({ level, message, timestamp, stack }) => {
	return `${timestamp}, ${level}: ${stack || message}`;
});

async function setupLogger(): Promise<pkg.Logger> {
	const logger = createLogger({
		level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
		format: combine(
			timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
			errors({ stack: true }),
			json()
		),
		defaultMeta: { service: 'guestbook-service' },
		transports: [
			new transports.Console({
				format: combine(colorize(), logFormat)
			}),
			new DailyRotateFile({
				filename: './logs/server/error-%DATE%.log',
				dirname: './logs/server',
				datePattern: 'YYYY-MM-DD',
				zippedArchive: true,
				maxSize: '20m',
				maxFiles: '14d',
				format: logFormat
			})
		]
	});

	return logger;
}

export default setupLogger;
