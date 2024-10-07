import {
	AppLoggerServiceDeps,
	AppLoggerServiceInterface,
	ErrorLoggerServiceInterface
} from '../../interfaces/main';
import { AppLoggerService, ErrorLoggerService } from '../../../services/Logger';

async function loadLoggerDeps(): Promise<AppLoggerServiceDeps> {
	const winston = await import('winston');
	const DailyRotateFileModule = await import('winston-daily-rotate-file');
	const LogStashTransportModule = await import('winston-logstash');
	const { ErrorClasses } = await import('../../../errors/ErrorClasses');
	const { HandleErrorStaticParameters } = await import(
		'../../interfaces/main'
	);
	const fs = await import('fs');
	const { Sequelize } = await import('sequelize');
	const { v4: uuidv4 } = await import('uuid');

	return {
		winston: {
			createLogger: winston.createLogger,
			format: winston.format,
			transports: winston.transports,
			addColors: winston.addColors
		},
		DailyRotateFile: DailyRotateFileModule.default,
		LogStashTransport: LogStashTransportModule.default,
		ErrorClasses,
		HandleErrorStaticParameters,
		fs,
		Sequelize,
		uuidv4
	};
}

export class LoggerServiceProvider {
	private static instance: Promise<AppLoggerServiceInterface> | null = null;

	public static async getLoggerService(
		logLevel?: string,
		serviceName?: string
	): Promise<AppLoggerServiceInterface> {
		if (!this.instance) {
			const deps = await loadLoggerDeps();
			this.instance = AppLoggerService.getInstance(
				deps,
				logLevel,
				serviceName
			);
		}
		return await this.instance;
	}
}

export class ErrorLoggerServiceProvider {
	private static instance: Promise<ErrorLoggerServiceInterface> | null = null;

	public static async getErrorLoggerService(
		logLevel?: string,
		serviceName?: string
	): Promise<ErrorLoggerServiceInterface> {
		if (!this.instance) {
			const deps = await loadLoggerDeps();
			this.instance = ErrorLoggerService.getInstance(
				deps,
				logLevel,
				serviceName
			);
		}
		return await this.instance;
	}
}
