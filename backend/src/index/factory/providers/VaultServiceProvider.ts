import { VaultService } from '../../../services/Vault';
import { VaultServiceInterface } from '../../interfaces/main';

export class VaultServiceProvider {
	private static instance: Promise<VaultServiceInterface> | null = null;

	public static async getVaultService(): Promise<VaultServiceInterface> {
		if (!this.instance) {
			this.instance = VaultService.getInstance();
		}
		return await this.instance;
	}
}
