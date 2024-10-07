import { UserController } from '../../../controllers/UserController';
import { UserControllerInterface } from '../../interfaces/main';

export class UserControllerProvider {
	private static instance: Promise<UserControllerInterface> | null = null;

	public static async getUserController(): Promise<UserControllerInterface> {
		if (!this.instance) {
			this.instance = UserController.getInstance();
		}
		return await this.instance;
	}
}
