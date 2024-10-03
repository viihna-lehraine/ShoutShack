import { Request, Response, NextFunction } from 'express';
import { AccessControlMiddlewareServiceInterface } from '../index/interfaces/services';
import { ServiceFactory } from '../index/factory';

interface AuthenticatedUser {
	id: string;
	role: string;
	permissions: string[];
}

export class AccessControlMiddlewareService
	implements AccessControlMiddlewareServiceInterface
{
	private static instance: AccessControlMiddlewareService | null = null;

	private logger = ServiceFactory.getLoggerService();

	private constructor() {}

	public static getInstance(): AccessControlMiddlewareService {
		if (!AccessControlMiddlewareService.instance) {
			AccessControlMiddlewareService.instance =
				new AccessControlMiddlewareService();
		}

		return AccessControlMiddlewareService.instance;
	}

	public restrictTo(...allowedRoles: string[]) {
		return (req: Request, res: Response, next: NextFunction): void => {
			const user = req.user as AuthenticatedUser;

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
			const user = req.user as AuthenticatedUser;

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
