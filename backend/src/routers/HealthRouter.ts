import { BaseRouter } from './BaseRouter';
import { ServiceFactory } from '../index/factory';
import { Request, Response, NextFunction } from 'express';
import { serviceTTLConfig } from '../config/cache';

export class HealthRouter extends BaseRouter {
	private healthCheckService = ServiceFactory.getHealthCheckService();
	private accessControl = ServiceFactory.getAccessControlMiddlewareService();
	private csrfMiddleware = ServiceFactory.getCSRFMiddlewareService();
	private cacheTTL = serviceTTLConfig.HealthRouter || 300;

	private constructor() {
		super();
		this.router.use(this.csrfMiddleware.initializeCSRFMiddleware());
		this.router.get(
			'/health.html',
			this.accessControl.restrictTo('admin'),
			this.asyncHandler(
				async (req: Request, res: Response, next: NextFunction) => {
					const cacheKey = 'healthCheckData';

					try {
						const cachedData = await this.cacheService.get(
							cacheKey,
							'healthCheck'
						);

						if (cachedData) {
							this.logger.info(
								'Returning cached health check data'
							);
							res.json(cachedData);
							return;
						}

						const healthData =
							await this.healthCheckService.performHealthCheck();
						await this.cacheService.set(
							cacheKey,
							healthData,
							'healthCheck',
							this.cacheTTL
						);

						this.logger.info(
							'Health check data cached successfully'
						);
						res.json(healthData);
						return;
					} catch (err) {
						next(err);
					}
				}
			)
		);
	}
}
