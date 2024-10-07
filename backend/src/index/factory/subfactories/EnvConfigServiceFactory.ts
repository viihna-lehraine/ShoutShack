import { EnvConfigServiceInterface } from '../../interfaces/main';
import { EnvConfigService } from '../../../services/EnvConfig';

export class EnvConfigServiceFactory {
	public static getEnvConfigService(): Promise<EnvConfigServiceInterface> {
		return EnvConfigService.getInstance();
	}
}
