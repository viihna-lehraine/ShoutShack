import { DatabaseControllerProvider } from '../providers/DatabaseControllerProvider';
import { DatabaseControllerInterface } from '../../interfaces/main';

export class DatabaseControllerFactory {
	public static async getDatabaseController(): Promise<DatabaseControllerInterface> {
		return await DatabaseControllerProvider.getDatabaseController();
	}
}
