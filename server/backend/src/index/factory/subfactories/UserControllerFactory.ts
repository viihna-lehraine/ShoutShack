import { UserControllerInterface } from '../../interfaces/main';
import { UserControllerProvider } from '../providers/UserControllerProvider';

export class UserControllerFactory {
	public static getUserController(): Promise<UserControllerInterface> {
		return UserControllerProvider.getUserController();
	}
}
