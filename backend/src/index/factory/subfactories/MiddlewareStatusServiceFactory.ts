import { MiddlewareStatusServiceInterface } from '../../interfaces/main';
import { MiddlewareStatusServiceProvider } from '../providers/MiddlewareStatusServiceProvider';

export class MiddlewareStatusServiceFactory {
	public static async getMiddlewareStatusService(): Promise<MiddlewareStatusServiceInterface> {
		return await MiddlewareStatusServiceProvider.getMiddlewareStatusService();
	}
}
