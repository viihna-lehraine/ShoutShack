import { BaseRouterInterface } from '../../interfaces/main';
import { RouterProvider } from '../providers/RouterProvider';

export class RouterFactory {
	public static async getBaseRouter(): Promise<BaseRouterInterface> {
		return await RouterProvider.getBaseRouter();
	}
}
