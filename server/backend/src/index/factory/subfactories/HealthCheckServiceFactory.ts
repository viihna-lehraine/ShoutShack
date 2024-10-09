import { HealthCheckServiceInterface } from '../../interfaces/main';
import { HealthCheckServiceProvider } from '../providers/HealthCheckServiceProvider';

export class HealthCheckServiceFactory {
	public static async getHealthCheckService(): Promise<HealthCheckServiceInterface> {
		return await HealthCheckServiceProvider.getHealthCheckService();
	}
}
