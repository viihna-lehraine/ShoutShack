import { Request, Response, NextFunction } from 'express';
import {
	AccessControlMiddlewareServiceInterface,
	AppLoggerServiceInterface
} from '../index/interfaces/main';
import { AuthenticatedUserInterface } from '../index/interfaces/main';
import { LoggerServiceFactory } from '../index/factory/subfactories/LoggerServiceFactory';

export class AccessControlMiddlewareService
	implements AccessControlMiddlewareServiceInterface
{
	private static instance: AccessControlMiddlewareService | null = null;

	private logger: AppLoggerServiceInterface;

	private constructor(logger: AppLoggerServiceInterface) {
		this.logger = logger;
	}

	public static async getInstance(): Promise<AccessControlMiddlewareService> {
		if (!AccessControlMiddlewareService.instance) {
			const logger = await LoggerServiceFactory.getLoggerService();
			AccessControlMiddlewareService.instance =
				new AccessControlMiddlewareService(logger);
		}

		return AccessControlMiddlewareService.instance;
	}

	public restrictTo(...allowedRoles: string[]) {
		return (req: Request, res: Response, next: NextFunction): void => {
			const user = req.user as AuthenticatedUserInterface;

			if (!user || !allowedRoles.includes(user.role)) {
				res.status(403).json({
					status: 'fail',
					message: 'You do not have permission to access this route'
				});
				return;
			}
			next();
		};
	}

	public hasPermission(...requiredPermissions: string[]) {
		return (req: Request, res: Response, next: NextFunction): void => {
			const user = req.user as AuthenticatedUserInterface;

			if (
				!user ||
				!this.checkPermissions(user.permissions, requiredPermissions)
			) {
				res.status(403).json({
					status: 'fail',
					message:
						'You do not have the required permissions to access this route'
				});
				return;
			}
			next();
		};
	}

	private checkPermissions(
		userPermissions: string[],
		requiredPermissions: string[]
	): boolean {
		return requiredPermissions.every(permission =>
			userPermissions.includes(permission)
		);
	}

	public async shutdown(): Promise<void> {
		try {
			this.logger?.info(
				'Shutting down AccessControlMiddlewareService...'
			);

			AccessControlMiddlewareService.instance = null;

			this.logger?.info(
				'AccessControlMiddlewareService shutdown completed.'
			);
		} catch (error) {
			this.logger?.error(
				'Error during AccessControlMiddlewareService shutdown',
				error
			);
		}
	}
}
