import { MiddlewareStatusService } from '../../../middleware/MiddlewareStatus';
import { MiddlewareStatusServiceInterface } from '../../interfaces/main';

export class MiddlewareStatusServiceProvider {
	private static instance: MiddlewareStatusServiceInterface | null = null;

	public static async getMiddlewareStatusService(): Promise<MiddlewareStatusServiceInterface> {
		if (!this.instance) {
			this.instance = await MiddlewareStatusService.getInstance();
		}
		return this.instance;
	}
}
