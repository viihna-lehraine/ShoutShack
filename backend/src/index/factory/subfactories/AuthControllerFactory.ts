import { AuthControllerProvider } from '../providers/AuthControllerProvider';
import { AuthControllerInterface } from '../../interfaces/main';

export class AuthControllerFactory {
	public static async getAuthController(): Promise<AuthControllerInterface> {
		return await AuthControllerProvider.getAuthController();
	}
}
