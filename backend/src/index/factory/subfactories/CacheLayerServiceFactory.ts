import {
	CacheServiceProvider,
	RedisServiceProvider
} from '../providers/CacheLayerServiceProviders';
import {
	CacheServiceInterface,
	RedisServiceInterface
} from '../../interfaces/main';

export class CacheLayerServiceFactory {
	public static async getCacheService(): Promise<CacheServiceInterface> {
		return await CacheServiceProvider.getCacheService();
	}

	public static async getRedisService(): Promise<RedisServiceInterface> {
		return await RedisServiceProvider.getRedisService();
	}
}
