import { VaultServiceInterface } from '../../interfaces/main';
import { VaultServiceProvider } from '../providers/VaultServiceProvider';

export class VaultServiceFactory {
	public static async getVaultService(): Promise<VaultServiceInterface> {
		return await VaultServiceProvider.getVaultService();
	}
}
