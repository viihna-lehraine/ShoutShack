import express, {
	Application,
	NextFunction,
	Request,
	Response,
	Router
} from 'express';
import { check } from 'express-validator';
import { promises as fs } from 'fs';
import {
	AccessControlMiddlewareServiceInterface,
	AppLoggerServiceInterface,
	AuthControllerInterface,
	BaseRouterInterface,
	CacheServiceInterface,
	CSRFMiddlewareServiceInterface,
	EnvConfigServiceInterface,
	ErrorHandlerServiceInterface,
	ErrorLoggerServiceInterface,
	FileTypeRecords,
	GatekeeperServiceInterface,
	HealthCheckServiceInterface,
	HelmetMiddlewareServiceInterface,
	JWTAuthMiddlewareServiceInterface,
	PassportAuthMiddlewareServiceInterface,
	StaticRouterInterface,
	UserControllerInterface
} from '../index/interfaces/main';
import path from 'path';
import { sanitizeRequestBody } from '../utils/validator';
import { validateDependencies } from '../utils/helpers';
import compression from 'compression';
import hpp from 'hpp';
import passport from 'passport';
import xss from 'xss';
import { serviceTTLConfig } from '../config/cache';
import { handleValidationErrors } from '../utils/validator';
import { withRetry } from '../utils/helpers';
import { fileCacheTTLConfig } from '../config/cache';
import { AccessControlMiddlewareFactory } from '../index/factory/subfactories/AccessControlMiddlewareFactory';
import { AuthControllerFactory } from '../index/factory/subfactories/AuthControllerFactory';
import { ErrorHandlerServiceFactory } from '../index/factory/subfactories/ErrorHandlerServiceFactory';
import { EnvConfigServiceFactory } from '../index/factory/subfactories/EnvConfigServiceFactory';
import { CacheLayerServiceFactory } from '../index/factory/subfactories/CacheLayerServiceFactory';
import { GatekeeperServiceFactory } from '../index/factory/subfactories/GatekeeperServiceFactory';
import { HealthCheckServiceFactory } from '../index/factory/subfactories/HealthCheckServiceFactory';
import { LoggerServiceFactory } from '../index/factory/subfactories/LoggerServiceFactory';
import { MiddlewareFactory } from '../index/factory/subfactories/MiddlewareFactory';
import { UserControllerFactory } from '../index/factory/subfactories/UserControllerFactory';

export class BaseRouter implements BaseRouterInterface {
	private static instance: BaseRouter | null = null;

	protected router: Router;

	protected logger: AppLoggerServiceInterface;
	protected errorLogger: ErrorLoggerServiceInterface;
	protected errorHandler: ErrorHandlerServiceInterface;
	protected envConfig: EnvConfigServiceInterface;
	protected cacheService: CacheServiceInterface;
	protected gatekeeperService: GatekeeperServiceInterface;
	protected helmetService: HelmetMiddlewareServiceInterface;
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
		helmetService: HelmetMiddlewareServiceInterface,
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
				await LoggerServiceFactory.getLoggerService(),
				await LoggerServiceFactory.getErrorLoggerService(),
				await ErrorHandlerServiceFactory.getErrorHandlerService(),
				await EnvConfigServiceFactory.getEnvConfigService(),
				await CacheLayerServiceFactory.getCacheService(),
				await GatekeeperServiceFactory.getGatekeeperService(),
				await MiddlewareFactory.getHelmetMiddleware(),
				await MiddlewareFactory.getJWTAuthMiddleware(),
				await MiddlewareFactory.getPassportAuthMiddleware()
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

export class APIRouter extends BaseRouter {
	private userController?: UserControllerInterface;
	private authController?: AuthControllerInterface;

	public constructor(
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
		this.setUpAPIRoutes();
	}

	private async getUserController(): Promise<UserControllerInterface> {
		if (!this.userController) {
			this.userController =
				await UserControllerFactory.getUserController();
		}
		return this.userController;
	}

	private async getAuthController(): Promise<AuthControllerInterface> {
		if (!this.authController) {
			this.authController =
				await AuthControllerFactory.getAuthController();
		}
		return this.authController;
	}

