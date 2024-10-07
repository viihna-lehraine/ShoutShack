import { AccessControlMiddlewareProvider } from '../providers/AccessControlMiddlewareProvider';
import { AccessControlMiddlewareServiceInterface } from '../../interfaces/main';

export class AccessControlMiddlewareFactory {
	public static async getAccessControlMiddlewareService(): Promise<AccessControlMiddlewareServiceInterface> {
		return await AccessControlMiddlewareProvider.getAccessControlMiddlewareService();
	}
}
