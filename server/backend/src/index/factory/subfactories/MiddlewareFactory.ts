import {
	CSRFMiddlewareServiceInterface,
	HelmetMiddlewareServiceInterface,
	JWTAuthMiddlewareServiceInterface,
	PassportAuthMiddlewareServiceInterface
} from '../../interfaces/main';
import {
	CSRFMiddlewareProvider,
	HelmetMiddlewareProvider,
	JWTAuthMiddlewareProvider,
	PassportAuthMiddlewareProvider
} from '../providers/MiddlewareProviders';

export class MiddlewareFactory {
	public static async getCSRFMiddleware(): Promise<CSRFMiddlewareServiceInterface> {
		return await CSRFMiddlewareProvider.getCSRFMiddleware();
	}

	public static async getHelmetMiddleware(): Promise<HelmetMiddlewareServiceInterface> {
		return await HelmetMiddlewareProvider.getHelmetMiddleware();
	}

	public static async getJWTAuthMiddleware(): Promise<JWTAuthMiddlewareServiceInterface> {
		return await JWTAuthMiddlewareProvider.getJWTAuthMiddleware();
	}

	public static async getPassportAuthMiddleware(): Promise<PassportAuthMiddlewareServiceInterface> {
		return await PassportAuthMiddlewareProvider.getPassportAuthMiddleware();
	}
}
