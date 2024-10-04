import express, {
	Application,
	NextFunction,
	Request,
	Response,
	Router
} from 'express';
import { APIRouter } from './APIRouter';
import { HealthRouter } from './HealthRouter';
import { StaticRouter } from './StaticRouter';
import { TestRouter } from './TestRouter';
import { ServiceFactory } from '../index/factory';
import {
	AppLoggerServiceInterface,
	BaseRouterInterface,
	CacheServiceInterface,
	EnvConfigServiceInterface,
	ErrorHandlerServiceInterface,
	ErrorLoggerServiceInterface,
	GatekeeperServiceInterface,
	HelmetMiddlwareServiceInterface,
	JWTAuthMiddlewareServiceInterface,
	PassportAuthMiddlewareServiceInterface
} from '../index/interfaces/services';
import { sanitizeRequestBody } from '../utils/validator';
import { validateDependencies } from '../utils/helpers';
import { withRetry } from '../utils/helpers';
import compression from 'compression';
import hpp from 'hpp';
import passport from 'passport';
import xss from 'xss';

export class BaseRouter implements BaseRouterInterface {
	private static instance: BaseRouter | null = null;

	protected router: Router;

	protected logger: AppLoggerServiceInterface;
	protected errorLogger: ErrorLoggerServiceInterface;
	protected errorHandler: ErrorHandlerServiceInterface;
	protected envConfig: EnvConfigServiceInterface;
	protected cacheService: CacheServiceInterface;
	protected gatekeeperService: GatekeeperServiceInterface;
	protected helmetService: HelmetMiddlwareServiceInterface;
	protected JWTMiddleware: JWTAuthMiddlewareServiceInterface;
	protected passportMiddleware: PassportAuthMiddlewareServiceInterface;

	protected apiRouteTable: Record<string, Record<string, string>> = {};
	protected healthRouteTable: Record<string, Record<string, string>> = {};
	protected staticRouteTable: Record<string, Record<string, string>> = {};
	protected testRouteTable: Record<string, Record<string, string>> = {};

	protected constructor(
		logger: AppLoggerServiceInterface,
		errorLogger: ErrorLoggerServiceInterface,
		errorHandler: ErrorHandlerServiceInterface,
		envConfig: EnvConfigServiceInterface,
		cacheService: CacheServiceInterface,
		gatekeeperService: GatekeeperServiceInterface,
		helmetService: HelmetMiddlwareServiceInterface,
		JWTMiddleware: JWTAuthMiddlewareServiceInterface,
		passportMiddleware: PassportAuthMiddlewareServiceInterface
	) {
		this.router = express.Router();
		this.logger = logger;
		this.errorLogger = errorLogger;
		this.errorHandler = errorHandler;
		this.envConfig = envConfig;
		this.cacheService = cacheService;
		this.gatekeeperService = gatekeeperService;
		this.helmetService = helmetService;
		this.JWTMiddleware = JWTMiddleware;
		this.passportMiddleware = passportMiddleware;
	}

	public static async getInstance(): Promise<BaseRouter> {
		if (!BaseRouter.instance) {
			BaseRouter.instance = new BaseRouter(
				await ServiceFactory.getLoggerService(),
				await ServiceFactory.getErrorLoggerService(),
				await ServiceFactory.getErrorHandlerService(),
				await ServiceFactory.getEnvConfigService(),
				await ServiceFactory.getCacheService(),
				await ServiceFactory.getGatekeeperService(),
				await ServiceFactory.getHelmetMiddlewareService(),
				await ServiceFactory.getJWTAuthMiddlewareService(),
				await ServiceFactory.getPassportAuthMiddlewareService()
			);
			await BaseRouter.instance.initializeBaseRouter();
		}

		return BaseRouter.instance;
	}

	public getRouter(): Router {
		return this.router;
	}

