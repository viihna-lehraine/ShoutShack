import { CacheService } from '../../../services/Cache';
import { CacheServiceInterface } from '../../interfaces/main';

export class CacheServiceProvider {
	private static instance: CacheServiceInterface | null = null;

	public static async getCacheService(): Promise<CacheServiceInterface> {
		if (!this.instance) {
			this.instance = await CacheService.getInstance();
		}
		return this.instance;
	}
}
