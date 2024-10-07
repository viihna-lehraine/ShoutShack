import { BaseRouter } from '../../../routers/Routers';
import { BaseRouterInterface } from '../../interfaces/main';

export class RouterProvider {
	private static instance: Promise<BaseRouterInterface> | null = null;

	public static async getBaseRouter(): Promise<BaseRouterInterface> {
		if (!this.instance) {
			this.instance = BaseRouter.getInstance();
		}

		return await this.instance;
	}
}
