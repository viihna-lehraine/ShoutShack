import { DatabaseController } from '../../../controllers/DatabaseController';
import { DatabaseControllerInterface } from '../../interfaces/main';

export class DatabaseControllerProvider {
	private static instance: DatabaseControllerInterface | null = null;

	public static async getDatabaseController(): Promise<DatabaseControllerInterface> {
		if (!this.instance) {
			this.instance = await DatabaseController.getInstance();
		}
		return this.instance;
	}
}
