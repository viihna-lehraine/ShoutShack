import { PassportServiceProvider } from '../providers/PassportServiceProvider';
import { PassportServiceInterface } from '../../interfaces/main';

export class PassportServiceFactory {
	public static async getPassportService(): Promise<PassportServiceInterface> {
		return await PassportServiceProvider.getPassportService();
	}
}
