import { ErrorHandlerService } from '../../../errors/ErrorHandler';
import {
	AppLoggerServiceInterface,
	ErrorHandlerServiceInterface,
	ErrorLoggerServiceInterface
} from '../../interfaces/main';
import { LoggerServiceFactory } from '../subfactories/LoggerServiceFactory';

export class ErrorHandlerServiceProvider {
	private static instance: ErrorHandlerServiceInterface | null = null;

	public static async getErrorHandlerService(): Promise<ErrorHandlerServiceInterface> {
		if (!this.instance) {
			const logger: AppLoggerServiceInterface =
				await LoggerServiceFactory.getLoggerService();
			const errorLogger: ErrorLoggerServiceInterface =
				await LoggerServiceFactory.getErrorLoggerService();

			this.instance = await ErrorHandlerService.getInstance(
				logger,
				errorLogger
			);
		}

		return this.instance;
	}
}
