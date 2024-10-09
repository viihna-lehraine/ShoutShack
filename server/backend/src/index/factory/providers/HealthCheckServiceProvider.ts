import { HealthCheckService } from '../../../services/HealthCheck';
import { HealthCheckServiceInterface } from '../../interfaces/main';

export class HealthCheckServiceProvider {
	private static instance: Promise<HealthCheckServiceInterface> | null = null;

	public static async getHealthCheckService(): Promise<HealthCheckServiceInterface> {
		if (!this.instance) {
			this.instance = HealthCheckService.getInstance();
		}

		return this.instance;
	}
}
