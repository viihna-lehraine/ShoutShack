import { csrfOptions } from '../../../config/middlewareOptions';
import { CSRFMiddlewareService } from '../../../middleware/CSRF';
import { HelmetMiddlewareService } from '../../../middleware/Helmet';
import { JWTAuthMiddlewareService } from '../../../middleware/JWTAuth';
import { PassportAuthMiddlewareService } from '../../../middleware/PassportAuth';
import {
	CSRFMiddlewareServiceInterface,
	HelmetMiddlewareServiceInterface,
	JWTAuthMiddlewareServiceInterface,
	PassportAuthMiddlewareServiceInterface
} from '../../interfaces/main';

export class CSRFMiddlewareProvider {
	private static instance: CSRFMiddlewareServiceInterface | null = null;

	public static async getCSRFMiddleware(): Promise<CSRFMiddlewareServiceInterface> {
		if (!this.instance) {
			this.instance =
				await CSRFMiddlewareService.getInstance(csrfOptions);
		}
		return this.instance;
	}
}

export class HelmetMiddlewareProvider {
	private static instance: HelmetMiddlewareServiceInterface | null = null;

	public static async getHelmetMiddleware(): Promise<HelmetMiddlewareServiceInterface> {
		if (!this.instance) {
			this.instance = await HelmetMiddlewareService.getInstance();
		}
		return this.instance;
	}
}

export class JWTAuthMiddlewareProvider {
	private static instance: JWTAuthMiddlewareServiceInterface | null = null;

	public static async getJWTAuthMiddleware(): Promise<JWTAuthMiddlewareServiceInterface> {
		if (!this.instance) {
			this.instance = await JWTAuthMiddlewareService.getInstance();
		}
		return this.instance;
	}
}

export class PassportAuthMiddlewareProvider {
	private static instance: PassportAuthMiddlewareServiceInterface | null =
		null;

	public static async getPassportAuthMiddleware(): Promise<PassportAuthMiddlewareServiceInterface> {
		if (!this.instance) {
			this.instance = await PassportAuthMiddlewareService.getInstance();
		}
		return this.instance;
	}
}
