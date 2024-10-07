import { ResourceManager } from '../../../services/ResourceManager';
import { ResourceManagerInterface } from '../../interfaces/main';

export class ResourceManagerProvider {
	private static instance: Promise<ResourceManagerInterface> | null = null;

	public static async getResourceManager(): Promise<ResourceManagerInterface> {
		if (!this.instance) {
			this.instance = ResourceManager.getInstance();
		}

		return await this.instance;
	}
}
