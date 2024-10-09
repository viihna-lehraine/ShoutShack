import { AuthController } from '../../../controllers/AuthController';
import { AuthControllerInterface } from '../../interfaces/main';

export class AuthControllerProvider {
	private static instance: AuthControllerInterface | null = null;

	public static async getAuthController(): Promise<AuthControllerInterface> {
		if (!this.instance) {
			this.instance = await AuthController.getInstance();
		}

		return this.instance;
	}
}
