import helmet from 'helmet';
import { Application, Request, Response, NextFunction } from 'express';
import {
	cspOptions,
	helmetOptions,
	permissionsPolicyOptions
} from '../config/middlewareOptions';
import {
	AppLoggerServiceInterface,
	ErrorLoggerServiceInterface,
	ErrorHandlerServiceInterface,
	HelmetMiddlewareServiceInterface
} from '../index/interfaces/main';
import { withRetry } from '../utils/helpers';
import { LoggerServiceFactory } from '../index/factory/subfactories/LoggerServiceFactory';
import { ErrorHandlerServiceFactory } from '../index/factory/subfactories/ErrorHandlerServiceFactory';

export class HelmetMiddlewareService
	implements HelmetMiddlewareServiceInterface
{
	private static instance: HelmetMiddlewareService | null = null;

	private logger: AppLoggerServiceInterface;
	private errorLogger: ErrorLoggerServiceInterface;
	private errorHandler: ErrorHandlerServiceInterface;

	private constructor(
		logger: AppLoggerServiceInterface,
		errorLogger: ErrorLoggerServiceInterface,
		errorHandler: ErrorHandlerServiceInterface
	) {
		this.logger = logger;
		this.errorLogger = errorLogger;
		this.errorHandler = errorHandler;
	}

	public static async getInstance(): Promise<HelmetMiddlewareService> {
		if (!HelmetMiddlewareService.instance) {
			const logger = await LoggerServiceFactory.getLoggerService();
			const errorLogger =
				await LoggerServiceFactory.getErrorLoggerService();
			const errorHandler =
				await ErrorHandlerServiceFactory.getErrorHandlerService();

			HelmetMiddlewareService.instance = new HelmetMiddlewareService(
				logger,
				errorLogger,
				errorHandler
			);
		}

		return HelmetMiddlewareService.instance;
	}

	public async initializeHelmetMiddleware(app: Application): Promise<void> {
		try {
			await withRetry(() => this.applyHelmet(app), 3, 1000);
			await withRetry(() => this.applyCSP(app), 3, 1000);
			await withRetry(() => this.applyReferrerPolicy(app), 3, 1000);
			await withRetry(() => this.applyExpectCT(app), 3, 1000);
			await withRetry(() => this.applyPermissionsPolicy(app), 3, 1000);
			await withRetry(() => this.applyCrossOriginPolicies(app), 3, 1000);
			await withRetry(() => this.applyXssFilter(app), 3, 1000);

			this.logger.info('Helmet middleware initialized successfully');
		} catch (error) {
			this.errorLogger.logError(
				'Failed to initialize Helmet middleware stack'
			);
			this.errorHandler.handleError({ error });
		}
	}

	public async applyHelmet(app: Application): Promise<void> {
		try {
			this.logger.info('Applying Helmet middleware');
			app.use(helmet(helmetOptions));
			this.logger.info('Helmet middleware applied successfully');
		} catch (configError) {
			this.handleHelmetError('applyHelmet', configError);
		}
	}

	public async applyCSP(app: Application): Promise<void> {
		try {
			this.logger.info('Applying Content Security Policy');
			app.use(
				helmet.contentSecurityPolicy({
					directives: {
						...cspOptions.directives,
						styleSrc: ['self', 'nonce-{NONCE}'],
						scriptSrc: ['self', 'nonce-{NONCE}']
					},
					reportOnly: cspOptions.reportOnly
				})
			);
			this.logger.info('Content Security Policy applied successfully');
		} catch (configError) {
			this.handleHelmetError('applyContentSecurityPolicy', configError);
		}
	}

	public async applyExpectCT(app: Application): Promise<void> {
		try {
			app.use((req: Request, res: Response, next: NextFunction) => {
				res.setHeader('Expect-CT', 'enforce, max-age=86400');
				this.logger.info('Expect-CT header set successfully');
				next();
			});
		} catch (configError) {
			this.handleHelmetError('applyExpectCT', configError);
		}
	}

	public async applyPermissionsPolicy(app: Application): Promise<void> {
		if (
			permissionsPolicyOptions &&
			typeof permissionsPolicyOptions === 'object'
		) {
			app.use((req: Request, res: Response, next: NextFunction) => {
				try {
					const policies = Object.entries(permissionsPolicyOptions)
						.map(
							([feature, origins]) =>
								`${feature} ${origins.join(' ')}`
						)
						.join(', ');

					res.setHeader('Permissions-Policy', policies);
					this.logger.info(
						'Permissions-Policy header set successfully'
					);
					next();
				} catch (expressError) {
					this.handleHelmetExpressError(
						'Permissions-Policy Middleware',
						expressError,
						req,
						res,
						next
					);
				}
			});
		} else {
			this.logger.warn(
				'Permissions-Policy options are not provided or invalid'
			);
		}
	}

	public async applyCrossOriginPolicies(app: Application): Promise<void> {
		try {
			this.logger.info('Applying Cross-Origin policies');

			app.use(helmet.crossOriginOpenerPolicy({ policy: 'same-origin' }));
			app.use(
				helmet.crossOriginResourcePolicy({ policy: 'same-origin' })
			);
			app.use(
				helmet.crossOriginEmbedderPolicy({ policy: 'require-corp' })
			);

			this.logger.info('Cross-Origin policies applied successfully');
		} catch (configError) {
			this.handleHelmetError('applyCrossOriginPolicies', configError);
		}
	}

	public async applyReferrerPolicy(app: Application): Promise<void> {
		try {
			this.logger.info('Applying Referrer-Policy');
			app.use(helmet.referrerPolicy({ policy: 'same-origin' }));
			this.logger.info('Referrer-Policy applied successfully');
		} catch (configError) {
			this.handleHelmetError('applyReferrerPolicy', configError);
		}
	}

	public async applyXssFilter(app: Application): Promise<void> {
		try {
			this.logger.info('Applying XSS Filter');
			app.use(helmet.xssFilter());
			this.logger.info('XSS Filter applied successfully');
		} catch (configError) {
			this.handleHelmetError('applyXssFilter', configError);
		}
	}

	public async shutdown(): Promise<void> {
		try {
			this.logger.info('Shutting down Helmet middleware service...');
			HelmetMiddlewareService.instance = null;
			this.logger.info('Helmet middleware service has been shut down.');
		} catch (error) {
			this.errorLogger.logError(
				`Error shutting down Helmet middleware service: ${error instanceof Error ? error.message : error}`
			);
		}
	}

	private handleHelmetError(method: string, error: unknown): void {
		const configurationError =
			new this.errorHandler.ErrorClasses.ConfigurationError(
				`Failed to apply security headers in ${method}: ${error instanceof Error ? error.message : 'Unknown error'}`,
				{ exposeToClient: false }
			);
		this.errorLogger.logWarn(configurationError.message);
		this.errorHandler.handleError({ error: configurationError });
	}

	private handleHelmetExpressError(
		middleware: string,
		error: unknown,
		req: Request,
		res: Response,
		next: NextFunction
	): void {
		const expressMiddlewareError =
			new this.errorHandler.ErrorClasses.ExpressError(
				`Error occurred in ${middleware}: ${error instanceof Error ? error.message : String(error)}`,
				{ exposeToClient: false }
			);
		this.errorLogger.logError(expressMiddlewareError.message);
		this.errorHandler.expressErrorHandler()(
			expressMiddlewareError,
			req,
			res,
			next
		);
	}
}
