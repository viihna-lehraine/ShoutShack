import { PassportService } from '../../../auth/Passport';
import { PassportServiceInterface } from '../../interfaces/main';

export class PassportServiceProvider {
	private static instance: PassportServiceInterface | null = null;

	public static async getPassportService(): Promise<PassportServiceInterface> {
		if (!this.instance) {
			this.instance = await PassportService.getInstance();
		}
		return this.instance;
	}
}
