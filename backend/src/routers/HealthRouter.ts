import { BaseRouter } from './BaseRouter';
import { ServiceFactory } from '../index/factory';
import { Request, Response, NextFunction } from 'express';
import { serviceTTLConfig } from '../config/cache';
import {
	AccessControlMiddlewareServiceInterface,
	AppLoggerServiceInterface,
	CacheServiceInterface,
	CSRFMiddlewareServiceInterface,
	EnvConfigServiceInterface,
	ErrorHandlerServiceInterface,
	ErrorLoggerServiceInterface,
	GatekeeperServiceInterface,
	HealthCheckServiceInterface,
	HelmetMiddlewareServiceInterface,
	JWTAuthMiddlewareServiceInterface,
	PassportAuthMiddlewareServiceInterface
} from '../index/interfaces/services';

export class HealthRouter extends BaseRouter {
	private healthCheckService!: HealthCheckServiceInterface;
	private accessControl!: AccessControlMiddlewareServiceInterface;
	private csrfMiddleware!: CSRFMiddlewareServiceInterface;
	private cacheTTL: number = 300;

	private constructor(
		logger: AppLoggerServiceInterface,
		errorLogger: ErrorLoggerServiceInterface,
		errorHandler: ErrorHandlerServiceInterface,
		envConfig: EnvConfigServiceInterface,
		cacheService: CacheServiceInterface,
		gatekeeperService: GatekeeperServiceInterface,
		helmetService: HelmetMiddlewareServiceInterface,
		JWTMiddleware: JWTAuthMiddlewareServiceInterface,
		passportMiddleware: PassportAuthMiddlewareServiceInterface
	) {
		super(
			logger,
			errorLogger,
			errorHandler,
			envConfig,
			cacheService,
			gatekeeperService,
			helmetService,
			JWTMiddleware,
			passportMiddleware
		);

		this.initializeServices().then(() => {
			this.router.use(this.csrfMiddleware.initializeCSRFMiddleware());
			this.setupRoutes();
		});
	}

	private async initializeServices(): Promise<void> {
		this.healthCheckService = await ServiceFactory.getHealthCheckService();
		this.accessControl =
			await ServiceFactory.getAccessControlMiddlewareService();
		this.csrfMiddleware = await ServiceFactory.getCSRFMiddlewareService();
		this.cacheTTL = serviceTTLConfig.HealthRouter || 300;
	}

	private setupRoutes(): void {
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