	private setUpAPIRoutes(): void {
		this.router.post(
			'/register.html',
			[
				check('username')
					.isLength({ min: 3 })
					.withMessage('Username must be at least 3 characters long')
					.trim()
					.escape(),
				check('email')
					.isEmail()
					.withMessage('Please provide a valid email address')
					.normalizeEmail(),
				check('password')
					.isLength({ min: 8 })
					.withMessage('Password must be at least 8 characters long')
					.matches(/[A-Z]/)
					.withMessage(
						'Password must contain at least one uppercase letter'
					)
					.matches(/[a-z]/)
					.withMessage(
						'Password must contain at least one lowercase letter'
					)
					.matches(/\d/)
					.withMessage('Password must contain at least one digit')
					.matches(/[^\w\s]/)
					.withMessage(
						'Password must contain at least one special character'
					),
				check('confirmPassword')
					.custom((value, { req }) => value === req.body.password)
					.withMessage('Passwords do not match'),
				handleValidationErrors
			],
			this.asyncHandler(
				async (req: Request, res: Response, next: NextFunction) => {
					try {
						const userController = await this.getUserController();
						const result = await userController.createUser(
							req.body
						);
						return res.json(result);
					} catch (err) {
						next(err);
						return;
					}
				}
			)
		);

		this.router.post(
			'/login',
			[
				check('email')
					.isEmail()
					.withMessage('Please provide a valid email address')
					.normalizeEmail(),
				check('password')
					.notEmpty()
					.withMessage('Password is required'),
				handleValidationErrors
			],
			this.asyncHandler(
				async (req: Request, res: Response, next: NextFunction) => {
					const cacheKey = `login:${req.body.email}`;
					const cachedResponse = await this.cacheService.get(
						cacheKey,
						'userLogin'
					);
					if (cachedResponse) {
						return res.json(cachedResponse);
					}

					try {
						const authController = await this.getAuthController();
						const result = await authController.loginUser(
							req.body.email,
							req.body.password
						);
						await this.cacheService.set(
							cacheKey,
							result,
							'userLogin',
							3600
						);
						return res.json(result);
					} catch (err) {
						next(err);
						return;
					}
				}
			)
		);

		this.router.post(
			'/recover-password',
			[
				check('email')
					.isEmail()
					.withMessage('Please provide a valid email address')
					.normalizeEmail(),
				handleValidationErrors
			],
			this.asyncHandler(
				async (req: Request, res: Response, next: NextFunction) => {
					const cacheKey = `recover-password:${req.body.email}`;
					const cachedResponse = await this.cacheService.get(
						cacheKey,
						'recoverPassword'
					);
					if (cachedResponse) {
						return res.json(cachedResponse);
					}

					try {
						const authController = await this.getAuthController();
						await authController.recoverPassword(req.body.email);
						const response = {
							message: 'Password recovery email sent'
						};
						await this.cacheService.set(
							cacheKey,
							response,
							'recoverPassword',
							3600
						);
						return res.json(response);
					} catch (err) {
						this.errorLogger.logError('Password recovery failed');
						next(err);
						return;
					}
				}
			)
		);

		this.router.post(
			'/generate-totp',
			[
				check('userId').notEmpty().withMessage('User ID is required'),
				handleValidationErrors
			],
			this.asyncHandler(
				async (req: Request, res: Response, next: NextFunction) => {
					const cacheKey = `generate-totp:${req.body.userId}`;
					const cachedResponse = await this.cacheService.get(
						cacheKey,
						'generateTOTP'
					);
					if (cachedResponse) {
						return res.json(cachedResponse);
					}

					try {
						const authController = await this.getAuthController();
						const result = await authController.generateTOTP(
							req.body.userId
						);
						await this.cacheService.set(
							cacheKey,
							result,
							'generateTOTP',
							3600
						);
						return res.json(result);
					} catch (err) {
						this.errorLogger.logError('TOTP generation failed');
						next(err);
						return;
					}
				}
			)
		);

		this.router.post(
			'/verify-totp',
			[
				check('userId').notEmpty().withMessage('User ID is required'),
				check('token').notEmpty().withMessage('Token is required'),
				handleValidationErrors
			],
			this.asyncHandler(
				async (req: Request, res: Response, next: NextFunction) => {
					try {
						const authController = await this.getAuthController();
						const isValid = await authController.verifyTOTP(
							req.body.userId,
							req.body.token
						);
						return res.json({ isValid });
					} catch (err) {
						this.errorLogger.logError('TOTP verification failed');
						next(err);
						return;
					}
				}
			)
		);

		this.router.post(
			'/generate-email-mfa',
			[
				check('email')
					.isEmail()
					.withMessage('Please provide a valid email address')
					.normalizeEmail(),
				handleValidationErrors
			],
			this.asyncHandler(
				async (req: Request, res: Response, next: NextFunction) => {
					const cacheKey = `generate-email-mfa:${req.body.email}`;
					const cachedResponse = await this.cacheService.get(
						cacheKey,
						'generateEmailMFA'
					);
					if (cachedResponse) {
						return res.json(cachedResponse);
					}

					try {
						const authController = await this.getAuthController();
						await authController.generateEmailMFACode(
							req.body.email
						);
						const response = { message: 'MFA code sent' };
						await this.cacheService.set(
							cacheKey,
							response,
							'generateEmailMFA',
							3600
						);
						return res.json(response);
					} catch (err) {
						this.errorLogger.logError(
							'Email MFA generation failed'
						);
						next(err);
						return;
					}
				}
			)
		);

		this.router.post(
			'/verify-email-mfa',
			[
				check('email')
					.isEmail()
					.withMessage('Please provide a valid email address')
					.normalizeEmail(),
				check('emailMFACode')
					.notEmpty()
					.withMessage('MFA code is required'),
				handleValidationErrors
			],
			this.asyncHandler(
				async (req: Request, res: Response, next: NextFunction) => {
					try {
						const authController = await this.getAuthController();
						const isValid = await authController.verifyEmailMFACode(
							req.body.email,
							req.body.email2FACode
						);
						return res.json({ isValid });
					} catch (err) {
						this.errorLogger.logError(
							'Email 2FA verification failed'
						);
						next(err);
						return;
					}
				}
			)
		);
	}

