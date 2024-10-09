import {
	AppLoggerServiceInterface,
	ErrorLoggerServiceInterface
} from '../../interfaces/main';
import {
	LoggerServiceProvider,
	ErrorLoggerServiceProvider
} from '../providers/LoggerServiceProviders';

export class LoggerServiceFactory {
	public static async getLoggerService(): Promise<AppLoggerServiceInterface> {
		return LoggerServiceProvider.getLoggerService();
	}

	public static async getErrorLoggerService(): Promise<ErrorLoggerServiceInterface> {
		return ErrorLoggerServiceProvider.getErrorLoggerService();
	}
}
