import { CacheServiceProvider } from '../providers/CacheLayerServiceProviders';
import { CacheServiceInterface } from '../../interfaces/main';

export class CacheLayerServiceFactory {
	public static async getCacheService(): Promise<CacheServiceInterface> {
		return await CacheServiceProvider.getCacheService();
	}
}
