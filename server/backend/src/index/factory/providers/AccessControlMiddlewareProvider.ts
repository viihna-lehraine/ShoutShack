import { AccessControlMiddlewareService } from '../../../middleware/AccessControl';
import { AccessControlMiddlewareServiceInterface } from '../../interfaces/main';

export class AccessControlMiddlewareProvider {
	private static accessControlMiddlewareService: AccessControlMiddlewareServiceInterface | null =
		null;

	public static async getAccessControlMiddlewareService(): Promise<AccessControlMiddlewareServiceInterface> {
		if (!this.accessControlMiddlewareService) {
			this.accessControlMiddlewareService =
				await AccessControlMiddlewareService.getInstance();
		}

		return this.accessControlMiddlewareService;
	}
}
