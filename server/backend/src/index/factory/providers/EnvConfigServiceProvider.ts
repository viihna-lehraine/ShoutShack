import { EnvConfigServiceInterface } from '../../interfaces/main';
import { EnvConfigService } from '../../../services/EnvConfig';

export class EnvConfigServiceProvider {
	private static instance: Promise<EnvConfigServiceInterface> | null = null;

	public static async getEnvConfigService(): Promise<EnvConfigServiceInterface> {
		if (!this.instance) {
			this.instance = EnvConfigService.getInstance();
		}
		return await this.instance;
	}
}
