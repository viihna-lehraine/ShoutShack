import { GatekeeperService } from '../../../services/Gatekeeper';
import { GatekeeperServiceInterface } from '../../interfaces/main';

export class GatekeeperServiceProvider {
	private static instance: Promise<GatekeeperServiceInterface> | null = null;

	public static async getGatekeeperService(): Promise<GatekeeperServiceInterface> {
		if (!this.instance) {
			this.instance = GatekeeperService.getInstance();
		}
		return await this.instance;
	}
}