	private async initializeBaseRouter(): Promise<void> {
		await withRetry(
			async () => {
				this.router = express.Router();
				await this.loadRouteTables();
				await this.applyMiddlewares();
				this.setUpRoutes();
			},
			10,
			250,
			true
		);
	}

	private async loadRouteTables(): Promise<void> {
		const apiRouteTable = (await import('../config/routeTables'))
			.apiRouteTable;
		const healthRoutes = (await import('../config/routeTables'))
			.healthRouteTable;
		const staticRoutes = (await import('../config/routeTables'))
			.staticRouteTable;
		const testRoutes = (await import('../config/routeTables'))
			.testRouteTable;

		this.apiRouteTable = apiRouteTable;
		this.healthRouteTable = healthRoutes;
		this.staticRouteTable = staticRoutes;
		this.testRouteTable = testRoutes;
	}

	private setUpRoutes(): void {
		this.router.all('*', this.asyncHandler(this.routeHandler.bind(this)));
	}

	private async routeHandler(
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<void> {
		const method = req.method;
		const path = req.path;
		try {
			if (
				this.staticRouteTable[path] &&
				this.staticRouteTable[path][method]
			) {
				return await this.handleRoute(
					this.staticRouteTable[path][method],
					req,
					res,
					next
				);
			}

			if (this.apiRouteTable[path] && this.apiRouteTable[path][method]) {
				return await this.handleRoute(
					this.apiRouteTable[path][method],
					req,
					res,
					next
				);
			}

			if (
				this.healthRouteTable[path] &&
				this.healthRouteTable[path][method]
			) {
				return await this.handleRoute(
					this.healthRouteTable[path][method],
					req,
					res,
					next
				);
			}

			if (
				this.testRouteTable[path] &&
				this.testRouteTable[path][method] &&
				this.envConfig.getFeatureFlags().loadTestRoutes
			) {
				return await this.handleRoute(
					this.testRouteTable[path][method],
					req,
					res,
					next
				);
			}

			const staticRouterInstance =
				(await StaticRouter.getInstance()) as StaticRouter;
			await staticRouterInstance.serveNotFoundPage(req, res, next);
		} catch (error) {
			this.handleRouteError(error, req, res, next);
		}
	}

	private async handleRoute(
		routerName: string,
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<void> {
		await withRetry(
			async () => {
				switch (routerName) {
					case 'staticRouter':
						(await StaticRouter.getInstance()).getRouter()(
							req,
							res,
							next
						);
						break;
					case 'apiRouter':
						(await APIRouter.getInstance()).getRouter()(
							req,
							res,
							next
						);
						break;
					case 'healthRouter':
						(await HealthRouter.getInstance()).getRouter()(
							req,
							res,
							next
						);
						break;
					case 'testRouter':
						(await TestRouter.getInstance()).getRouter()(
							req,
							res,
							next
						);
						break;
					default:
						res.status(500).json({
							message: 'Internal server error'
						});
						next();
				}
			},
			5,
			250,
			true
		).catch(error => {
			this.logger.error(`Failed to handle route: ${error}`);
			res.status(500).json({
				message: 'Failed to handle route after multiple attempts'
			});
			next();
		});
	}

	private async applyMiddlewares(): Promise<void> {
		const app = express();

		this.applyErrorHandler();
		this.applySanitization();
		this.applyGatekeeper();
		this.applySecurityHeaders(app);
		this.applyCompression();
		this.applyPassportAndJWTAuth();
	}

	private applyCompression(): void {
		this.router.use(compression());
	}

	private applyGatekeeper(): void {
		this.router.use(this.gatekeeperService.rateLimitMiddleware());
		this.router.use(this.gatekeeperService.slowdownMiddleware());
		this.router.use(this.gatekeeperService.ipBlacklistMiddleware());
	}

	private applyPassportAndJWTAuth(): void {
		this.router.use(
			this.asyncHandler(async (req, res, next) => {
				const passportDeps = {
					passport,
					authenticateOptions: { session: false },
					validateDependencies
				};

				this.passportMiddleware.initializePassportAuthMiddleware(
					passportDeps
				);
				passport.session();
				this.JWTMiddleware.initializeJWTAuthMiddleware();
				next();
			})
		);
	}

	private applySanitization(): void {
		this.router.use(
			this.asyncHandler(
				async (req: Request, res: Response, next: NextFunction) => {
					req.body = await sanitizeRequestBody(req.body);

					for (const key in req.query) {
						if (req.query.hasOwnProperty(key)) {
							req.query[key] = xss(req.query[key] as string);
						}
					}

					for (const key in req.params) {
						if (req.params.hasOwnProperty(key)) {
							req.params[key] = xss(req.params[key]);
						}
					}

					next();
				}
			)
		);
	}

	private async applySecurityHeaders(app: Application): Promise<void> {
		try {
			await withRetry(
				() => this.helmetService.initializeHelmetMiddleware(app),
				3,
				1000
			);
			this.router.use(hpp());
		} catch (error) {
			this.errorLogger.logError('Failed to initialize Helmet middleware');
			this.handleRouteError(
				error,
				{} as Request,
				{} as Response,
				{} as NextFunction
			);
		}
	}

	protected asyncHandler = (
		fn: (
			req: Request,
			res: Response,
			next: NextFunction
		) => Promise<void | Response>
	): ((req: Request, res: Response, next: NextFunction) => void) => {
		return (req: Request, res: Response, next: NextFunction) => {
			fn(req, res, next).catch(next);
		};
	};

	public async shutdown(): Promise<void> {
		try {
			this.logger.info('Shutting down Base Router...');

			this.logger.info('Clearing API Router cache...');
			await this.cacheService.clearNamespace('userLogin');
			await this.cacheService.clearNamespace('recoverPassword');
			await this.cacheService.clearNamespace('generateTOTP');
			await this.cacheService.clearNamespace('generateEmailMFA');
			this.logger.info('APIRouter cache cleared successfully.');

			this.logger.info('Clearing Static Router cache...');
			await this.cacheService.clearNamespace('static-files');
			this.logger.info('StaticRouter cache cleared successfully.');

			this.logger.info('Clearing Health Router cache...');
			await this.cacheService.clearNamespace('healthCheck');
			this.logger.info('HealthRouter cache cleared successfully.');

			if (
				this.envConfig.getFeatureFlags().loadTestRoutes &&
				this.envConfig.getEnvVariable('nodeEnv') !== 'production'
			) {
				this.logger.info('Clearing Test Router cache...');
				await this.cacheService.clearNamespace('test');
				this.logger.info('TestRouter cache cleared successfully.');
			}

			this.logger.info(
				'Base Router extension caches cleared. Completing shutdown process'
			);
			BaseRouter.instance = null;
			this.logger.info('Base Router shutdown complete.');
		} catch (error) {
			const utilityError =
				new this.errorHandler.ErrorClasses.UtilityErrorRecoverable(
					`Error during APIRouter shutdown: ${error instanceof Error ? error.message : error}`
				);
			this.errorLogger.logError(utilityError.message);
			this.errorHandler.handleError({ error: utilityError });
		}
	}

	protected handleRouteError(
		error: unknown,
		req: Request,
		res: Response,
		next: NextFunction
	): void {
		const expressError = new this.errorHandler.ErrorClasses.ExpressError(
			`Route error: ${error instanceof Error ? error.message : 'Unknown error'}`,
			{ exposeToClient: false }
		);
		this.errorLogger.logError(expressError.message);
		this.errorHandler.expressErrorHandler()(expressError, req, res, next);
	}

	private applyErrorHandler(): void {
		this.router.use(
			(err: unknown, req: Request, res: Response, next: NextFunction) => {
				this.errorHandler.expressErrorHandler()(
					err as Error,
					req,
					res,
					next
				);
			}
		);
	}
}
