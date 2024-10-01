import { BaseRouter } from './BaseRouter';
import { ServiceFactory } from '../index/factory';
import { Request, Response, NextFunction } from 'express';

export class HealthRouter extends BaseRouter {
	private healthCheckService = ServiceFactory.getHealthCheckService();
	private accessControl = ServiceFactory.getAccessControlMiddlewareService();
	private csrfMiddleware = ServiceFactory.getCSRFMiddlewareService();

	private constructor() {
		super();
		this.router.use(this.csrfMiddleware.initializeCSRFMiddleware());
		this.router.get(
			'/health',
			this.accessControl.restrictTo('admin'),
			this.asyncHandler(
				async (req: Request, res: Response, next: NextFunction) => {
					try {
						const healthData =
							await this.healthCheckService.performHealthCheck();
						res.json(healthData);
					} catch (err) {
						next(err);
					}
				}
			)
		);
	}
}
