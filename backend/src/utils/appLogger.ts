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
import { configService } from '../config/configService';
// import { maskSecrets } from '../environment/envSecrets';
import { errorClasses } from '../errors/errorClasses';
import { ErrorLogger } from '../errors/errorLogger';
import { processError } from '../errors/processError';

import '../../types/custom/winston-logstash';

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

const service: string = 'Logger Service';
let loggerInstance: WinstonLogger;

function createLogStashTransport(): TransportStream | null {
	const envVariables = configService.getEnvVariables();

	try {
		return new LogStashTransport({
			port: envVariables.logStashPort,
			node_name: envVariables.logStashNode,
			host: envVariables.logStashHost
		}) as unknown as TransportStream;
	} catch (error) {
		const appError = new errorClasses.ServiceUnavailableError(60, service, {
			exposeToClient: false,
			message: `${service} Error: Failed to create Logstash transport`
		});
		ErrorLogger.logError(appError);
		processError(error);
		return null;
	}
}

function addLogStashTransportIfEnabled(
	transportsArray: TransportStream[]
): void {
	const featureFlags = configService.getFeatureFlags();
	if (featureFlags.enableLogStash) {
		const logStashTransport = createLogStashTransport();
		if (logStashTransport) {
			transportsArray.push(logStashTransport);
		}
	}
}

export function setupLogger(): WinstonLogger {
	const envVariables = configService.getEnvVariables();
	const logLevel = envVariables.logLevel || 'info';
	const serviceName = envVariables.serviceName;
	const isProduction = envVariables.nodeEnv === 'production';
	const logDirectory =
		envVariables.serverLogPath || './data/logs/server/main/';

	try {
		if (!fs.existsSync(logDirectory)) {
			fs.mkdirSync(logDirectory, { recursive: true });
		}

		const loggerTransports: TransportStream[] = [
			new transports.Console({
				format: combine(colorize(), logFormat),
				level: isProduction ? 'info' : logLevel
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
				level: logLevel
			})
		];

		addLogStashTransportIfEnabled(loggerTransports);

		loggerInstance = createLogger({
			levels: customLevels.levels,
			level: logLevel,
			format: combine(
				errors({ stack: true }),
				timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
				json()
			),
			defaultMeta: { service: serviceName },
			transports: loggerTransports
		});

		return loggerInstance;
	} catch (error) {
		const appError = new errorClasses.ServiceUnavailableError(60, service, {
			exposeToClient: false,
			message: `${service} Error: Failed to initialize logger`
		});
		ErrorLogger.logError(appError);
		processError(error);

		// fallback to console logger
		return createLogger({
			level: 'error',
			format: combine(timestamp(), logFormat),
			transports: [
				new transports.Console({
					format: combine(colorize(), logFormat)
				})
			]
		});
	}
}

export function logWithMaskedSecrets(
	level: string,
	message: string,
	meta?: Record<string, unknown>
): void {
	const maskedMeta =
		meta && typeof meta === 'object' ? maskSecrets(meta) : meta;
	if (loggerInstance) {
		loggerInstance.log(level, message, maskedMeta);
	}
}

// check if the given logger is an instance of appLogger
export function isAppLogger(
	appLogger: appLogger | Console | undefined
): appLogger is appLogger {
	return (
		appLogger !== undefined &&
		appLogger !== null &&
		typeof appLogger.error === 'function' &&
		typeof appLogger.warn === 'function' &&
		typeof appLogger.debug === 'function' &&
		typeof appLogger.info === 'function'
	);
}

export type appLogger = WinstonLogger;
