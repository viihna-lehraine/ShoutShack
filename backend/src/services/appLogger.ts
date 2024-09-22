import fs from 'fs';
import {
	addColors,
	createLogger,
	format,
	LeveledLogMethod,
	LogCallback,
	Logger as WinstonLogger,
	transports
} from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import LogStashTransport from 'winston-logstash';
import TransportStream from 'winston-transport';
import { configService } from './configService';
import { envSecretsStore } from '../environment/envSecrets';
import { errorClasses } from '../errors/errorClasses';
import { ErrorLogger } from './errorLogger';
import { processError } from '../errors/processError';

import '../../types/custom/winston-logstash';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export type AppLogger = WinstonLogger;

const service: string = 'Logger Service';

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

export function setUpLogger(): AppLogger {
	const envVariables = configService.getEnvVariables();
	const logLevel = envVariables.logLevel || 'info';
	const serviceName = envVariables.serviceName;
	const isProduction = envVariables.nodeEnv === 'production';
	const defaultLogLevel = isProduction ? 'info' : 'debug';
	const logDirectory =
		envVariables.primaryLogPath || './data/logs/server/main/';

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
			level: defaultLogLevel,
			format: combine(
				errors({ stack: true }),
				timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
				json()
			),
			defaultMeta: { service: serviceName },
			transports: loggerTransports
		}) as AppLogger;

		addColors(customLevels.colors);

		return loggerInstance;
	} catch (error) {
		console.log(
			`Failed to create logger instance: ${error instanceof Error ? error.message : error}`
		);
		processError(error);

		return createLogger({
			level: defaultLogLevel,
			format: combine(timestamp(), logFormat),
			transports: [
				new transports.Console({
					format: combine(colorize(), logFormat)
				})
			]
		}) as AppLogger;
	}
}

export function createRedactedLogger(
	loggerInstance: WinstonLogger
): WinstonLogger {
	const levels: LogLevel[] = ['info', 'warn', 'error', 'debug'];

	levels.forEach(level => {
		const originalMethod: LeveledLogMethod =
			loggerInstance[level].bind(loggerInstance);

		loggerInstance[level] = ((
			message: string,
			meta?: Record<string, unknown> | string,
			callback?: LogCallback
		): void => {
			const redactedMeta =
				typeof meta === 'object'
					? envSecretsStore.redactSecrets(meta)
					: meta;
			originalMethod(message, redactedMeta, callback);
		}) as LeveledLogMethod;
	});

	return loggerInstance;
}

export function isAppLogger(
	appLogger: AppLogger | Console | undefined
): appLogger is AppLogger {
	return (
		appLogger !== undefined &&
		appLogger !== null &&
		typeof appLogger.error === 'function' &&
		typeof appLogger.warn === 'function' &&
		typeof appLogger.debug === 'function' &&
		typeof appLogger.info === 'function' &&
		typeof appLogger.log === 'function'
	);
}

export function handleCriticalError(error: unknown): void {
	const errorMessage = error instanceof Error ? error.message : String(error);

	console.error(`Critical error: ${errorMessage}`);
	console.error(
		`Stack trace: ${error instanceof Error ? error.stack : 'N/A'}`
	);
	process.exit(1);
}

export let loggerInstance: AppLogger;
