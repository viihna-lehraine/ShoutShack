import { RootMiddlewareServiceInterface } from '../../interfaces/main';
import { RootMiddlewareServiceProvider } from '../providers/RootMiddlewareServiceProvider';

export class RootMiddlewareFactory {
	public static async getRootMiddleware(): Promise<RootMiddlewareServiceInterface> {
		return await RootMiddlewareServiceProvider.getRootMiddlewareService();
	}
}
