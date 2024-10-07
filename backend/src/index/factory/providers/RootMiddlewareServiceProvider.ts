import { RootMiddlewareService } from '../../../middleware/Root';
import { RootMiddlewareServiceInterface } from '../../interfaces/main';

export class RootMiddlewareServiceProvider {
	private static instance: RootMiddlewareServiceInterface | null = null;

	public static async getRootMiddlewareService(): Promise<RootMiddlewareServiceInterface> {
		if (!this.instance) {
			this.instance = await RootMiddlewareService.getInstance();
		}
		return this.instance;
	}
}
