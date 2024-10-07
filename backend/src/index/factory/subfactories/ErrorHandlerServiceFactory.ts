import { ErrorHandlerServiceProvider } from '../providers/ErrorHandlerServiceProvider';
import { ErrorHandlerServiceInterface } from '../../interfaces/main';

export class ErrorHandlerServiceFactory {
	public static async getErrorHandlerService(): Promise<ErrorHandlerServiceInterface> {
		return await ErrorHandlerServiceProvider.getErrorHandlerService();
	}
}
