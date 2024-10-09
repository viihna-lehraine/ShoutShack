import { ResourceManagerInterface } from '../../interfaces/main';
import { ResourceManagerProvider } from '../providers/ResourceManagerProvider';

export class ResourceManagerFactory {
	public static async getResourceManager(): Promise<ResourceManagerInterface> {
		return await ResourceManagerProvider.getResourceManager();
	}
}
