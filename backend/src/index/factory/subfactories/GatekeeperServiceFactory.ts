import { GatekeeperServiceInterface } from '../../interfaces/main';
import { GatekeeperServiceProvider } from '../providers/GatekeeperServiceProvider';

export class GatekeeperServiceFactory {
	public static async getGatekeeperService(): Promise<GatekeeperServiceInterface> {
		return await GatekeeperServiceProvider.getGatekeeperService();
	}
}