	public getAPIRouter(): Router {
		return this.router;
	}
}

export class HealthRouter extends BaseRouter {
	private healthCheckService!: HealthCheckServiceInterface;
	private accessControl!: AccessControlMiddlewareServiceInterface;
	private csrfMiddleware!: CSRFMiddlewareServiceInterface;
	private cacheTTL: number = 300;

	public constructor(
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
		this.healthCheckService =
			await HealthCheckServiceFactory.getHealthCheckService();
		this.accessControl =
			await AccessControlMiddlewareFactory.getAccessControlMiddlewareService();
		this.csrfMiddleware = await MiddlewareFactory.getCSRFMiddleware();
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

export class StaticRouter extends BaseRouter implements StaticRouterInterface {
	private staticRootPath = this.envConfig.getEnvVariable('staticRootPath');

	private validCSSFiles: FileTypeRecords = {};
	private validFontFiles: FileTypeRecords = {};
	private validHTMLFiles: FileTypeRecords = {};
	private validIconFiles: FileTypeRecords = {};
	private validImageFiles: FileTypeRecords = {};
	private validJSFiles: FileTypeRecords = {};
	private validLogoFiles: FileTypeRecords = {};
	private validMDFiles: FileTypeRecords = {};
	private validTXTFiles: FileTypeRecords = {};
	private validXMLFiles: FileTypeRecords = {};

	private cssDirectory = path.join(this.staticRootPath, 'css');
	private fontDirectory = path.join(this.staticRootPath, 'assets/fonts');
	private htmlDirectory = this.staticRootPath;
	private iconDirectory = path.join(this.staticRootPath, 'assets/icons');
	private imageDirectory = path.join(this.staticRootPath, 'assets/images');
	private jsDirectory = path.join(this.staticRootPath, 'dist');
	private logoDirectory = path.join(this.staticRootPath, 'assets/logos');
	private mdDirectory = this.staticRootPath;
	private txtDirectory = this.staticRootPath;
	private xmlDirectory = this.staticRootPath;

	private forbiddenDirectories: string[] = [];
	private forbiddenExtensions: string[] = [];
	private forbiddenFiles: string[] = [];
	private validDirectories: string[] = [];
	private validExtensions: string[] = [];
	private cacheTTLs = fileCacheTTLConfig;

	public constructor(
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
	}

	public async initializeStaticRouter(): Promise<void> {
		withRetry(
			async () => {
				await this.importRules();
				await this.validateConfiguration();

				const routerRules = await import('../config/routerRules');
				const validationIntervals = routerRules.validationIntervals;

				this.setUpPeriodicValidation(
					this.cssDirectory,
					this.validCSSFiles,
					this.validCSSFiles,
					['.css'],
					validationIntervals.css
				);

				this.setUpPeriodicValidation(
					this.fontDirectory,
					this.validFontFiles,
					this.validFontFiles,
					['.ttf'],
					validationIntervals.font
				);

				this.setUpPeriodicValidation(
					this.htmlDirectory,
					this.validHTMLFiles,
					this.validHTMLFiles,
					['.html'],
					validationIntervals.html
				);

				this.setUpPeriodicValidation(
					this.iconDirectory,
					this.validIconFiles,
					this.validIconFiles,
					['.png'],
					validationIntervals.icon
				);

				this.setUpPeriodicValidation(
					this.imageDirectory,
					this.validImageFiles,
					this.validImageFiles,
					['.bmp', '.jpg', '.jpeg', '.png', '.gif', '.webp'],
					validationIntervals.image
				);

				this.setUpPeriodicValidation(
					this.jsDirectory,
					this.validJSFiles,
					this.validJSFiles,
					['.js'],
					validationIntervals.js
				);

				this.setUpPeriodicValidation(
					this.logoDirectory,
					this.validLogoFiles,
					this.validLogoFiles,
					['.svg'],
					validationIntervals.logo
				);

				this.setUpPeriodicValidation(
					this.mdDirectory,
					this.validMDFiles,
					this.validMDFiles,
					['.md'],
					validationIntervals.md
				);

				this.setUpPeriodicValidation(
					this.txtDirectory,
					this.validTXTFiles,
					this.validTXTFiles,
					['.txt'],
					validationIntervals.txt
				);

				this.setUpPeriodicValidation(
					this.xmlDirectory,
					this.validXMLFiles,
					this.validXMLFiles,
					['.xml'],
					validationIntervals.xml
				);
			},
			5,
			1000
		);
	}

	private async importRules(): Promise<void> {
		try {
			const routerRules = await import('../config/routerRules');

			this.forbiddenDirectories = routerRules.forbiddenDirectories;
			this.forbiddenExtensions = routerRules.forbiddenExtensions;
			this.forbiddenFiles = routerRules.forbiddenFiles;
			this.validDirectories = routerRules.validDirectories;
			this.validExtensions = routerRules.validExtensions;
			this.validCSSFiles = routerRules.validCSSFiles;
			this.validFontFiles = routerRules.validFontFiles;
			this.validHTMLFiles = routerRules.validHTMLFiles;
			this.validMDFiles = routerRules.validMDFiles;
			this.validTXTFiles = routerRules.validTXTFiles;
			this.validXMLFiles = routerRules.validXMLFiles;

			this.logger.info('Static Router rules imported successfully');
		} catch (error) {
			this.logger.error(
				`Failed to import router rules\n${Error instanceof Error ? error : 'Unknown error'}`
			);
		}
	}

	private async validateConfiguration(): Promise<void> {
		validateDependencies(
			[{ name: 'staticRootPath', instance: this.staticRootPath }],
			this.logger
		);

		if (!this.staticRootPath || typeof this.staticRootPath !== 'string') {
			throw new this.errorHandler.ErrorClasses.ConfigurationError(
				'Invalid staticRootPath: must be a non-empty string',
				{ exposeToClient: false }
			);
		}

		await withRetry(() => this.importRules(), 3, 1000);
	}

	public async handleRequest(
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<void> {
		const filePath = path.join(this.staticRootPath, req.path);

		if (req.path === '/') {
			await this.serveIndexFile(req, res, next);
		} else {
			await this.serveStaticFile(filePath, req.path, req, res, next);
		}
	}

	// *DEV-NOTE* this should work with Gatekeeper to track any IP that is making directory traversal attempts and act accordingly
	private async serveStaticFile(
		filePath: string,
		route: string,
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<void> {
		const cacheKey = this.getCacheKey(route);
		const fileExtension = path.extname(filePath);
		const cacheTTL = this.getCacheTTL(fileExtension);

		await withRetry(
			async () => {
				await this.blockForbiddenFiles(req, res, next);

				const cachedFile = await this.cacheService.get<string>(
					cacheKey,
					'static-files'
				);

				if (cachedFile) {
					this.logger.info(`Serving file from cache: ${cacheKey}`);
					res.send(cachedFile);
					return;
				}

				const resolvedPath = path.resolve(filePath);
				const allowedPath = path.resolve(this.staticRootPath);

				if (!resolvedPath.startsWith(allowedPath)) {
					this.logger.warn(
						`Attempted directory traversal by ${req.ip} to ${req.url}`
					);
					res.status(403).json({ message: 'Access denied' });
					return;
				}

				const ext = path.extname(resolvedPath);
				let serveFunction: (
					req: Request,
					res: Response,
					next: NextFunction
				) => Promise<void>;

				switch (ext) {
					case '.html':
						serveFunction = this.serveHTMLFile.bind(this);
						break;
					case '.css':
						serveFunction = this.serveCSSFile.bind(this);
						break;
					case '.js':
						serveFunction = this.serveJSFile.bind(this);
						break;
					case '.ico':
						serveFunction = this.serveIconFile.bind(this);
						break;
					case '.png':
					case '.jpg':
					case '.jpeg':
					case '.gif':
						serveFunction = this.serveImageFile.bind(this);
						break;
					case '.webp':
						serveFunction = this.serveLogoFile.bind(this);
						break;
					case '.md':
						serveFunction = this.serveMDFile.bind(this);
						break;
					case '.txt':
						serveFunction = this.serveTXTFile.bind(this);
						break;
					case '.xml':
						serveFunction = this.serveXMLFile.bind(this);
						break;
					default:
						serveFunction = this.serveNotFoundPage.bind(this);
				}

				try {
					await serveFunction(req, res, next);

					const fileContent =
						await this.readFileContent(resolvedPath);
					await this.cacheService.set(
						cacheKey,
						fileContent,
						'static-files',
						cacheTTL
					);

					this.logger.debug(
						`Served and cached static file: ${route} with TTL: ${cacheTTL} seconds`
					);
				} catch (error) {
					this.errorLogger.logError(
						`Error serving static file ${route}: ${
							error instanceof Error
								? error.message
								: 'Unknown error'
						}`
					);
					this.errorHandler.sendClientErrorResponse({
						message: `${route} not found`,
						statusCode: 404,
						res
					});
					next(error);
				}
			},
			3,
			500
		);
	}

	private getCacheTTL(fileExtension: string): number {
		return this.cacheTTLs[fileExtension] || this.cacheTTLs['default'];
	}

	private getCacheKey(route: string): string {
		return `static:${route}`;
	}

	private async readFileContent(filePath: string): Promise<string> {
		return await fs.readFile(filePath, 'utf8');
	}

	private async serveIndexFile(
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<void> {
		const indexFile = this.validHTMLFiles['index'];

		if (typeof indexFile !== 'string') {
			this.logger.warn(`Index page not found or invalid`);
			res.status(404).json({ message: 'Index page not found' });
			return;
		}

		const filePath = path.join(this.staticRootPath, indexFile);

		return new Promise<void>((resolve, reject) => {
			res.sendFile(filePath, error => {
				if (error) {
					this.errorLogger.logError(
						`Error serving index file ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`
					);
					this.errorHandler.sendClientErrorResponse({
						message: `${filePath} not found`,
						statusCode: 404,
						res
					});
					reject(error);
					return next(error);
				} else {
					this.logger.debug(`Served index file: ${filePath}`);
					resolve();
					return next();
				}
			});
		});
	}

	public async serveNotFoundPage(
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<void> {
		const notFoundPage = this.validHTMLFiles['notFound'];

		if (typeof notFoundPage !== 'string') {
			this.logger.warn(`not-found.html file is missing`);
			res.status(404).json({ message: 'Page not found' });
			return;
		}

		const filePath = path.join(this.staticRootPath, notFoundPage);
		await this.serveStaticFile(filePath, 'not-found', req, res, next);
	}

	private async serveCSSFile(
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<void> {
		const cssFile = req.params.file;

		if (typeof cssFile !== 'string') {
			this.logger.warn(
				`CSS file not found or invalid: ${req.params.filename}`
			);
		}

		const filePath = path.join(this.cssDirectory, cssFile);

		return new Promise<void>((resolve, reject) => {
			res.sendFile(filePath, error => {
				if (error) {
					this.errorLogger.logError(
						`Error serving CSS file ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`
					);
					this.errorHandler.sendClientErrorResponse({
						message: `${filePath} not found`,
						statusCode: 404,
						res
					});
					reject(error);
					return next(error);
				} else {
					this.logger.debug(`Served CSS file: ${filePath}`);
					resolve();
					return next();
				}
			});
		});
	}

	private async serveHTMLFile(
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<void> {
		const page = req.params.page;
		const filePathEntry = this.validHTMLFiles[page];

		if (typeof filePathEntry !== 'string') {
			this.logger.warn(`HTML page not found: ${page}`);
			await this.serveNotFoundPage(req, res, next);
			return;
		}

		const filePath = path.join(this.staticRootPath, filePathEntry);

		return new Promise<void>((resolve, reject) => {
			res.sendFile(filePath, async error => {
				if (error) {
					this.errorLogger.logError(
						`Error serving HTML file ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`
					);
					await this.serveNotFoundPage(req, res, next);
					reject(error);
					next(error);
				} else {
					this.logger.debug(`Served HTML file: ${filePath}`);
					resolve();
					next();
				}
			});
		});
	}

	private async serveIconFile(
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<void> {
		const imageFile = this.validImageFiles[req.params.filename];

		if (typeof imageFile !== 'string') {
			this.logger.warn(
				`Icon file not found or invalid: ${req.params.filename}`
			);

			res.status(404).json({ message: 'Logo file not found' });
			return;
		}

		const filePath = path.join(this.imageDirectory, imageFile);

		return new Promise<void>((resolve, reject) => {
			res.sendFile(filePath, error => {
				if (error) {
					this.errorLogger.logError(
						`Error serving icon file ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`
					);
					this.errorHandler.sendClientErrorResponse({
						message: `${filePath} not found`,
						statusCode: 404,
						res
					});
					reject(error);
					return next(error);
				} else {
					this.logger.debug(`Served icon file: ${filePath}`);
					resolve();
					return next();
				}
			});
		});
	}

	private async serveImageFile(
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<void> {
		const imageFile = this.validImageFiles[req.params.filename];

		if (typeof imageFile !== 'string') {
			this.logger.warn(
				`Image file not found or invalid: ${req.params.filename}`
			);
			res.status(404).json({ message: 'Image file not found' });
			return;
		}

		const filePath = path.join(this.imageDirectory, imageFile);

		return new Promise<void>((resolve, reject) => {
			res.sendFile(filePath, error => {
				if (error) {
					this.errorLogger.logError(
						`Error serving image file ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`
					);
					this.errorHandler.sendClientErrorResponse({
						message: `${filePath} not found`,
						statusCode: 404,
						res
					});
					reject(error);
					return next(error);
				} else {
					this.logger.debug(`Served image file: ${filePath}`);
					resolve();
					return next();
				}
			});
		});
	}

	private async serveJSFile(
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<void> {
		const imageFile = this.validImageFiles[req.params.filename];

		if (typeof imageFile !== 'string') {
			this.logger.warn(
				`Javascript file not found or invalid: ${req.params.filename}`
			);
			res.status(404).json({ message: 'Javascript file not found' });
			return;
		}

		const filePath = path.join(this.imageDirectory, imageFile);

		return new Promise<void>((resolve, reject) => {
			res.sendFile(filePath, error => {
				if (error) {
					this.errorLogger.logError(
						`Error serving javascript file ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`
					);
					this.errorHandler.sendClientErrorResponse({
						message: `${filePath} not found`,
						statusCode: 404,
						res
					});
					reject(error);
					return next(error);
				} else {
					this.logger.debug(`Served javascript file: ${filePath}`);
					resolve();
					return next();
				}
			});
		});
	}

	private async serveLogoFile(
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<void> {
		const imageFile = this.validImageFiles[req.params.filename];

		if (typeof imageFile !== 'string') {
			this.logger.warn(
				`Image file not found or invalid: ${req.params.filename}`
			);
			res.status(404).json({ message: 'Image file not found' });
			return;
		}

		const filePath = path.join(this.imageDirectory, imageFile);

		return new Promise<void>((resolve, reject) => {
			res.sendFile(filePath, error => {
				if (error) {
					this.errorLogger.logError(
						`Error serving image file ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`
					);
					this.errorHandler.sendClientErrorResponse({
						message: `${filePath} not found`,
						statusCode: 404,
						res
					});
					reject(error);
					return next(error);
				} else {
					this.logger.debug(`Served logo file: ${filePath}`);
					resolve();
					return next();
				}
			});
		});
	}

	private async serveMDFile(
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<void> {
		const jsFile = this.validJSFiles[req.params.filename];

		if (typeof jsFile !== 'string') {
			this.logger.warn(
				`Markdown file not found or invalid: ${req.params.filename}`
			);
			res.status(404).json({ message: 'Markdown file not found' });
			return;
		}

		const filePath = path.join(this.jsDirectory, jsFile);

		return new Promise<void>((resolve, reject) => {
			res.sendFile(filePath, error => {
				if (error) {
					this.errorLogger.logError(
						`Error serving markdown file ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`
					);
					this.errorHandler.sendClientErrorResponse({
						message: `${filePath} not found`,
						statusCode: 404,
						res
					});
					reject(error);
					return next(error);
				} else {
					this.logger.debug(`Served markdown file: ${filePath}`);
					resolve();
					return next();
				}
			});
		});
	}

	private async serveTXTFile(
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<void> {
		const jsFile = this.validJSFiles[req.params.filename];

		if (typeof jsFile !== 'string') {
			this.logger.warn(
				`Text file not found or invalid: ${req.params.filename}`
			);
			res.status(404).json({ message: 'Text file not found' });
			return;
		}

		const filePath = path.join(this.jsDirectory, jsFile);

		return new Promise<void>((resolve, reject) => {
			res.sendFile(filePath, error => {
				if (error) {
					this.errorLogger.logError(
						`Error serving text file ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`
					);
					this.errorHandler.sendClientErrorResponse({
						message: `${filePath} not found`,
						statusCode: 404,
						res
					});
					reject(error);
					return next(error);
				} else {
					this.logger.debug(`Served text file: ${filePath}`);
					resolve();
					return next();
				}
			});
		});
	}

	private async serveXMLFile(
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<void> {
		const jsFile = this.validJSFiles[req.params.filename];

		if (typeof jsFile !== 'string') {
			this.logger.warn(
				`XML file not found or invalid: ${req.params.filename}`
			);
			res.status(404).json({ message: 'Text file not found' });
			return;
		}

		const filePath = path.join(this.jsDirectory, jsFile);

		return new Promise<void>((resolve, reject) => {
			res.sendFile(filePath, error => {
				if (error) {
					this.errorLogger.logError(
						`Error serving XML file ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`
					);
					this.errorHandler.sendClientErrorResponse({
						message: `${filePath} not found`,
						statusCode: 404,
						res
					});
					reject(error);
					return next(error);
				} else {
					this.logger.debug(`Served XML file: ${filePath}`);
					resolve();
					return next();
				}
			});
		});
	}

	private validateFiles(
		directory: string,
		fileRecord: FileTypeRecords,
		allowedFiles: FileTypeRecords,
		validExtensions: string[]
	): void {
		try {
			const validFiles = Object.keys(allowedFiles);
			const filesInDirectory = Object.keys(fileRecord);

			filesInDirectory.forEach(file => {
				const filePaths = Array.isArray(fileRecord[file])
					? fileRecord[file]
					: [fileRecord[file]];

				filePaths.forEach(filePath => {
					const ext = path.extname(filePath as string);

					if (
						!validFiles.includes(filePath as string) ||
						!validExtensions.includes(ext)
					) {
						this.logger.warn(
							`Invalid or forbidden file detected in ${directory}: ${filePath}`
						);
					}
				});
			});

			this.logger.info(`Validation completed for ${directory}`);
		} catch (error) {
			this.logger.error(
				`Error validating files in directory ${directory}: ${
					error instanceof Error ? error.message : 'Unknown error'
				}`
			);
		}
	}

	private setUpPeriodicValidation(
		directory: string,
		fileRecord: FileTypeRecords,
		allowedFiles: FileTypeRecords,
		validExtensions: string[],
		intervalMs: number
	): void {
		try {
			this.validateFiles(
				directory,
				fileRecord,
				allowedFiles,
				validExtensions
			);

			setInterval(() => {
				this.validateFiles(
					directory,
					fileRecord,
					allowedFiles,
					validExtensions
				);
				this.logger.info(
					`Periodic validation completed for ${directory}`
				);
			}, intervalMs);
		} catch (error) {
			this.logger.error(
				`Error setting up periodic validation for directory ${directory}: ${
					error instanceof Error ? error.message : 'Unknown error'
				}`
			);
		}
	}

	private async blockForbiddenFiles(
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<void> {
		const filePath = path.normalize(req.url);
		const resolvedPath = path.resolve(this.staticRootPath, filePath);
		const isForbiddenDirectory = this.forbiddenDirectories.some(dir =>
			resolvedPath.includes(path.resolve(this.staticRootPath, dir))
		);

		if (isForbiddenDirectory) {
			this.logger.warn(
				`Attempted access to forbidden directory: ${req.url}`
			);
			res.status(403).json({ message: 'Access denied' });

			return;
		}

		const isValidDirectory = this.validDirectories.some(dir =>
			resolvedPath.includes(path.resolve(this.staticRootPath, dir))
		);

		if (!isValidDirectory) {
			this.logger.warn(
				`Attempted access to invalid directory: ${req.url}`
			);
			res.status(403).json({ message: 'Access denied' });

			return;
		}

		const filename = path.basename(filePath);
		const fileExt = path.extname(filename);

		if (this.forbiddenFiles.includes(filename)) {
			this.logger.warn(`Attempted access to forbidden file: ${filename}`);
			res.status(403).json({ message: 'Access denied' });

			return;
		}

		if (this.forbiddenExtensions.includes(fileExt)) {
			this.logger.warn(
				`Attempted access to forbidden file extension: ${fileExt}`
			);
			res.status(403).json({ message: 'Access denied' });

			return;
		}

		const isValidExtension = this.validExtensions.includes(fileExt);

		if (!isValidExtension) {
			this.logger.warn(
				`Attempted access to invalid file extension: ${fileExt}`
			);
			res.status(403).json({ message: 'Access denied' });

			return;
		}

		next();
	}
}

export class TestRouter extends BaseRouter {
	private nodeEnv = this.envConfig.getEnvVariable('nodeEnv');

	public constructor(
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
		this.nodeEnv = this.envConfig.getEnvVariable('nodeEnv');
		this.setUpTestRoutes();
	}

	private setUpTestRoutes(): void {
		if (this.nodeEnv === 'production') {
			this.router.use((_req: Request, res: Response) => {
				this.logger.info(
					'Test route accessed in production environment.'
				);
				res.status(404).json({
					message: 'Test routes are not available in production.'
				});
			});
		} else {
			this.router.connect('/test', this.testConnectRoute.bind(this));
			this.router.delete('/test', this.testDeleteRoute.bind(this));
			this.router.get('/test', this.testGetRoute.bind(this));
			this.router.head('/test', this.testHeadRoute.bind(this));
			this.router.options('/test', this.testOptionsRoute.bind(this));
			this.router.patch('/test', this.testPatchRoute.bind(this));
			this.router.post('/test', this.testPostRoute.bind(this));
			this.router.put('/test', this.testPutRoute.bind(this));
			this.router.trace('/test', this.testTraceRoute.bind(this));
		}

		this.router.use(this.handleTestRouteErrors.bind(this));
	}

	private testConnectRoute(
		req: Request,
		res: Response,
		next: NextFunction
	): void {
		try {
			this.logger.info('Test route accessed.');
			res.send('Test route is working!');
		} catch (error) {
			this.handleRouteError(error, req, res, next);
		}
	}

	private testDeleteRoute(
		req: Request,
		res: Response,
		next: NextFunction
	): void {
		try {
			this.logger.info('DELETE Test route accessed.');
			res.send('DELETE Test route is working!');
		} catch (error) {
			this.handleRouteError(error, req, res, next);
		}
	}

	private testGetRoute(
		req: Request,
		res: Response,
		next: NextFunction
	): void {
		try {
			this.logger.info('Test route accessed.');
			res.send('Test route is working!');
		} catch (error) {
			this.handleRouteError(error, req, res, next);
		}
	}

	private testHeadRoute(
		req: Request,
		res: Response,
		next: NextFunction
	): void {
		try {
			this.logger.info('Test route accessed.');
			res.send('Test route is working!');
		} catch (error) {
			this.handleRouteError(error, req, res, next);
		}
	}

	private testOptionsRoute(
		req: Request,
		res: Response,
		next: NextFunction
	): void {
		try {
			this.logger.info('Test route accessed.');
			res.send('Test route is working!');
		} catch (error) {
			this.handleRouteError(error, req, res, next);
		}
	}

	private testPatchRoute(
		req: Request,
		res: Response,
		next: NextFunction
	): void {
		try {
			this.logger.info('Test route accessed.');
			res.send('Test route is working!');
		} catch (error) {
			this.handleRouteError(error, req, res, next);
		}
	}

	private testPostRoute(
		req: Request,
		res: Response,
		next: NextFunction
	): void {
		try {
			this.logger.info('POST Test route accessed.');
			res.send('POST Test route is working!');
		} catch (error) {
			this.handleRouteError(error, req, res, next);
		}
	}

	private testPutRoute(
		req: Request,
		res: Response,
		next: NextFunction
	): void {
		try {
			this.logger.info('PUT Test route accessed.');
			res.send('PUT Test route is working!');
		} catch (error) {
			this.handleRouteError(error, req, res, next);
		}
	}

	private testTraceRoute(
		req: Request,
		res: Response,
		next: NextFunction
	): void {
		try {
			this.logger.info('Test route accessed.');
			res.send('Test route is working!');
		} catch (error) {
			this.handleRouteError(error, req, res, next);
		}
	}

	private handleTestRouteErrors(
		error: unknown,
		req: Request,
		res: Response,
		next: NextFunction
	): void {
		if (error instanceof Error) {
			this.logger.error('Unexpected error on test route');
			this.errorHandler.expressErrorHandler()(error, req, res, next);
		} else {
			this.logger.error(
				'Unexpected non-error thrown on test route',
				error
			);
			this.errorHandler.handleError({
				error: error as string,
				req
			});
		}
		res.status(500).json({
			error: 'Internal routing error on test route'
		});
	}
}
