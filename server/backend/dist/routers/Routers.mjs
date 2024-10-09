import express from 'express';
import { check } from 'express-validator';
import { promises as fs } from 'fs';
import path from 'path';
import { sanitizeRequestBody } from '../utils/validator.mjs';
import { validateDependencies } from '../utils/helpers.mjs';
import compression from 'compression';
import hpp from 'hpp';
import passport from 'passport';
import xss from 'xss';
import { serviceTTLConfig } from '../config/cache.mjs';
import { handleValidationErrors } from '../utils/validator.mjs';
import { withRetry } from '../utils/helpers.mjs';
import { fileCacheTTLConfig } from '../config/cache.mjs';
import { AccessControlMiddlewareFactory } from '../index/factory/subfactories/AccessControlMiddlewareFactory.mjs';
import { AuthControllerFactory } from '../index/factory/subfactories/AuthControllerFactory.mjs';
import { ErrorHandlerServiceFactory } from '../index/factory/subfactories/ErrorHandlerServiceFactory.mjs';
import { EnvConfigServiceFactory } from '../index/factory/subfactories/EnvConfigServiceFactory.mjs';
import { CacheLayerServiceFactory } from '../index/factory/subfactories/CacheLayerServiceFactory.mjs';
import { GatekeeperServiceFactory } from '../index/factory/subfactories/GatekeeperServiceFactory.mjs';
import { HealthCheckServiceFactory } from '../index/factory/subfactories/HealthCheckServiceFactory.mjs';
import { LoggerServiceFactory } from '../index/factory/subfactories/LoggerServiceFactory.mjs';
import { MiddlewareFactory } from '../index/factory/subfactories/MiddlewareFactory.mjs';
import { UserControllerFactory } from '../index/factory/subfactories/UserControllerFactory.mjs';
export class BaseRouter {
	static instance = null;
	router;
	logger;
	errorLogger;
	errorHandler;
	envConfig;
	cacheService;
	gatekeeperService;
	helmetService;
	JWTMiddleware;
	passportMiddleware;
	apiRouteTable = {};
	healthRouteTable = {};
	staticRouteTable = {};
	testRouteTable = {};
	constructor(
		logger,
		errorLogger,
		errorHandler,
		envConfig,
		cacheService,
		gatekeeperService,
		helmetService,
		JWTMiddleware,
		passportMiddleware
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
	static async getInstance() {
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
	getRouter() {
		return this.router;
	}
	async initializeBaseRouter() {
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
	async loadRouteTables() {
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
	setUpRoutes() {
		this.router.all('*', this.asyncHandler(this.routeHandler.bind(this)));
	}
	async routeHandler(req, res, next) {
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
			const staticRouterInstance = await StaticRouter.getInstance();
			await staticRouterInstance.serveNotFoundPage(req, res, next);
		} catch (error) {
			this.handleRouteError(error, req, res, next);
		}
	}
	async handleRoute(routerName, req, res, next) {
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
	async applyMiddlewares() {
		const app = express();
		this.applyErrorHandler();
		this.applySanitization();
		this.applyGatekeeper();
		this.applySecurityHeaders(app);
		this.applyCompression();
		this.applyPassportAndJWTAuth();
	}
	applyCompression() {
		this.router.use(compression());
	}
	applyGatekeeper() {
		this.router.use(this.gatekeeperService.rateLimitMiddleware());
		this.router.use(this.gatekeeperService.slowdownMiddleware());
		this.router.use(this.gatekeeperService.ipBlacklistMiddleware());
	}
	applyPassportAndJWTAuth() {
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
	applySanitization() {
		this.router.use(
			this.asyncHandler(async (req, res, next) => {
				req.body = await sanitizeRequestBody(req.body);
				for (const key in req.query) {
					if (req.query.hasOwnProperty(key)) {
						req.query[key] = xss(req.query[key]);
					}
				}
				for (const key in req.params) {
					if (req.params.hasOwnProperty(key)) {
						req.params[key] = xss(req.params[key]);
					}
				}
				next();
			})
		);
	}
	async applySecurityHeaders(app) {
		try {
			await withRetry(
				() => this.helmetService.initializeHelmetMiddleware(app),
				3,
				1000
			);
			this.router.use(hpp());
		} catch (error) {
			this.errorLogger.logError('Failed to initialize Helmet middleware');
			this.handleRouteError(error, {}, {}, {});
		}
	}
	asyncHandler = fn => {
		return (req, res, next) => {
			fn(req, res, next).catch(next);
		};
	};
	async shutdown() {
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
	handleRouteError(error, req, res, next) {
		const expressError = new this.errorHandler.ErrorClasses.ExpressError(
			`Route error: ${error instanceof Error ? error.message : 'Unknown error'}`,
			{ exposeToClient: false }
		);
		this.errorLogger.logError(expressError.message);
		this.errorHandler.expressErrorHandler()(expressError, req, res, next);
	}
	applyErrorHandler() {
		this.router.use((err, req, res, next) => {
			this.errorHandler.expressErrorHandler()(err, req, res, next);
		});
	}
}
export class APIRouter extends BaseRouter {
	userController;
	authController;
	constructor(
		logger,
		errorLogger,
		errorHandler,
		envConfig,
		cacheService,
		gatekeeperService,
		helmetService,
		JWTMiddleware,
		passportMiddleware
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
	async getUserController() {
		if (!this.userController) {
			this.userController =
				await UserControllerFactory.getUserController();
		}
		return this.userController;
	}
	async getAuthController() {
		if (!this.authController) {
			this.authController =
				await AuthControllerFactory.getAuthController();
		}
		return this.authController;
	}
	setUpAPIRoutes() {
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
			this.asyncHandler(async (req, res, next) => {
				try {
					const userController = await this.getUserController();
					const result = await userController.createUser(req.body);
					return res.json(result);
				} catch (err) {
					next(err);
					return;
				}
			})
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
			this.asyncHandler(async (req, res, next) => {
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
			})
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
			this.asyncHandler(async (req, res, next) => {
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
			})
		);
		this.router.post(
			'/generate-totp',
			[
				check('userId').notEmpty().withMessage('User ID is required'),
				handleValidationErrors
			],
			this.asyncHandler(async (req, res, next) => {
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
			})
		);
		this.router.post(
			'/verify-totp',
			[
				check('userId').notEmpty().withMessage('User ID is required'),
				check('token').notEmpty().withMessage('Token is required'),
				handleValidationErrors
			],
			this.asyncHandler(async (req, res, next) => {
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
			})
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
			this.asyncHandler(async (req, res, next) => {
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
					await authController.generateEmailMFACode(req.body.email);
					const response = { message: 'MFA code sent' };
					await this.cacheService.set(
						cacheKey,
						response,
						'generateEmailMFA',
						3600
					);
					return res.json(response);
				} catch (err) {
					this.errorLogger.logError('Email MFA generation failed');
					next(err);
					return;
				}
			})
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
			this.asyncHandler(async (req, res, next) => {
				try {
					const authController = await this.getAuthController();
					const isValid = await authController.verifyEmailMFACode(
						req.body.email,
						req.body.email2FACode
					);
					return res.json({ isValid });
				} catch (err) {
					this.errorLogger.logError('Email 2FA verification failed');
					next(err);
					return;
				}
			})
		);
	}
	getAPIRouter() {
		return this.router;
	}
}
export class HealthRouter extends BaseRouter {
	healthCheckService;
	accessControl;
	csrfMiddleware;
	cacheTTL = 300;
	constructor(
		logger,
		errorLogger,
		errorHandler,
		envConfig,
		cacheService,
		gatekeeperService,
		helmetService,
		JWTMiddleware,
		passportMiddleware
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
	async initializeServices() {
		this.healthCheckService =
			await HealthCheckServiceFactory.getHealthCheckService();
		this.accessControl =
			await AccessControlMiddlewareFactory.getAccessControlMiddlewareService();
		this.csrfMiddleware = await MiddlewareFactory.getCSRFMiddleware();
		this.cacheTTL = serviceTTLConfig.HealthRouter || 300;
	}
	setupRoutes() {
		this.router.get(
			'/health.html',
			this.accessControl.restrictTo('admin'),
			this.asyncHandler(async (req, res, next) => {
				const cacheKey = 'healthCheckData';
				try {
					const cachedData = await this.cacheService.get(
						cacheKey,
						'healthCheck'
					);
					if (cachedData) {
						this.logger.info('Returning cached health check data');
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
					this.logger.info('Health check data cached successfully');
					res.json(healthData);
					return;
				} catch (err) {
					next(err);
				}
			})
		);
	}
}
export class StaticRouter extends BaseRouter {
	staticRootPath = this.envConfig.getEnvVariable('staticRootPath');
	validCSSFiles = {};
	validFontFiles = {};
	validHTMLFiles = {};
	validIconFiles = {};
	validImageFiles = {};
	validJSFiles = {};
	validLogoFiles = {};
	validMDFiles = {};
	validTXTFiles = {};
	validXMLFiles = {};
	cssDirectory = path.join(this.staticRootPath, 'css');
	fontDirectory = path.join(this.staticRootPath, 'assets/fonts');
	htmlDirectory = this.staticRootPath;
	iconDirectory = path.join(this.staticRootPath, 'assets/icons');
	imageDirectory = path.join(this.staticRootPath, 'assets/images');
	jsDirectory = path.join(this.staticRootPath, 'dist');
	logoDirectory = path.join(this.staticRootPath, 'assets/logos');
	mdDirectory = this.staticRootPath;
	txtDirectory = this.staticRootPath;
	xmlDirectory = this.staticRootPath;
	forbiddenDirectories = [];
	forbiddenExtensions = [];
	forbiddenFiles = [];
	validDirectories = [];
	validExtensions = [];
	cacheTTLs = fileCacheTTLConfig;
	constructor(
		logger,
		errorLogger,
		errorHandler,
		envConfig,
		cacheService,
		gatekeeperService,
		helmetService,
		JWTMiddleware,
		passportMiddleware
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
	async initializeStaticRouter() {
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
	async importRules() {
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
	async validateConfiguration() {
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
	async handleRequest(req, res, next) {
		const filePath = path.join(this.staticRootPath, req.path);
		if (req.path === '/') {
			await this.serveIndexFile(req, res, next);
		} else {
			await this.serveStaticFile(filePath, req.path, req, res, next);
		}
	}
	// *DEV-NOTE* this should work with Gatekeeper to track any IP that is making directory traversal attempts and act accordingly
	async serveStaticFile(filePath, route, req, res, next) {
		const cacheKey = this.getCacheKey(route);
		const fileExtension = path.extname(filePath);
		const cacheTTL = this.getCacheTTL(fileExtension);
		await withRetry(
			async () => {
				await this.blockForbiddenFiles(req, res, next);
				const cachedFile = await this.cacheService.get(
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
				let serveFunction;
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
	getCacheTTL(fileExtension) {
		return this.cacheTTLs[fileExtension] || this.cacheTTLs['default'];
	}
	getCacheKey(route) {
		return `static:${route}`;
	}
	async readFileContent(filePath) {
		return await fs.readFile(filePath, 'utf8');
	}
	async serveIndexFile(req, res, next) {
		const indexFile = this.validHTMLFiles['index'];
		if (typeof indexFile !== 'string') {
			this.logger.warn(`Index page not found or invalid`);
			res.status(404).json({ message: 'Index page not found' });
			return;
		}
		const filePath = path.join(this.staticRootPath, indexFile);
		return new Promise((resolve, reject) => {
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
	async serveNotFoundPage(req, res, next) {
		const notFoundPage = this.validHTMLFiles['notFound'];
		if (typeof notFoundPage !== 'string') {
			this.logger.warn(`not-found.html file is missing`);
			res.status(404).json({ message: 'Page not found' });
			return;
		}
		const filePath = path.join(this.staticRootPath, notFoundPage);
		await this.serveStaticFile(filePath, 'not-found', req, res, next);
	}
	async serveCSSFile(req, res, next) {
		const cssFile = req.params.file;
		if (typeof cssFile !== 'string') {
			this.logger.warn(
				`CSS file not found or invalid: ${req.params.filename}`
			);
		}
		const filePath = path.join(this.cssDirectory, cssFile);
		return new Promise((resolve, reject) => {
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
	async serveHTMLFile(req, res, next) {
		const page = req.params.page;
		const filePathEntry = this.validHTMLFiles[page];
		if (typeof filePathEntry !== 'string') {
			this.logger.warn(`HTML page not found: ${page}`);
			await this.serveNotFoundPage(req, res, next);
			return;
		}
		const filePath = path.join(this.staticRootPath, filePathEntry);
		return new Promise((resolve, reject) => {
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
	async serveIconFile(req, res, next) {
		const imageFile = this.validImageFiles[req.params.filename];
		if (typeof imageFile !== 'string') {
			this.logger.warn(
				`Icon file not found or invalid: ${req.params.filename}`
			);
			res.status(404).json({ message: 'Logo file not found' });
			return;
		}
		const filePath = path.join(this.imageDirectory, imageFile);
		return new Promise((resolve, reject) => {
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
	async serveImageFile(req, res, next) {
		const imageFile = this.validImageFiles[req.params.filename];
		if (typeof imageFile !== 'string') {
			this.logger.warn(
				`Image file not found or invalid: ${req.params.filename}`
			);
			res.status(404).json({ message: 'Image file not found' });
			return;
		}
		const filePath = path.join(this.imageDirectory, imageFile);
		return new Promise((resolve, reject) => {
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
	async serveJSFile(req, res, next) {
		const imageFile = this.validImageFiles[req.params.filename];
		if (typeof imageFile !== 'string') {
			this.logger.warn(
				`Javascript file not found or invalid: ${req.params.filename}`
			);
			res.status(404).json({ message: 'Javascript file not found' });
			return;
		}
		const filePath = path.join(this.imageDirectory, imageFile);
		return new Promise((resolve, reject) => {
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
	async serveLogoFile(req, res, next) {
		const imageFile = this.validImageFiles[req.params.filename];
		if (typeof imageFile !== 'string') {
			this.logger.warn(
				`Image file not found or invalid: ${req.params.filename}`
			);
			res.status(404).json({ message: 'Image file not found' });
			return;
		}
		const filePath = path.join(this.imageDirectory, imageFile);
		return new Promise((resolve, reject) => {
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
	async serveMDFile(req, res, next) {
		const jsFile = this.validJSFiles[req.params.filename];
		if (typeof jsFile !== 'string') {
			this.logger.warn(
				`Markdown file not found or invalid: ${req.params.filename}`
			);
			res.status(404).json({ message: 'Markdown file not found' });
			return;
		}
		const filePath = path.join(this.jsDirectory, jsFile);
		return new Promise((resolve, reject) => {
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
	async serveTXTFile(req, res, next) {
		const jsFile = this.validJSFiles[req.params.filename];
		if (typeof jsFile !== 'string') {
			this.logger.warn(
				`Text file not found or invalid: ${req.params.filename}`
			);
			res.status(404).json({ message: 'Text file not found' });
			return;
		}
		const filePath = path.join(this.jsDirectory, jsFile);
		return new Promise((resolve, reject) => {
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
	async serveXMLFile(req, res, next) {
		const jsFile = this.validJSFiles[req.params.filename];
		if (typeof jsFile !== 'string') {
			this.logger.warn(
				`XML file not found or invalid: ${req.params.filename}`
			);
			res.status(404).json({ message: 'Text file not found' });
			return;
		}
		const filePath = path.join(this.jsDirectory, jsFile);
		return new Promise((resolve, reject) => {
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
	validateFiles(directory, fileRecord, allowedFiles, validExtensions) {
		try {
			const validFiles = Object.keys(allowedFiles);
			const filesInDirectory = Object.keys(fileRecord);
			filesInDirectory.forEach(file => {
				const filePaths = Array.isArray(fileRecord[file])
					? fileRecord[file]
					: [fileRecord[file]];
				filePaths.forEach(filePath => {
					const ext = path.extname(filePath);
					if (
						!validFiles.includes(filePath) ||
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
				`Error validating files in directory ${directory}: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}
	setUpPeriodicValidation(
		directory,
		fileRecord,
		allowedFiles,
		validExtensions,
		intervalMs
	) {
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
				`Error setting up periodic validation for directory ${directory}: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}
	async blockForbiddenFiles(req, res, next) {
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
	nodeEnv = this.envConfig.getEnvVariable('nodeEnv');
	constructor(
		logger,
		errorLogger,
		errorHandler,
		envConfig,
		cacheService,
		gatekeeperService,
		helmetService,
		JWTMiddleware,
		passportMiddleware
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
	setUpTestRoutes() {
		if (this.nodeEnv === 'production') {
			this.router.use((_req, res) => {
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
	testConnectRoute(req, res, next) {
		try {
			this.logger.info('Test route accessed.');
			res.send('Test route is working!');
		} catch (error) {
			this.handleRouteError(error, req, res, next);
		}
	}
	testDeleteRoute(req, res, next) {
		try {
			this.logger.info('DELETE Test route accessed.');
			res.send('DELETE Test route is working!');
		} catch (error) {
			this.handleRouteError(error, req, res, next);
		}
	}
	testGetRoute(req, res, next) {
		try {
			this.logger.info('Test route accessed.');
			res.send('Test route is working!');
		} catch (error) {
			this.handleRouteError(error, req, res, next);
		}
	}
	testHeadRoute(req, res, next) {
		try {
			this.logger.info('Test route accessed.');
			res.send('Test route is working!');
		} catch (error) {
			this.handleRouteError(error, req, res, next);
		}
	}
	testOptionsRoute(req, res, next) {
		try {
			this.logger.info('Test route accessed.');
			res.send('Test route is working!');
		} catch (error) {
			this.handleRouteError(error, req, res, next);
		}
	}
	testPatchRoute(req, res, next) {
		try {
			this.logger.info('Test route accessed.');
			res.send('Test route is working!');
		} catch (error) {
			this.handleRouteError(error, req, res, next);
		}
	}
	testPostRoute(req, res, next) {
		try {
			this.logger.info('POST Test route accessed.');
			res.send('POST Test route is working!');
		} catch (error) {
			this.handleRouteError(error, req, res, next);
		}
	}
	testPutRoute(req, res, next) {
		try {
			this.logger.info('PUT Test route accessed.');
			res.send('PUT Test route is working!');
		} catch (error) {
			this.handleRouteError(error, req, res, next);
		}
	}
	testTraceRoute(req, res, next) {
		try {
			this.logger.info('Test route accessed.');
			res.send('Test route is working!');
		} catch (error) {
			this.handleRouteError(error, req, res, next);
		}
	}
	handleTestRouteErrors(error, req, res, next) {
		if (error instanceof Error) {
			this.logger.error('Unexpected error on test route');
			this.errorHandler.expressErrorHandler()(error, req, res, next);
		} else {
			this.logger.error(
				'Unexpected non-error thrown on test route',
				error
			);
			this.errorHandler.handleError({
				error,
				req
			});
		}
		res.status(500).json({
			error: 'Internal routing error on test route'
		});
	}
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUm91dGVycy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9yb3V0ZXJzL1JvdXRlcnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxPQU1OLE1BQU0sU0FBUyxDQUFDO0FBQ2pCLE9BQU8sRUFBRSxLQUFLLEVBQUUsTUFBTSxtQkFBbUIsQ0FBQztBQUMxQyxPQUFPLEVBQUUsUUFBUSxJQUFJLEVBQUUsRUFBRSxNQUFNLElBQUksQ0FBQztBQW9CcEMsT0FBTyxJQUFJLE1BQU0sTUFBTSxDQUFDO0FBQ3hCLE9BQU8sRUFBRSxtQkFBbUIsRUFBRSxNQUFNLG9CQUFvQixDQUFDO0FBQ3pELE9BQU8sRUFBRSxvQkFBb0IsRUFBRSxNQUFNLGtCQUFrQixDQUFDO0FBQ3hELE9BQU8sV0FBVyxNQUFNLGFBQWEsQ0FBQztBQUN0QyxPQUFPLEdBQUcsTUFBTSxLQUFLLENBQUM7QUFDdEIsT0FBTyxRQUFRLE1BQU0sVUFBVSxDQUFDO0FBQ2hDLE9BQU8sR0FBRyxNQUFNLEtBQUssQ0FBQztBQUN0QixPQUFPLEVBQUUsZ0JBQWdCLEVBQUUsTUFBTSxpQkFBaUIsQ0FBQztBQUNuRCxPQUFPLEVBQUUsc0JBQXNCLEVBQUUsTUFBTSxvQkFBb0IsQ0FBQztBQUM1RCxPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0sa0JBQWtCLENBQUM7QUFDN0MsT0FBTyxFQUFFLGtCQUFrQixFQUFFLE1BQU0saUJBQWlCLENBQUM7QUFDckQsT0FBTyxFQUFFLDhCQUE4QixFQUFFLE1BQU0sOERBQThELENBQUM7QUFDOUcsT0FBTyxFQUFFLHFCQUFxQixFQUFFLE1BQU0scURBQXFELENBQUM7QUFDNUYsT0FBTyxFQUFFLDBCQUEwQixFQUFFLE1BQU0sMERBQTBELENBQUM7QUFDdEcsT0FBTyxFQUFFLHVCQUF1QixFQUFFLE1BQU0sdURBQXVELENBQUM7QUFDaEcsT0FBTyxFQUFFLHdCQUF3QixFQUFFLE1BQU0sd0RBQXdELENBQUM7QUFDbEcsT0FBTyxF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cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGV4cHJlc3MsIHtcblx0QXBwbGljYXRpb24sXG5cdE5leHRGdW5jdGlvbixcblx0UmVxdWVzdCxcblx0UmVzcG9uc2UsXG5cdFJvdXRlclxufSBmcm9tICdleHByZXNzJztcbmltcG9ydCB7IGNoZWNrIH0gZnJvbSAnZXhwcmVzcy12YWxpZGF0b3InO1xuaW1wb3J0IHsgcHJvbWlzZXMgYXMgZnMgfSBmcm9tICdmcyc7XG5pbXBvcnQge1xuXHRBY2Nlc3NDb250cm9sTWlkZGxld2FyZVNlcnZpY2VJbnRlcmZhY2UsXG5cdEFwcExvZ2dlclNlcnZpY2VJbnRlcmZhY2UsXG5cdEF1dGhDb250cm9sbGVySW50ZXJmYWNlLFxuXHRCYXNlUm91dGVySW50ZXJmYWNlLFxuXHRDYWNoZVNlcnZpY2VJbnRlcmZhY2UsXG5cdENTUkZNaWRkbGV3YXJlU2VydmljZUludGVyZmFjZSxcblx0RW52Q29uZmlnU2VydmljZUludGVyZmFjZSxcblx0RXJyb3JIYW5kbGVyU2VydmljZUludGVyZmFjZSxcblx0RXJyb3JMb2dnZXJTZXJ2aWNlSW50ZXJmYWNlLFxuXHRGaWxlVHlwZVJlY29yZHMsXG5cdEdhdGVrZWVwZXJTZXJ2aWNlSW50ZXJmYWNlLFxuXHRIZWFsdGhDaGVja1NlcnZpY2VJbnRlcmZhY2UsXG5cdEhlbG1ldE1pZGRsZXdhcmVTZXJ2aWNlSW50ZXJmYWNlLFxuXHRKV1RBdXRoTWlkZGxld2FyZVNlcnZpY2VJbnRlcmZhY2UsXG5cdFBhc3Nwb3J0QXV0aE1pZGRsZXdhcmVTZXJ2aWNlSW50ZXJmYWNlLFxuXHRTdGF0aWNSb3V0ZXJJbnRlcmZhY2UsXG5cdFVzZXJDb250cm9sbGVySW50ZXJmYWNlXG59IGZyb20gJy4uL2luZGV4L2ludGVyZmFjZXMvbWFpbic7XG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCB7IHNhbml0aXplUmVxdWVzdEJvZHkgfSBmcm9tICcuLi91dGlscy92YWxpZGF0b3InO1xuaW1wb3J0IHsgdmFsaWRhdGVEZXBlbmRlbmNpZXMgfSBmcm9tICcuLi91dGlscy9oZWxwZXJzJztcbmltcG9ydCBjb21wcmVzc2lvbiBmcm9tICdjb21wcmVzc2lvbic7XG5pbXBvcnQgaHBwIGZyb20gJ2hwcCc7XG5pbXBvcnQgcGFzc3BvcnQgZnJvbSAncGFzc3BvcnQnO1xuaW1wb3J0IHhzcyBmcm9tICd4c3MnO1xuaW1wb3J0IHsgc2VydmljZVRUTENvbmZpZyB9IGZyb20gJy4uL2NvbmZpZy9jYWNoZSc7XG5pbXBvcnQgeyBoYW5kbGVWYWxpZGF0aW9uRXJyb3JzIH0gZnJvbSAnLi4vdXRpbHMvdmFsaWRhdG9yJztcbmltcG9ydCB7IHdpdGhSZXRyeSB9IGZyb20gJy4uL3V0aWxzL2hlbHBlcnMnO1xuaW1wb3J0IHsgZmlsZUNhY2hlVFRMQ29uZmlnIH0gZnJvbSAnLi4vY29uZmlnL2NhY2hlJztcbmltcG9ydCB7IEFjY2Vzc0NvbnRyb2xNaWRkbGV3YXJlRmFjdG9yeSB9IGZyb20gJy4uL2luZGV4L2ZhY3Rvcnkvc3ViZmFjdG9yaWVzL0FjY2Vzc0NvbnRyb2xNaWRkbGV3YXJlRmFjdG9yeSc7XG5pbXBvcnQgeyBBdXRoQ29udHJvbGxlckZhY3RvcnkgfSBmcm9tICcuLi9pbmRleC9mYWN0b3J5L3N1YmZhY3Rvcmllcy9BdXRoQ29udHJvbGxlckZhY3RvcnknO1xuaW1wb3J0IHsgRXJyb3JIYW5kbGVyU2VydmljZUZhY3RvcnkgfSBmcm9tICcuLi9pbmRleC9mYWN0b3J5L3N1YmZhY3Rvcmllcy9FcnJvckhhbmRsZXJTZXJ2aWNlRmFjdG9yeSc7XG5pbXBvcnQgeyBFbnZDb25maWdTZXJ2aWNlRmFjdG9yeSB9IGZyb20gJy4uL2luZGV4L2ZhY3Rvcnkvc3ViZmFjdG9yaWVzL0VudkNvbmZpZ1NlcnZpY2VGYWN0b3J5JztcbmltcG9ydCB7IENhY2hlTGF5ZXJTZXJ2aWNlRmFjdG9yeSB9IGZyb20gJy4uL2luZGV4L2ZhY3Rvcnkvc3ViZmFjdG9yaWVzL0NhY2hlTGF5ZXJTZXJ2aWNlRmFjdG9yeSc7XG5pbXBvcnQgeyBHYXRla2VlcGVyU2VydmljZUZhY3RvcnkgfSBmcm9tICcuLi9pbmRleC9mYWN0b3J5L3N1YmZhY3Rvcmllcy9HYXRla2VlcGVyU2VydmljZUZhY3RvcnknO1xuaW1wb3J0IHsgSGVhbHRoQ2hlY2tTZXJ2aWNlRmFjdG9yeSB9IGZyb20gJy4uL2luZGV4L2ZhY3Rvcnkvc3ViZmFjdG9yaWVzL0hlYWx0aENoZWNrU2VydmljZUZhY3RvcnknO1xuaW1wb3J0IHsgTG9nZ2VyU2VydmljZUZhY3RvcnkgfSBmcm9tICcuLi9pbmRleC9mYWN0b3J5L3N1YmZhY3Rvcmllcy9Mb2dnZXJTZXJ2aWNlRmFjdG9yeSc7XG5pbXBvcnQgeyBNaWRkbGV3YXJlRmFjdG9yeSB9IGZyb20gJy4uL2luZGV4L2ZhY3Rvcnkvc3ViZmFjdG9yaWVzL01pZGRsZXdhcmVGYWN0b3J5JztcbmltcG9ydCB7IFVzZXJDb250cm9sbGVyRmFjdG9yeSB9IGZyb20gJy4uL2luZGV4L2ZhY3Rvcnkvc3ViZmFjdG9yaWVzL1VzZXJDb250cm9sbGVyRmFjdG9yeSc7XG5cbmV4cG9ydCBjbGFzcyBCYXNlUm91dGVyIGltcGxlbWVudHMgQmFzZVJvdXRlckludGVyZmFjZSB7XG5cdHByaXZhdGUgc3RhdGljIGluc3RhbmNlOiBCYXNlUm91dGVyIHwgbnVsbCA9IG51bGw7XG5cblx0cHJvdGVjdGVkIHJvdXRlcjogUm91dGVyO1xuXG5cdHByb3RlY3RlZCBsb2dnZXI6IEFwcExvZ2dlclNlcnZpY2VJbnRlcmZhY2U7XG5cdHByb3RlY3RlZCBlcnJvckxvZ2dlcjogRXJyb3JMb2dnZXJTZXJ2aWNlSW50ZXJmYWNlO1xuXHRwcm90ZWN0ZWQgZXJyb3JIYW5kbGVyOiBFcnJvckhhbmRsZXJTZXJ2aWNlSW50ZXJmYWNlO1xuXHRwcm90ZWN0ZWQgZW52Q29uZmlnOiBFbnZDb25maWdTZXJ2aWNlSW50ZXJmYWNlO1xuXHRwcm90ZWN0ZWQgY2FjaGVTZXJ2aWNlOiBDYWNoZVNlcnZpY2VJbnRlcmZhY2U7XG5cdHByb3RlY3RlZCBnYXRla2VlcGVyU2VydmljZTogR2F0ZWtlZXBlclNlcnZpY2VJbnRlcmZhY2U7XG5cdHByb3RlY3RlZCBoZWxtZXRTZXJ2aWNlOiBIZWxtZXRNaWRkbGV3YXJlU2VydmljZUludGVyZmFjZTtcblx0cHJvdGVjdGVkIEpXVE1pZGRsZXdhcmU6IEpXVEF1dGhNaWRkbGV3YXJlU2VydmljZUludGVyZmFjZTtcblx0cHJvdGVjdGVkIHBhc3Nwb3J0TWlkZGxld2FyZTogUGFzc3BvcnRBdXRoTWlkZGxld2FyZVNlcnZpY2VJbnRlcmZhY2U7XG5cblx0cHJvdGVjdGVkIGFwaVJvdXRlVGFibGU6IFJlY29yZDxzdHJpbmcsIFJlY29yZDxzdHJpbmcsIHN0cmluZz4+ID0ge307XG5cdHByb3RlY3RlZCBoZWFsdGhSb3V0ZVRhYmxlOiBSZWNvcmQ8c3RyaW5nLCBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+PiA9IHt9O1xuXHRwcm90ZWN0ZWQgc3RhdGljUm91dGVUYWJsZTogUmVjb3JkPHN0cmluZywgUmVjb3JkPHN0cmluZywgc3RyaW5nPj4gPSB7fTtcblx0cHJvdGVjdGVkIHRlc3RSb3V0ZVRhYmxlOiBSZWNvcmQ8c3RyaW5nLCBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+PiA9IHt9O1xuXG5cdHByb3RlY3RlZCBjb25zdHJ1Y3Rvcihcblx0XHRsb2dnZXI6IEFwcExvZ2dlclNlcnZpY2VJbnRlcmZhY2UsXG5cdFx0ZXJyb3JMb2dnZXI6IEVycm9yTG9nZ2VyU2VydmljZUludGVyZmFjZSxcblx0XHRlcnJvckhhbmRsZXI6IEVycm9ySGFuZGxlclNlcnZpY2VJbnRlcmZhY2UsXG5cdFx0ZW52Q29uZmlnOiBFbnZDb25maWdTZXJ2aWNlSW50ZXJmYWNlLFxuXHRcdGNhY2hlU2VydmljZTogQ2FjaGVTZXJ2aWNlSW50ZXJmYWNlLFxuXHRcdGdhdGVrZWVwZXJTZXJ2aWNlOiBHYXRla2VlcGVyU2VydmljZUludGVyZmFjZSxcblx0XHRoZWxtZXRTZXJ2aWNlOiBIZWxtZXRNaWRkbGV3YXJlU2VydmljZUludGVyZmFjZSxcblx0XHRKV1RNaWRkbGV3YXJlOiBKV1RBdXRoTWlkZGxld2FyZVNlcnZpY2VJbnRlcmZhY2UsXG5cdFx0cGFzc3BvcnRNaWRkbGV3YXJlOiBQYXNzcG9ydEF1dGhNaWRkbGV3YXJlU2VydmljZUludGVyZmFjZVxuXHQpIHtcblx0XHR0aGlzLnJvdXRlciA9IGV4cHJlc3MuUm91dGVyKCk7XG5cdFx0dGhpcy5sb2dnZXIgPSBsb2dnZXI7XG5cdFx0dGhpcy5lcnJvckxvZ2dlciA9IGVycm9yTG9nZ2VyO1xuXHRcdHRoaXMuZXJyb3JIYW5kbGVyID0gZXJyb3JIYW5kbGVyO1xuXHRcdHRoaXMuZW52Q29uZmlnID0gZW52Q29uZmlnO1xuXHRcdHRoaXMuY2FjaGVTZXJ2aWNlID0gY2FjaGVTZXJ2aWNlO1xuXHRcdHRoaXMuZ2F0ZWtlZXBlclNlcnZpY2UgPSBnYXRla2VlcGVyU2VydmljZTtcblx0XHR0aGlzLmhlbG1ldFNlcnZpY2UgPSBoZWxtZXRTZXJ2aWNlO1xuXHRcdHRoaXMuSldUTWlkZGxld2FyZSA9IEpXVE1pZGRsZXdhcmU7XG5cdFx0dGhpcy5wYXNzcG9ydE1pZGRsZXdhcmUgPSBwYXNzcG9ydE1pZGRsZXdhcmU7XG5cdH1cblxuXHRwdWJsaWMgc3RhdGljIGFzeW5jIGdldEluc3RhbmNlKCk6IFByb21pc2U8QmFzZVJvdXRlcj4ge1xuXHRcdGlmICghQmFzZVJvdXRlci5pbnN0YW5jZSkge1xuXHRcdFx0QmFzZVJvdXRlci5pbnN0YW5jZSA9IG5ldyBCYXNlUm91dGVyKFxuXHRcdFx0XHRhd2FpdCBMb2dnZXJTZXJ2aWNlRmFjdG9yeS5nZXRMb2dnZXJTZXJ2aWNlKCksXG5cdFx0XHRcdGF3YWl0IExvZ2dlclNlcnZpY2VGYWN0b3J5LmdldEVycm9yTG9nZ2VyU2VydmljZSgpLFxuXHRcdFx0XHRhd2FpdCBFcnJvckhhbmRsZXJTZXJ2aWNlRmFjdG9yeS5nZXRFcnJvckhhbmRsZXJTZXJ2aWNlKCksXG5cdFx0XHRcdGF3YWl0IEVudkNvbmZpZ1NlcnZpY2VGYWN0b3J5LmdldEVudkNvbmZpZ1NlcnZpY2UoKSxcblx0XHRcdFx0YXdhaXQgQ2FjaGVMYXllclNlcnZpY2VGYWN0b3J5LmdldENhY2hlU2VydmljZSgpLFxuXHRcdFx0XHRhd2FpdCBHYXRla2VlcGVyU2VydmljZUZhY3RvcnkuZ2V0R2F0ZWtlZXBlclNlcnZpY2UoKSxcblx0XHRcdFx0YXdhaXQgTWlkZGxld2FyZUZhY3RvcnkuZ2V0SGVsbWV0TWlkZGxld2FyZSgpLFxuXHRcdFx0XHRhd2FpdCBNaWRkbGV3YXJlRmFjdG9yeS5nZXRKV1RBdXRoTWlkZGxld2FyZSgpLFxuXHRcdFx0XHRhd2FpdCBNaWRkbGV3YXJlRmFjdG9yeS5nZXRQYXNzcG9ydEF1dGhNaWRkbGV3YXJlKClcblx0XHRcdCk7XG5cdFx0XHRhd2FpdCBCYXNlUm91dGVyLmluc3RhbmNlLmluaXRpYWxpemVCYXNlUm91dGVyKCk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIEJhc2VSb3V0ZXIuaW5zdGFuY2U7XG5cdH1cblxuXHRwdWJsaWMgZ2V0Um91dGVyKCk6IFJvdXRlciB7XG5cdFx0cmV0dXJuIHRoaXMucm91dGVyO1xuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyBpbml0aWFsaXplQmFzZVJvdXRlcigpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHRhd2FpdCB3aXRoUmV0cnkoXG5cdFx0XHRhc3luYyAoKSA9PiB7XG5cdFx0XHRcdHRoaXMucm91dGVyID0gZXhwcmVzcy5Sb3V0ZXIoKTtcblx0XHRcdFx0YXdhaXQgdGhpcy5sb2FkUm91dGVUYWJsZXMoKTtcblx0XHRcdFx0YXdhaXQgdGhpcy5hcHBseU1pZGRsZXdhcmVzKCk7XG5cdFx0XHRcdHRoaXMuc2V0VXBSb3V0ZXMoKTtcblx0XHRcdH0sXG5cdFx0XHQxMCxcblx0XHRcdDI1MCxcblx0XHRcdHRydWVcblx0XHQpO1xuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyBsb2FkUm91dGVUYWJsZXMoKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0Y29uc3QgYXBpUm91dGVUYWJsZSA9IChhd2FpdCBpbXBvcnQoJy4uL2NvbmZpZy9yb3V0ZVRhYmxlcycpKVxuXHRcdFx0LmFwaVJvdXRlVGFibGU7XG5cdFx0Y29uc3QgaGVhbHRoUm91dGVzID0gKGF3YWl0IGltcG9ydCgnLi4vY29uZmlnL3JvdXRlVGFibGVzJykpXG5cdFx0XHQuaGVhbHRoUm91dGVUYWJsZTtcblx0XHRjb25zdCBzdGF0aWNSb3V0ZXMgPSAoYXdhaXQgaW1wb3J0KCcuLi9jb25maWcvcm91dGVUYWJsZXMnKSlcblx0XHRcdC5zdGF0aWNSb3V0ZVRhYmxlO1xuXHRcdGNvbnN0IHRlc3RSb3V0ZXMgPSAoYXdhaXQgaW1wb3J0KCcuLi9jb25maWcvcm91dGVUYWJsZXMnKSlcblx0XHRcdC50ZXN0Um91dGVUYWJsZTtcblxuXHRcdHRoaXMuYXBpUm91dGVUYWJsZSA9IGFwaVJvdXRlVGFibGU7XG5cdFx0dGhpcy5oZWFsdGhSb3V0ZVRhYmxlID0gaGVhbHRoUm91dGVzO1xuXHRcdHRoaXMuc3RhdGljUm91dGVUYWJsZSA9IHN0YXRpY1JvdXRlcztcblx0XHR0aGlzLnRlc3RSb3V0ZVRhYmxlID0gdGVzdFJvdXRlcztcblx0fVxuXG5cdHByaXZhdGUgc2V0VXBSb3V0ZXMoKTogdm9pZCB7XG5cdFx0dGhpcy5yb3V0ZXIuYWxsKCcqJywgdGhpcy5hc3luY0hhbmRsZXIodGhpcy5yb3V0ZUhhbmRsZXIuYmluZCh0aGlzKSkpO1xuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyByb3V0ZUhhbmRsZXIoXG5cdFx0cmVxOiBSZXF1ZXN0LFxuXHRcdHJlczogUmVzcG9uc2UsXG5cdFx0bmV4dDogTmV4dEZ1bmN0aW9uXG5cdCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdGNvbnN0IG1ldGhvZCA9IHJlcS5tZXRob2Q7XG5cdFx0Y29uc3QgcGF0aCA9IHJlcS5wYXRoO1xuXHRcdHRyeSB7XG5cdFx0XHRpZiAoXG5cdFx0XHRcdHRoaXMuc3RhdGljUm91dGVUYWJsZVtwYXRoXSAmJlxuXHRcdFx0XHR0aGlzLnN0YXRpY1JvdXRlVGFibGVbcGF0aF1bbWV0aG9kXVxuXHRcdFx0KSB7XG5cdFx0XHRcdHJldHVybiBhd2FpdCB0aGlzLmhhbmRsZVJvdXRlKFxuXHRcdFx0XHRcdHRoaXMuc3RhdGljUm91dGVUYWJsZVtwYXRoXVttZXRob2RdLFxuXHRcdFx0XHRcdHJlcSxcblx0XHRcdFx0XHRyZXMsXG5cdFx0XHRcdFx0bmV4dFxuXHRcdFx0XHQpO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAodGhpcy5hcGlSb3V0ZVRhYmxlW3BhdGhdICYmIHRoaXMuYXBpUm91dGVUYWJsZVtwYXRoXVttZXRob2RdKSB7XG5cdFx0XHRcdHJldHVybiBhd2FpdCB0aGlzLmhhbmRsZVJvdXRlKFxuXHRcdFx0XHRcdHRoaXMuYXBpUm91dGVUYWJsZVtwYXRoXVttZXRob2RdLFxuXHRcdFx0XHRcdHJlcSxcblx0XHRcdFx0XHRyZXMsXG5cdFx0XHRcdFx0bmV4dFxuXHRcdFx0XHQpO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoXG5cdFx0XHRcdHRoaXMuaGVhbHRoUm91dGVUYWJsZVtwYXRoXSAmJlxuXHRcdFx0XHR0aGlzLmhlYWx0aFJvdXRlVGFibGVbcGF0aF1bbWV0aG9kXVxuXHRcdFx0KSB7XG5cdFx0XHRcdHJldHVybiBhd2FpdCB0aGlzLmhhbmRsZVJvdXRlKFxuXHRcdFx0XHRcdHRoaXMuaGVhbHRoUm91dGVUYWJsZVtwYXRoXVttZXRob2RdLFxuXHRcdFx0XHRcdHJlcSxcblx0XHRcdFx0XHRyZXMsXG5cdFx0XHRcdFx0bmV4dFxuXHRcdFx0XHQpO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoXG5cdFx0XHRcdHRoaXMudGVzdFJvdXRlVGFibGVbcGF0aF0gJiZcblx0XHRcdFx0dGhpcy50ZXN0Um91dGVUYWJsZVtwYXRoXVttZXRob2RdICYmXG5cdFx0XHRcdHRoaXMuZW52Q29uZmlnLmdldEZlYXR1cmVGbGFncygpLmxvYWRUZXN0Um91dGVzXG5cdFx0XHQpIHtcblx0XHRcdFx0cmV0dXJuIGF3YWl0IHRoaXMuaGFuZGxlUm91dGUoXG5cdFx0XHRcdFx0dGhpcy50ZXN0Um91dGVUYWJsZVtwYXRoXVttZXRob2RdLFxuXHRcdFx0XHRcdHJlcSxcblx0XHRcdFx0XHRyZXMsXG5cdFx0XHRcdFx0bmV4dFxuXHRcdFx0XHQpO1xuXHRcdFx0fVxuXG5cdFx0XHRjb25zdCBzdGF0aWNSb3V0ZXJJbnN0YW5jZSA9XG5cdFx0XHRcdChhd2FpdCBTdGF0aWNSb3V0ZXIuZ2V0SW5zdGFuY2UoKSkgYXMgU3RhdGljUm91dGVyO1xuXHRcdFx0YXdhaXQgc3RhdGljUm91dGVySW5zdGFuY2Uuc2VydmVOb3RGb3VuZFBhZ2UocmVxLCByZXMsIG5leHQpO1xuXHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHR0aGlzLmhhbmRsZVJvdXRlRXJyb3IoZXJyb3IsIHJlcSwgcmVzLCBuZXh0KTtcblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIGhhbmRsZVJvdXRlKFxuXHRcdHJvdXRlck5hbWU6IHN0cmluZyxcblx0XHRyZXE6IFJlcXVlc3QsXG5cdFx0cmVzOiBSZXNwb25zZSxcblx0XHRuZXh0OiBOZXh0RnVuY3Rpb25cblx0KTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0YXdhaXQgd2l0aFJldHJ5KFxuXHRcdFx0YXN5bmMgKCkgPT4ge1xuXHRcdFx0XHRzd2l0Y2ggKHJvdXRlck5hbWUpIHtcblx0XHRcdFx0XHRjYXNlICdzdGF0aWNSb3V0ZXInOlxuXHRcdFx0XHRcdFx0KGF3YWl0IFN0YXRpY1JvdXRlci5nZXRJbnN0YW5jZSgpKS5nZXRSb3V0ZXIoKShcblx0XHRcdFx0XHRcdFx0cmVxLFxuXHRcdFx0XHRcdFx0XHRyZXMsXG5cdFx0XHRcdFx0XHRcdG5leHRcblx0XHRcdFx0XHRcdCk7XG5cdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHRjYXNlICdhcGlSb3V0ZXInOlxuXHRcdFx0XHRcdFx0KGF3YWl0IEFQSVJvdXRlci5nZXRJbnN0YW5jZSgpKS5nZXRSb3V0ZXIoKShcblx0XHRcdFx0XHRcdFx0cmVxLFxuXHRcdFx0XHRcdFx0XHRyZXMsXG5cdFx0XHRcdFx0XHRcdG5leHRcblx0XHRcdFx0XHRcdCk7XG5cdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHRjYXNlICdoZWFsdGhSb3V0ZXInOlxuXHRcdFx0XHRcdFx0KGF3YWl0IEhlYWx0aFJvdXRlci5nZXRJbnN0YW5jZSgpKS5nZXRSb3V0ZXIoKShcblx0XHRcdFx0XHRcdFx0cmVxLFxuXHRcdFx0XHRcdFx0XHRyZXMsXG5cdFx0XHRcdFx0XHRcdG5leHRcblx0XHRcdFx0XHRcdCk7XG5cdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHRjYXNlICd0ZXN0Um91dGVyJzpcblx0XHRcdFx0XHRcdChhd2FpdCBUZXN0Um91dGVyLmdldEluc3RhbmNlKCkpLmdldFJvdXRlcigpKFxuXHRcdFx0XHRcdFx0XHRyZXEsXG5cdFx0XHRcdFx0XHRcdHJlcyxcblx0XHRcdFx0XHRcdFx0bmV4dFxuXHRcdFx0XHRcdFx0KTtcblx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdGRlZmF1bHQ6XG5cdFx0XHRcdFx0XHRyZXMuc3RhdHVzKDUwMCkuanNvbih7XG5cdFx0XHRcdFx0XHRcdG1lc3NhZ2U6ICdJbnRlcm5hbCBzZXJ2ZXIgZXJyb3InXG5cdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRcdG5leHQoKTtcblx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHRcdDUsXG5cdFx0XHQyNTAsXG5cdFx0XHR0cnVlXG5cdFx0KS5jYXRjaChlcnJvciA9PiB7XG5cdFx0XHR0aGlzLmxvZ2dlci5lcnJvcihgRmFpbGVkIHRvIGhhbmRsZSByb3V0ZTogJHtlcnJvcn1gKTtcblx0XHRcdHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcblx0XHRcdFx0bWVzc2FnZTogJ0ZhaWxlZCB0byBoYW5kbGUgcm91dGUgYWZ0ZXIgbXVsdGlwbGUgYXR0ZW1wdHMnXG5cdFx0XHR9KTtcblx0XHRcdG5leHQoKTtcblx0XHR9KTtcblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgYXBwbHlNaWRkbGV3YXJlcygpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHRjb25zdCBhcHAgPSBleHByZXNzKCk7XG5cblx0XHR0aGlzLmFwcGx5RXJyb3JIYW5kbGVyKCk7XG5cdFx0dGhpcy5hcHBseVNhbml0aXphdGlvbigpO1xuXHRcdHRoaXMuYXBwbHlHYXRla2VlcGVyKCk7XG5cdFx0dGhpcy5hcHBseVNlY3VyaXR5SGVhZGVycyhhcHApO1xuXHRcdHRoaXMuYXBwbHlDb21wcmVzc2lvbigpO1xuXHRcdHRoaXMuYXBwbHlQYXNzcG9ydEFuZEpXVEF1dGgoKTtcblx0fVxuXG5cdHByaXZhdGUgYXBwbHlDb21wcmVzc2lvbigpOiB2b2lkIHtcblx0XHR0aGlzLnJvdXRlci51c2UoY29tcHJlc3Npb24oKSk7XG5cdH1cblxuXHRwcml2YXRlIGFwcGx5R2F0ZWtlZXBlcigpOiB2b2lkIHtcblx0XHR0aGlzLnJvdXRlci51c2UodGhpcy5nYXRla2VlcGVyU2VydmljZS5yYXRlTGltaXRNaWRkbGV3YXJlKCkpO1xuXHRcdHRoaXMucm91dGVyLnVzZSh0aGlzLmdhdGVrZWVwZXJTZXJ2aWNlLnNsb3dkb3duTWlkZGxld2FyZSgpKTtcblx0XHR0aGlzLnJvdXRlci51c2UodGhpcy5nYXRla2VlcGVyU2VydmljZS5pcEJsYWNrbGlzdE1pZGRsZXdhcmUoKSk7XG5cdH1cblxuXHRwcml2YXRlIGFwcGx5UGFzc3BvcnRBbmRKV1RBdXRoKCk6IHZvaWQge1xuXHRcdHRoaXMucm91dGVyLnVzZShcblx0XHRcdHRoaXMuYXN5bmNIYW5kbGVyKGFzeW5jIChyZXEsIHJlcywgbmV4dCkgPT4ge1xuXHRcdFx0XHRjb25zdCBwYXNzcG9ydERlcHMgPSB7XG5cdFx0XHRcdFx0cGFzc3BvcnQsXG5cdFx0XHRcdFx0YXV0aGVudGljYXRlT3B0aW9uczogeyBzZXNzaW9uOiBmYWxzZSB9LFxuXHRcdFx0XHRcdHZhbGlkYXRlRGVwZW5kZW5jaWVzXG5cdFx0XHRcdH07XG5cblx0XHRcdFx0dGhpcy5wYXNzcG9ydE1pZGRsZXdhcmUuaW5pdGlhbGl6ZVBhc3Nwb3J0QXV0aE1pZGRsZXdhcmUoXG5cdFx0XHRcdFx0cGFzc3BvcnREZXBzXG5cdFx0XHRcdCk7XG5cdFx0XHRcdHBhc3Nwb3J0LnNlc3Npb24oKTtcblx0XHRcdFx0dGhpcy5KV1RNaWRkbGV3YXJlLmluaXRpYWxpemVKV1RBdXRoTWlkZGxld2FyZSgpO1xuXHRcdFx0XHRuZXh0KCk7XG5cdFx0XHR9KVxuXHRcdCk7XG5cdH1cblxuXHRwcml2YXRlIGFwcGx5U2FuaXRpemF0aW9uKCk6IHZvaWQge1xuXHRcdHRoaXMucm91dGVyLnVzZShcblx0XHRcdHRoaXMuYXN5bmNIYW5kbGVyKFxuXHRcdFx0XHRhc3luYyAocmVxOiBSZXF1ZXN0LCByZXM6IFJlc3BvbnNlLCBuZXh0OiBOZXh0RnVuY3Rpb24pID0+IHtcblx0XHRcdFx0XHRyZXEuYm9keSA9IGF3YWl0IHNhbml0aXplUmVxdWVzdEJvZHkocmVxLmJvZHkpO1xuXG5cdFx0XHRcdFx0Zm9yIChjb25zdCBrZXkgaW4gcmVxLnF1ZXJ5KSB7XG5cdFx0XHRcdFx0XHRpZiAocmVxLnF1ZXJ5Lmhhc093blByb3BlcnR5KGtleSkpIHtcblx0XHRcdFx0XHRcdFx0cmVxLnF1ZXJ5W2tleV0gPSB4c3MocmVxLnF1ZXJ5W2tleV0gYXMgc3RyaW5nKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRmb3IgKGNvbnN0IGtleSBpbiByZXEucGFyYW1zKSB7XG5cdFx0XHRcdFx0XHRpZiAocmVxLnBhcmFtcy5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG5cdFx0XHRcdFx0XHRcdHJlcS5wYXJhbXNba2V5XSA9IHhzcyhyZXEucGFyYW1zW2tleV0pO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdG5leHQoKTtcblx0XHRcdFx0fVxuXHRcdFx0KVxuXHRcdCk7XG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIGFwcGx5U2VjdXJpdHlIZWFkZXJzKGFwcDogQXBwbGljYXRpb24pOiBQcm9taXNlPHZvaWQ+IHtcblx0XHR0cnkge1xuXHRcdFx0YXdhaXQgd2l0aFJldHJ5KFxuXHRcdFx0XHQoKSA9PiB0aGlzLmhlbG1ldFNlcnZpY2UuaW5pdGlhbGl6ZUhlbG1ldE1pZGRsZXdhcmUoYXBwKSxcblx0XHRcdFx0Myxcblx0XHRcdFx0MTAwMFxuXHRcdFx0KTtcblx0XHRcdHRoaXMucm91dGVyLnVzZShocHAoKSk7XG5cdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdHRoaXMuZXJyb3JMb2dnZXIubG9nRXJyb3IoJ0ZhaWxlZCB0byBpbml0aWFsaXplIEhlbG1ldCBtaWRkbGV3YXJlJyk7XG5cdFx0XHR0aGlzLmhhbmRsZVJvdXRlRXJyb3IoXG5cdFx0XHRcdGVycm9yLFxuXHRcdFx0XHR7fSBhcyBSZXF1ZXN0LFxuXHRcdFx0XHR7fSBhcyBSZXNwb25zZSxcblx0XHRcdFx0e30gYXMgTmV4dEZ1bmN0aW9uXG5cdFx0XHQpO1xuXHRcdH1cblx0fVxuXG5cdHByb3RlY3RlZCBhc3luY0hhbmRsZXIgPSAoXG5cdFx0Zm46IChcblx0XHRcdHJlcTogUmVxdWVzdCxcblx0XHRcdHJlczogUmVzcG9uc2UsXG5cdFx0XHRuZXh0OiBOZXh0RnVuY3Rpb25cblx0XHQpID0+IFByb21pc2U8dm9pZCB8IFJlc3BvbnNlPlxuXHQpOiAoKHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSwgbmV4dDogTmV4dEZ1bmN0aW9uKSA9PiB2b2lkKSA9PiB7XG5cdFx0cmV0dXJuIChyZXE6IFJlcXVlc3QsIHJlczogUmVzcG9uc2UsIG5leHQ6IE5leHRGdW5jdGlvbikgPT4ge1xuXHRcdFx0Zm4ocmVxLCByZXMsIG5leHQpLmNhdGNoKG5leHQpO1xuXHRcdH07XG5cdH07XG5cblx0cHVibGljIGFzeW5jIHNodXRkb3duKCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdHRyeSB7XG5cdFx0XHR0aGlzLmxvZ2dlci5pbmZvKCdTaHV0dGluZyBkb3duIEJhc2UgUm91dGVyLi4uJyk7XG5cblx0XHRcdHRoaXMubG9nZ2VyLmluZm8oJ0NsZWFyaW5nIEFQSSBSb3V0ZXIgY2FjaGUuLi4nKTtcblx0XHRcdGF3YWl0IHRoaXMuY2FjaGVTZXJ2aWNlLmNsZWFyTmFtZXNwYWNlKCd1c2VyTG9naW4nKTtcblx0XHRcdGF3YWl0IHRoaXMuY2FjaGVTZXJ2aWNlLmNsZWFyTmFtZXNwYWNlKCdyZWNvdmVyUGFzc3dvcmQnKTtcblx0XHRcdGF3YWl0IHRoaXMuY2FjaGVTZXJ2aWNlLmNsZWFyTmFtZXNwYWNlKCdnZW5lcmF0ZVRPVFAnKTtcblx0XHRcdGF3YWl0IHRoaXMuY2FjaGVTZXJ2aWNlLmNsZWFyTmFtZXNwYWNlKCdnZW5lcmF0ZUVtYWlsTUZBJyk7XG5cdFx0XHR0aGlzLmxvZ2dlci5pbmZvKCdBUElSb3V0ZXIgY2FjaGUgY2xlYXJlZCBzdWNjZXNzZnVsbHkuJyk7XG5cblx0XHRcdHRoaXMubG9nZ2VyLmluZm8oJ0NsZWFyaW5nIFN0YXRpYyBSb3V0ZXIgY2FjaGUuLi4nKTtcblx0XHRcdGF3YWl0IHRoaXMuY2FjaGVTZXJ2aWNlLmNsZWFyTmFtZXNwYWNlKCdzdGF0aWMtZmlsZXMnKTtcblx0XHRcdHRoaXMubG9nZ2VyLmluZm8oJ1N0YXRpY1JvdXRlciBjYWNoZSBjbGVhcmVkIHN1Y2Nlc3NmdWxseS4nKTtcblxuXHRcdFx0dGhpcy5sb2dnZXIuaW5mbygnQ2xlYXJpbmcgSGVhbHRoIFJvdXRlciBjYWNoZS4uLicpO1xuXHRcdFx0YXdhaXQgdGhpcy5jYWNoZVNlcnZpY2UuY2xlYXJOYW1lc3BhY2UoJ2hlYWx0aENoZWNrJyk7XG5cdFx0XHR0aGlzLmxvZ2dlci5pbmZvKCdIZWFsdGhSb3V0ZXIgY2FjaGUgY2xlYXJlZCBzdWNjZXNzZnVsbHkuJyk7XG5cblx0XHRcdGlmIChcblx0XHRcdFx0dGhpcy5lbnZDb25maWcuZ2V0RmVhdHVyZUZsYWdzKCkubG9hZFRlc3RSb3V0ZXMgJiZcblx0XHRcdFx0dGhpcy5lbnZDb25maWcuZ2V0RW52VmFyaWFibGUoJ25vZGVFbnYnKSAhPT0gJ3Byb2R1Y3Rpb24nXG5cdFx0XHQpIHtcblx0XHRcdFx0dGhpcy5sb2dnZXIuaW5mbygnQ2xlYXJpbmcgVGVzdCBSb3V0ZXIgY2FjaGUuLi4nKTtcblx0XHRcdFx0YXdhaXQgdGhpcy5jYWNoZVNlcnZpY2UuY2xlYXJOYW1lc3BhY2UoJ3Rlc3QnKTtcblx0XHRcdFx0dGhpcy5sb2dnZXIuaW5mbygnVGVzdFJvdXRlciBjYWNoZSBjbGVhcmVkIHN1Y2Nlc3NmdWxseS4nKTtcblx0XHRcdH1cblxuXHRcdFx0dGhpcy5sb2dnZXIuaW5mbyhcblx0XHRcdFx0J0Jhc2UgUm91dGVyIGV4dGVuc2lvbiBjYWNoZXMgY2xlYXJlZC4gQ29tcGxldGluZyBzaHV0ZG93biBwcm9jZXNzJ1xuXHRcdFx0KTtcblx0XHRcdEJhc2VSb3V0ZXIuaW5zdGFuY2UgPSBudWxsO1xuXHRcdFx0dGhpcy5sb2dnZXIuaW5mbygnQmFzZSBSb3V0ZXIgc2h1dGRvd24gY29tcGxldGUuJyk7XG5cdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdGNvbnN0IHV0aWxpdHlFcnJvciA9XG5cdFx0XHRcdG5ldyB0aGlzLmVycm9ySGFuZGxlci5FcnJvckNsYXNzZXMuVXRpbGl0eUVycm9yUmVjb3ZlcmFibGUoXG5cdFx0XHRcdFx0YEVycm9yIGR1cmluZyBBUElSb3V0ZXIgc2h1dGRvd246ICR7ZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBlcnJvcn1gXG5cdFx0XHRcdCk7XG5cdFx0XHR0aGlzLmVycm9yTG9nZ2VyLmxvZ0Vycm9yKHV0aWxpdHlFcnJvci5tZXNzYWdlKTtcblx0XHRcdHRoaXMuZXJyb3JIYW5kbGVyLmhhbmRsZUVycm9yKHsgZXJyb3I6IHV0aWxpdHlFcnJvciB9KTtcblx0XHR9XG5cdH1cblxuXHRwcm90ZWN0ZWQgaGFuZGxlUm91dGVFcnJvcihcblx0XHRlcnJvcjogdW5rbm93bixcblx0XHRyZXE6IFJlcXVlc3QsXG5cdFx0cmVzOiBSZXNwb25zZSxcblx0XHRuZXh0OiBOZXh0RnVuY3Rpb25cblx0KTogdm9pZCB7XG5cdFx0Y29uc3QgZXhwcmVzc0Vycm9yID0gbmV3IHRoaXMuZXJyb3JIYW5kbGVyLkVycm9yQ2xhc3Nlcy5FeHByZXNzRXJyb3IoXG5cdFx0XHRgUm91dGUgZXJyb3I6ICR7ZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiAnVW5rbm93biBlcnJvcid9YCxcblx0XHRcdHsgZXhwb3NlVG9DbGllbnQ6IGZhbHNlIH1cblx0XHQpO1xuXHRcdHRoaXMuZXJyb3JMb2dnZXIubG9nRXJyb3IoZXhwcmVzc0Vycm9yLm1lc3NhZ2UpO1xuXHRcdHRoaXMuZXJyb3JIYW5kbGVyLmV4cHJlc3NFcnJvckhhbmRsZXIoKShleHByZXNzRXJyb3IsIHJlcSwgcmVzLCBuZXh0KTtcblx0fVxuXG5cdHByaXZhdGUgYXBwbHlFcnJvckhhbmRsZXIoKTogdm9pZCB7XG5cdFx0dGhpcy5yb3V0ZXIudXNlKFxuXHRcdFx0KGVycjogdW5rbm93biwgcmVxOiBSZXF1ZXN0LCByZXM6IFJlc3BvbnNlLCBuZXh0OiBOZXh0RnVuY3Rpb24pID0+IHtcblx0XHRcdFx0dGhpcy5lcnJvckhhbmRsZXIuZXhwcmVzc0Vycm9ySGFuZGxlcigpKFxuXHRcdFx0XHRcdGVyciBhcyBFcnJvcixcblx0XHRcdFx0XHRyZXEsXG5cdFx0XHRcdFx0cmVzLFxuXHRcdFx0XHRcdG5leHRcblx0XHRcdFx0KTtcblx0XHRcdH1cblx0XHQpO1xuXHR9XG59XG5cbmV4cG9ydCBjbGFzcyBBUElSb3V0ZXIgZXh0ZW5kcyBCYXNlUm91dGVyIHtcblx0cHJpdmF0ZSB1c2VyQ29udHJvbGxlcj86IFVzZXJDb250cm9sbGVySW50ZXJmYWNlO1xuXHRwcml2YXRlIGF1dGhDb250cm9sbGVyPzogQXV0aENvbnRyb2xsZXJJbnRlcmZhY2U7XG5cblx0cHVibGljIGNvbnN0cnVjdG9yKFxuXHRcdGxvZ2dlcjogQXBwTG9nZ2VyU2VydmljZUludGVyZmFjZSxcblx0XHRlcnJvckxvZ2dlcjogRXJyb3JMb2dnZXJTZXJ2aWNlSW50ZXJmYWNlLFxuXHRcdGVycm9ySGFuZGxlcjogRXJyb3JIYW5kbGVyU2VydmljZUludGVyZmFjZSxcblx0XHRlbnZDb25maWc6IEVudkNvbmZpZ1NlcnZpY2VJbnRlcmZhY2UsXG5cdFx0Y2FjaGVTZXJ2aWNlOiBDYWNoZVNlcnZpY2VJbnRlcmZhY2UsXG5cdFx0Z2F0ZWtlZXBlclNlcnZpY2U6IEdhdGVrZWVwZXJTZXJ2aWNlSW50ZXJmYWNlLFxuXHRcdGhlbG1ldFNlcnZpY2U6IEhlbG1ldE1pZGRsZXdhcmVTZXJ2aWNlSW50ZXJmYWNlLFxuXHRcdEpXVE1pZGRsZXdhcmU6IEpXVEF1dGhNaWRkbGV3YXJlU2VydmljZUludGVyZmFjZSxcblx0XHRwYXNzcG9ydE1pZGRsZXdhcmU6IFBhc3Nwb3J0QXV0aE1pZGRsZXdhcmVTZXJ2aWNlSW50ZXJmYWNlXG5cdCkge1xuXHRcdHN1cGVyKFxuXHRcdFx0bG9nZ2VyLFxuXHRcdFx0ZXJyb3JMb2dnZXIsXG5cdFx0XHRlcnJvckhhbmRsZXIsXG5cdFx0XHRlbnZDb25maWcsXG5cdFx0XHRjYWNoZVNlcnZpY2UsXG5cdFx0XHRnYXRla2VlcGVyU2VydmljZSxcblx0XHRcdGhlbG1ldFNlcnZpY2UsXG5cdFx0XHRKV1RNaWRkbGV3YXJlLFxuXHRcdFx0cGFzc3BvcnRNaWRkbGV3YXJlXG5cdFx0KTtcblx0XHR0aGlzLnNldFVwQVBJUm91dGVzKCk7XG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIGdldFVzZXJDb250cm9sbGVyKCk6IFByb21pc2U8VXNlckNvbnRyb2xsZXJJbnRlcmZhY2U+IHtcblx0XHRpZiAoIXRoaXMudXNlckNvbnRyb2xsZXIpIHtcblx0XHRcdHRoaXMudXNlckNvbnRyb2xsZXIgPVxuXHRcdFx0XHRhd2FpdCBVc2VyQ29udHJvbGxlckZhY3RvcnkuZ2V0VXNlckNvbnRyb2xsZXIoKTtcblx0XHR9XG5cdFx0cmV0dXJuIHRoaXMudXNlckNvbnRyb2xsZXI7XG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIGdldEF1dGhDb250cm9sbGVyKCk6IFByb21pc2U8QXV0aENvbnRyb2xsZXJJbnRlcmZhY2U+IHtcblx0XHRpZiAoIXRoaXMuYXV0aENvbnRyb2xsZXIpIHtcblx0XHRcdHRoaXMuYXV0aENvbnRyb2xsZXIgPVxuXHRcdFx0XHRhd2FpdCBBdXRoQ29udHJvbGxlckZhY3RvcnkuZ2V0QXV0aENvbnRyb2xsZXIoKTtcblx0XHR9XG5cdFx0cmV0dXJuIHRoaXMuYXV0aENvbnRyb2xsZXI7XG5cdH1cblxuXHRwcml2YXRlIHNldFVwQVBJUm91dGVzKCk6IHZvaWQge1xuXHRcdHRoaXMucm91dGVyLnBvc3QoXG5cdFx0XHQnL3JlZ2lzdGVyLmh0bWwnLFxuXHRcdFx0W1xuXHRcdFx0XHRjaGVjaygndXNlcm5hbWUnKVxuXHRcdFx0XHRcdC5pc0xlbmd0aCh7IG1pbjogMyB9KVxuXHRcdFx0XHRcdC53aXRoTWVzc2FnZSgnVXNlcm5hbWUgbXVzdCBiZSBhdCBsZWFzdCAzIGNoYXJhY3RlcnMgbG9uZycpXG5cdFx0XHRcdFx0LnRyaW0oKVxuXHRcdFx0XHRcdC5lc2NhcGUoKSxcblx0XHRcdFx0Y2hlY2soJ2VtYWlsJylcblx0XHRcdFx0XHQuaXNFbWFpbCgpXG5cdFx0XHRcdFx0LndpdGhNZXNzYWdlKCdQbGVhc2UgcHJvdmlkZSBhIHZhbGlkIGVtYWlsIGFkZHJlc3MnKVxuXHRcdFx0XHRcdC5ub3JtYWxpemVFbWFpbCgpLFxuXHRcdFx0XHRjaGVjaygncGFzc3dvcmQnKVxuXHRcdFx0XHRcdC5pc0xlbmd0aCh7IG1pbjogOCB9KVxuXHRcdFx0XHRcdC53aXRoTWVzc2FnZSgnUGFzc3dvcmQgbXVzdCBiZSBhdCBsZWFzdCA4IGNoYXJhY3RlcnMgbG9uZycpXG5cdFx0XHRcdFx0Lm1hdGNoZXMoL1tBLVpdLylcblx0XHRcdFx0XHQud2l0aE1lc3NhZ2UoXG5cdFx0XHRcdFx0XHQnUGFzc3dvcmQgbXVzdCBjb250YWluIGF0IGxlYXN0IG9uZSB1cHBlcmNhc2UgbGV0dGVyJ1xuXHRcdFx0XHRcdClcblx0XHRcdFx0XHQubWF0Y2hlcygvW2Etel0vKVxuXHRcdFx0XHRcdC53aXRoTWVzc2FnZShcblx0XHRcdFx0XHRcdCdQYXNzd29yZCBtdXN0IGNvbnRhaW4gYXQgbGVhc3Qgb25lIGxvd2VyY2FzZSBsZXR0ZXInXG5cdFx0XHRcdFx0KVxuXHRcdFx0XHRcdC5tYXRjaGVzKC9cXGQvKVxuXHRcdFx0XHRcdC53aXRoTWVzc2FnZSgnUGFzc3dvcmQgbXVzdCBjb250YWluIGF0IGxlYXN0IG9uZSBkaWdpdCcpXG5cdFx0XHRcdFx0Lm1hdGNoZXMoL1teXFx3XFxzXS8pXG5cdFx0XHRcdFx0LndpdGhNZXNzYWdlKFxuXHRcdFx0XHRcdFx0J1Bhc3N3b3JkIG11c3QgY29udGFpbiBhdCBsZWFzdCBvbmUgc3BlY2lhbCBjaGFyYWN0ZXInXG5cdFx0XHRcdFx0KSxcblx0XHRcdFx0Y2hlY2soJ2NvbmZpcm1QYXNzd29yZCcpXG5cdFx0XHRcdFx0LmN1c3RvbSgodmFsdWUsIHsgcmVxIH0pID0+IHZhbHVlID09PSByZXEuYm9keS5wYXNzd29yZClcblx0XHRcdFx0XHQud2l0aE1lc3NhZ2UoJ1Bhc3N3b3JkcyBkbyBub3QgbWF0Y2gnKSxcblx0XHRcdFx0aGFuZGxlVmFsaWRhdGlvbkVycm9yc1xuXHRcdFx0XSxcblx0XHRcdHRoaXMuYXN5bmNIYW5kbGVyKFxuXHRcdFx0XHRhc3luYyAocmVxOiBSZXF1ZXN0LCByZXM6IFJlc3BvbnNlLCBuZXh0OiBOZXh0RnVuY3Rpb24pID0+IHtcblx0XHRcdFx0XHR0cnkge1xuXHRcdFx0XHRcdFx0Y29uc3QgdXNlckNvbnRyb2xsZXIgPSBhd2FpdCB0aGlzLmdldFVzZXJDb250cm9sbGVyKCk7XG5cdFx0XHRcdFx0XHRjb25zdCByZXN1bHQgPSBhd2FpdCB1c2VyQ29udHJvbGxlci5jcmVhdGVVc2VyKFxuXHRcdFx0XHRcdFx0XHRyZXEuYm9keVxuXHRcdFx0XHRcdFx0KTtcblx0XHRcdFx0XHRcdHJldHVybiByZXMuanNvbihyZXN1bHQpO1xuXHRcdFx0XHRcdH0gY2F0Y2ggKGVycikge1xuXHRcdFx0XHRcdFx0bmV4dChlcnIpO1xuXHRcdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0KVxuXHRcdCk7XG5cblx0XHR0aGlzLnJvdXRlci5wb3N0KFxuXHRcdFx0Jy9sb2dpbicsXG5cdFx0XHRbXG5cdFx0XHRcdGNoZWNrKCdlbWFpbCcpXG5cdFx0XHRcdFx0LmlzRW1haWwoKVxuXHRcdFx0XHRcdC53aXRoTWVzc2FnZSgnUGxlYXNlIHByb3ZpZGUgYSB2YWxpZCBlbWFpbCBhZGRyZXNzJylcblx0XHRcdFx0XHQubm9ybWFsaXplRW1haWwoKSxcblx0XHRcdFx0Y2hlY2soJ3Bhc3N3b3JkJylcblx0XHRcdFx0XHQubm90RW1wdHkoKVxuXHRcdFx0XHRcdC53aXRoTWVzc2FnZSgnUGFzc3dvcmQgaXMgcmVxdWlyZWQnKSxcblx0XHRcdFx0aGFuZGxlVmFsaWRhdGlvbkVycm9yc1xuXHRcdFx0XSxcblx0XHRcdHRoaXMuYXN5bmNIYW5kbGVyKFxuXHRcdFx0XHRhc3luYyAocmVxOiBSZXF1ZXN0LCByZXM6IFJlc3BvbnNlLCBuZXh0OiBOZXh0RnVuY3Rpb24pID0+IHtcblx0XHRcdFx0XHRjb25zdCBjYWNoZUtleSA9IGBsb2dpbjoke3JlcS5ib2R5LmVtYWlsfWA7XG5cdFx0XHRcdFx0Y29uc3QgY2FjaGVkUmVzcG9uc2UgPSBhd2FpdCB0aGlzLmNhY2hlU2VydmljZS5nZXQoXG5cdFx0XHRcdFx0XHRjYWNoZUtleSxcblx0XHRcdFx0XHRcdCd1c2VyTG9naW4nXG5cdFx0XHRcdFx0KTtcblx0XHRcdFx0XHRpZiAoY2FjaGVkUmVzcG9uc2UpIHtcblx0XHRcdFx0XHRcdHJldHVybiByZXMuanNvbihjYWNoZWRSZXNwb25zZSk7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHRcdGNvbnN0IGF1dGhDb250cm9sbGVyID0gYXdhaXQgdGhpcy5nZXRBdXRoQ29udHJvbGxlcigpO1xuXHRcdFx0XHRcdFx0Y29uc3QgcmVzdWx0ID0gYXdhaXQgYXV0aENvbnRyb2xsZXIubG9naW5Vc2VyKFxuXHRcdFx0XHRcdFx0XHRyZXEuYm9keS5lbWFpbCxcblx0XHRcdFx0XHRcdFx0cmVxLmJvZHkucGFzc3dvcmRcblx0XHRcdFx0XHRcdCk7XG5cdFx0XHRcdFx0XHRhd2FpdCB0aGlzLmNhY2hlU2VydmljZS5zZXQoXG5cdFx0XHRcdFx0XHRcdGNhY2hlS2V5LFxuXHRcdFx0XHRcdFx0XHRyZXN1bHQsXG5cdFx0XHRcdFx0XHRcdCd1c2VyTG9naW4nLFxuXHRcdFx0XHRcdFx0XHQzNjAwXG5cdFx0XHRcdFx0XHQpO1xuXHRcdFx0XHRcdFx0cmV0dXJuIHJlcy5qc29uKHJlc3VsdCk7XG5cdFx0XHRcdFx0fSBjYXRjaCAoZXJyKSB7XG5cdFx0XHRcdFx0XHRuZXh0KGVycik7XG5cdFx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHQpXG5cdFx0KTtcblxuXHRcdHRoaXMucm91dGVyLnBvc3QoXG5cdFx0XHQnL3JlY292ZXItcGFzc3dvcmQnLFxuXHRcdFx0W1xuXHRcdFx0XHRjaGVjaygnZW1haWwnKVxuXHRcdFx0XHRcdC5pc0VtYWlsKClcblx0XHRcdFx0XHQud2l0aE1lc3NhZ2UoJ1BsZWFzZSBwcm92aWRlIGEgdmFsaWQgZW1haWwgYWRkcmVzcycpXG5cdFx0XHRcdFx0Lm5vcm1hbGl6ZUVtYWlsKCksXG5cdFx0XHRcdGhhbmRsZVZhbGlkYXRpb25FcnJvcnNcblx0XHRcdF0sXG5cdFx0XHR0aGlzLmFzeW5jSGFuZGxlcihcblx0XHRcdFx0YXN5bmMgKHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSwgbmV4dDogTmV4dEZ1bmN0aW9uKSA9PiB7XG5cdFx0XHRcdFx0Y29uc3QgY2FjaGVLZXkgPSBgcmVjb3Zlci1wYXNzd29yZDoke3JlcS5ib2R5LmVtYWlsfWA7XG5cdFx0XHRcdFx0Y29uc3QgY2FjaGVkUmVzcG9uc2UgPSBhd2FpdCB0aGlzLmNhY2hlU2VydmljZS5nZXQoXG5cdFx0XHRcdFx0XHRjYWNoZUtleSxcblx0XHRcdFx0XHRcdCdyZWNvdmVyUGFzc3dvcmQnXG5cdFx0XHRcdFx0KTtcblx0XHRcdFx0XHRpZiAoY2FjaGVkUmVzcG9uc2UpIHtcblx0XHRcdFx0XHRcdHJldHVybiByZXMuanNvbihjYWNoZWRSZXNwb25zZSk7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHRcdGNvbnN0IGF1dGhDb250cm9sbGVyID0gYXdhaXQgdGhpcy5nZXRBdXRoQ29udHJvbGxlcigpO1xuXHRcdFx0XHRcdFx0YXdhaXQgYXV0aENvbnRyb2xsZXIucmVjb3ZlclBhc3N3b3JkKHJlcS5ib2R5LmVtYWlsKTtcblx0XHRcdFx0XHRcdGNvbnN0IHJlc3BvbnNlID0ge1xuXHRcdFx0XHRcdFx0XHRtZXNzYWdlOiAnUGFzc3dvcmQgcmVjb3ZlcnkgZW1haWwgc2VudCdcblx0XHRcdFx0XHRcdH07XG5cdFx0XHRcdFx0XHRhd2FpdCB0aGlzLmNhY2hlU2VydmljZS5zZXQoXG5cdFx0XHRcdFx0XHRcdGNhY2hlS2V5LFxuXHRcdFx0XHRcdFx0XHRyZXNwb25zZSxcblx0XHRcdFx0XHRcdFx0J3JlY292ZXJQYXNzd29yZCcsXG5cdFx0XHRcdFx0XHRcdDM2MDBcblx0XHRcdFx0XHRcdCk7XG5cdFx0XHRcdFx0XHRyZXR1cm4gcmVzLmpzb24ocmVzcG9uc2UpO1xuXHRcdFx0XHRcdH0gY2F0Y2ggKGVycikge1xuXHRcdFx0XHRcdFx0dGhpcy5lcnJvckxvZ2dlci5sb2dFcnJvcignUGFzc3dvcmQgcmVjb3ZlcnkgZmFpbGVkJyk7XG5cdFx0XHRcdFx0XHRuZXh0KGVycik7XG5cdFx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHQpXG5cdFx0KTtcblxuXHRcdHRoaXMucm91dGVyLnBvc3QoXG5cdFx0XHQnL2dlbmVyYXRlLXRvdHAnLFxuXHRcdFx0W1xuXHRcdFx0XHRjaGVjaygndXNlcklkJykubm90RW1wdHkoKS53aXRoTWVzc2FnZSgnVXNlciBJRCBpcyByZXF1aXJlZCcpLFxuXHRcdFx0XHRoYW5kbGVWYWxpZGF0aW9uRXJyb3JzXG5cdFx0XHRdLFxuXHRcdFx0dGhpcy5hc3luY0hhbmRsZXIoXG5cdFx0XHRcdGFzeW5jIChyZXE6IFJlcXVlc3QsIHJlczogUmVzcG9uc2UsIG5leHQ6IE5leHRGdW5jdGlvbikgPT4ge1xuXHRcdFx0XHRcdGNvbnN0IGNhY2hlS2V5ID0gYGdlbmVyYXRlLXRvdHA6JHtyZXEuYm9keS51c2VySWR9YDtcblx0XHRcdFx0XHRjb25zdCBjYWNoZWRSZXNwb25zZSA9IGF3YWl0IHRoaXMuY2FjaGVTZXJ2aWNlLmdldChcblx0XHRcdFx0XHRcdGNhY2hlS2V5LFxuXHRcdFx0XHRcdFx0J2dlbmVyYXRlVE9UUCdcblx0XHRcdFx0XHQpO1xuXHRcdFx0XHRcdGlmIChjYWNoZWRSZXNwb25zZSkge1xuXHRcdFx0XHRcdFx0cmV0dXJuIHJlcy5qc29uKGNhY2hlZFJlc3BvbnNlKTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHR0cnkge1xuXHRcdFx0XHRcdFx0Y29uc3QgYXV0aENvbnRyb2xsZXIgPSBhd2FpdCB0aGlzLmdldEF1dGhDb250cm9sbGVyKCk7XG5cdFx0XHRcdFx0XHRjb25zdCByZXN1bHQgPSBhd2FpdCBhdXRoQ29udHJvbGxlci5nZW5lcmF0ZVRPVFAoXG5cdFx0XHRcdFx0XHRcdHJlcS5ib2R5LnVzZXJJZFxuXHRcdFx0XHRcdFx0KTtcblx0XHRcdFx0XHRcdGF3YWl0IHRoaXMuY2FjaGVTZXJ2aWNlLnNldChcblx0XHRcdFx0XHRcdFx0Y2FjaGVLZXksXG5cdFx0XHRcdFx0XHRcdHJlc3VsdCxcblx0XHRcdFx0XHRcdFx0J2dlbmVyYXRlVE9UUCcsXG5cdFx0XHRcdFx0XHRcdDM2MDBcblx0XHRcdFx0XHRcdCk7XG5cdFx0XHRcdFx0XHRyZXR1cm4gcmVzLmpzb24ocmVzdWx0KTtcblx0XHRcdFx0XHR9IGNhdGNoIChlcnIpIHtcblx0XHRcdFx0XHRcdHRoaXMuZXJyb3JMb2dnZXIubG9nRXJyb3IoJ1RPVFAgZ2VuZXJhdGlvbiBmYWlsZWQnKTtcblx0XHRcdFx0XHRcdG5leHQoZXJyKTtcblx0XHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdClcblx0XHQpO1xuXG5cdFx0dGhpcy5yb3V0ZXIucG9zdChcblx0XHRcdCcvdmVyaWZ5LXRvdHAnLFxuXHRcdFx0W1xuXHRcdFx0XHRjaGVjaygndXNlcklkJykubm90RW1wdHkoKS53aXRoTWVzc2FnZSgnVXNlciBJRCBpcyByZXF1aXJlZCcpLFxuXHRcdFx0XHRjaGVjaygndG9rZW4nKS5ub3RFbXB0eSgpLndpdGhNZXNzYWdlKCdUb2tlbiBpcyByZXF1aXJlZCcpLFxuXHRcdFx0XHRoYW5kbGVWYWxpZGF0aW9uRXJyb3JzXG5cdFx0XHRdLFxuXHRcdFx0dGhpcy5hc3luY0hhbmRsZXIoXG5cdFx0XHRcdGFzeW5jIChyZXE6IFJlcXVlc3QsIHJlczogUmVzcG9uc2UsIG5leHQ6IE5leHRGdW5jdGlvbikgPT4ge1xuXHRcdFx0XHRcdHRyeSB7XG5cdFx0XHRcdFx0XHRjb25zdCBhdXRoQ29udHJvbGxlciA9IGF3YWl0IHRoaXMuZ2V0QXV0aENvbnRyb2xsZXIoKTtcblx0XHRcdFx0XHRcdGNvbnN0IGlzVmFsaWQgPSBhd2FpdCBhdXRoQ29udHJvbGxlci52ZXJpZnlUT1RQKFxuXHRcdFx0XHRcdFx0XHRyZXEuYm9keS51c2VySWQsXG5cdFx0XHRcdFx0XHRcdHJlcS5ib2R5LnRva2VuXG5cdFx0XHRcdFx0XHQpO1xuXHRcdFx0XHRcdFx0cmV0dXJuIHJlcy5qc29uKHsgaXNWYWxpZCB9KTtcblx0XHRcdFx0XHR9IGNhdGNoIChlcnIpIHtcblx0XHRcdFx0XHRcdHRoaXMuZXJyb3JMb2dnZXIubG9nRXJyb3IoJ1RPVFAgdmVyaWZpY2F0aW9uIGZhaWxlZCcpO1xuXHRcdFx0XHRcdFx0bmV4dChlcnIpO1xuXHRcdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0KVxuXHRcdCk7XG5cblx0XHR0aGlzLnJvdXRlci5wb3N0KFxuXHRcdFx0Jy9nZW5lcmF0ZS1lbWFpbC1tZmEnLFxuXHRcdFx0W1xuXHRcdFx0XHRjaGVjaygnZW1haWwnKVxuXHRcdFx0XHRcdC5pc0VtYWlsKClcblx0XHRcdFx0XHQud2l0aE1lc3NhZ2UoJ1BsZWFzZSBwcm92aWRlIGEgdmFsaWQgZW1haWwgYWRkcmVzcycpXG5cdFx0XHRcdFx0Lm5vcm1hbGl6ZUVtYWlsKCksXG5cdFx0XHRcdGhhbmRsZVZhbGlkYXRpb25FcnJvcnNcblx0XHRcdF0sXG5cdFx0XHR0aGlzLmFzeW5jSGFuZGxlcihcblx0XHRcdFx0YXN5bmMgKHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSwgbmV4dDogTmV4dEZ1bmN0aW9uKSA9PiB7XG5cdFx0XHRcdFx0Y29uc3QgY2FjaGVLZXkgPSBgZ2VuZXJhdGUtZW1haWwtbWZhOiR7cmVxLmJvZHkuZW1haWx9YDtcblx0XHRcdFx0XHRjb25zdCBjYWNoZWRSZXNwb25zZSA9IGF3YWl0IHRoaXMuY2FjaGVTZXJ2aWNlLmdldChcblx0XHRcdFx0XHRcdGNhY2hlS2V5LFxuXHRcdFx0XHRcdFx0J2dlbmVyYXRlRW1haWxNRkEnXG5cdFx0XHRcdFx0KTtcblx0XHRcdFx0XHRpZiAoY2FjaGVkUmVzcG9uc2UpIHtcblx0XHRcdFx0XHRcdHJldHVybiByZXMuanNvbihjYWNoZWRSZXNwb25zZSk7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHRcdGNvbnN0IGF1dGhDb250cm9sbGVyID0gYXdhaXQgdGhpcy5nZXRBdXRoQ29udHJvbGxlcigpO1xuXHRcdFx0XHRcdFx0YXdhaXQgYXV0aENvbnRyb2xsZXIuZ2VuZXJhdGVFbWFpbE1GQUNvZGUoXG5cdFx0XHRcdFx0XHRcdHJlcS5ib2R5LmVtYWlsXG5cdFx0XHRcdFx0XHQpO1xuXHRcdFx0XHRcdFx0Y29uc3QgcmVzcG9uc2UgPSB7IG1lc3NhZ2U6ICdNRkEgY29kZSBzZW50JyB9O1xuXHRcdFx0XHRcdFx0YXdhaXQgdGhpcy5jYWNoZVNlcnZpY2Uuc2V0KFxuXHRcdFx0XHRcdFx0XHRjYWNoZUtleSxcblx0XHRcdFx0XHRcdFx0cmVzcG9uc2UsXG5cdFx0XHRcdFx0XHRcdCdnZW5lcmF0ZUVtYWlsTUZBJyxcblx0XHRcdFx0XHRcdFx0MzYwMFxuXHRcdFx0XHRcdFx0KTtcblx0XHRcdFx0XHRcdHJldHVybiByZXMuanNvbihyZXNwb25zZSk7XG5cdFx0XHRcdFx0fSBjYXRjaCAoZXJyKSB7XG5cdFx0XHRcdFx0XHR0aGlzLmVycm9yTG9nZ2VyLmxvZ0Vycm9yKFxuXHRcdFx0XHRcdFx0XHQnRW1haWwgTUZBIGdlbmVyYXRpb24gZmFpbGVkJ1xuXHRcdFx0XHRcdFx0KTtcblx0XHRcdFx0XHRcdG5leHQoZXJyKTtcblx0XHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdClcblx0XHQpO1xuXG5cdFx0dGhpcy5yb3V0ZXIucG9zdChcblx0XHRcdCcvdmVyaWZ5LWVtYWlsLW1mYScsXG5cdFx0XHRbXG5cdFx0XHRcdGNoZWNrKCdlbWFpbCcpXG5cdFx0XHRcdFx0LmlzRW1haWwoKVxuXHRcdFx0XHRcdC53aXRoTWVzc2FnZSgnUGxlYXNlIHByb3ZpZGUgYSB2YWxpZCBlbWFpbCBhZGRyZXNzJylcblx0XHRcdFx0XHQubm9ybWFsaXplRW1haWwoKSxcblx0XHRcdFx0Y2hlY2soJ2VtYWlsTUZBQ29kZScpXG5cdFx0XHRcdFx0Lm5vdEVtcHR5KClcblx0XHRcdFx0XHQud2l0aE1lc3NhZ2UoJ01GQSBjb2RlIGlzIHJlcXVpcmVkJyksXG5cdFx0XHRcdGhhbmRsZVZhbGlkYXRpb25FcnJvcnNcblx0XHRcdF0sXG5cdFx0XHR0aGlzLmFzeW5jSGFuZGxlcihcblx0XHRcdFx0YXN5bmMgKHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSwgbmV4dDogTmV4dEZ1bmN0aW9uKSA9PiB7XG5cdFx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHRcdGNvbnN0IGF1dGhDb250cm9sbGVyID0gYXdhaXQgdGhpcy5nZXRBdXRoQ29udHJvbGxlcigpO1xuXHRcdFx0XHRcdFx0Y29uc3QgaXNWYWxpZCA9IGF3YWl0IGF1dGhDb250cm9sbGVyLnZlcmlmeUVtYWlsTUZBQ29kZShcblx0XHRcdFx0XHRcdFx0cmVxLmJvZHkuZW1haWwsXG5cdFx0XHRcdFx0XHRcdHJlcS5ib2R5LmVtYWlsMkZBQ29kZVxuXHRcdFx0XHRcdFx0KTtcblx0XHRcdFx0XHRcdHJldHVybiByZXMuanNvbih7IGlzVmFsaWQgfSk7XG5cdFx0XHRcdFx0fSBjYXRjaCAoZXJyKSB7XG5cdFx0XHRcdFx0XHR0aGlzLmVycm9yTG9nZ2VyLmxvZ0Vycm9yKFxuXHRcdFx0XHRcdFx0XHQnRW1haWwgMkZBIHZlcmlmaWNhdGlvbiBmYWlsZWQnXG5cdFx0XHRcdFx0XHQpO1xuXHRcdFx0XHRcdFx0bmV4dChlcnIpO1xuXHRcdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0KVxuXHRcdCk7XG5cdH1cblxuXHRwdWJsaWMgZ2V0QVBJUm91dGVyKCk6IFJvdXRlciB7XG5cdFx0cmV0dXJuIHRoaXMucm91dGVyO1xuXHR9XG59XG5cbmV4cG9ydCBjbGFzcyBIZWFsdGhSb3V0ZXIgZXh0ZW5kcyBCYXNlUm91dGVyIHtcblx0cHJpdmF0ZSBoZWFsdGhDaGVja1NlcnZpY2UhOiBIZWFsdGhDaGVja1NlcnZpY2VJbnRlcmZhY2U7XG5cdHByaXZhdGUgYWNjZXNzQ29udHJvbCE6IEFjY2Vzc0NvbnRyb2xNaWRkbGV3YXJlU2VydmljZUludGVyZmFjZTtcblx0cHJpdmF0ZSBjc3JmTWlkZGxld2FyZSE6IENTUkZNaWRkbGV3YXJlU2VydmljZUludGVyZmFjZTtcblx0cHJpdmF0ZSBjYWNoZVRUTDogbnVtYmVyID0gMzAwO1xuXG5cdHB1YmxpYyBjb25zdHJ1Y3Rvcihcblx0XHRsb2dnZXI6IEFwcExvZ2dlclNlcnZpY2VJbnRlcmZhY2UsXG5cdFx0ZXJyb3JMb2dnZXI6IEVycm9yTG9nZ2VyU2VydmljZUludGVyZmFjZSxcblx0XHRlcnJvckhhbmRsZXI6IEVycm9ySGFuZGxlclNlcnZpY2VJbnRlcmZhY2UsXG5cdFx0ZW52Q29uZmlnOiBFbnZDb25maWdTZXJ2aWNlSW50ZXJmYWNlLFxuXHRcdGNhY2hlU2VydmljZTogQ2FjaGVTZXJ2aWNlSW50ZXJmYWNlLFxuXHRcdGdhdGVrZWVwZXJTZXJ2aWNlOiBHYXRla2VlcGVyU2VydmljZUludGVyZmFjZSxcblx0XHRoZWxtZXRTZXJ2aWNlOiBIZWxtZXRNaWRkbGV3YXJlU2VydmljZUludGVyZmFjZSxcblx0XHRKV1RNaWRkbGV3YXJlOiBKV1RBdXRoTWlkZGxld2FyZVNlcnZpY2VJbnRlcmZhY2UsXG5cdFx0cGFzc3BvcnRNaWRkbGV3YXJlOiBQYXNzcG9ydEF1dGhNaWRkbGV3YXJlU2VydmljZUludGVyZmFjZVxuXHQpIHtcblx0XHRzdXBlcihcblx0XHRcdGxvZ2dlcixcblx0XHRcdGVycm9yTG9nZ2VyLFxuXHRcdFx0ZXJyb3JIYW5kbGVyLFxuXHRcdFx0ZW52Q29uZmlnLFxuXHRcdFx0Y2FjaGVTZXJ2aWNlLFxuXHRcdFx0Z2F0ZWtlZXBlclNlcnZpY2UsXG5cdFx0XHRoZWxtZXRTZXJ2aWNlLFxuXHRcdFx0SldUTWlkZGxld2FyZSxcblx0XHRcdHBhc3Nwb3J0TWlkZGxld2FyZVxuXHRcdCk7XG5cblx0XHR0aGlzLmluaXRpYWxpemVTZXJ2aWNlcygpLnRoZW4oKCkgPT4ge1xuXHRcdFx0dGhpcy5yb3V0ZXIudXNlKHRoaXMuY3NyZk1pZGRsZXdhcmUuaW5pdGlhbGl6ZUNTUkZNaWRkbGV3YXJlKCkpO1xuXHRcdFx0dGhpcy5zZXR1cFJvdXRlcygpO1xuXHRcdH0pO1xuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyBpbml0aWFsaXplU2VydmljZXMoKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0dGhpcy5oZWFsdGhDaGVja1NlcnZpY2UgPVxuXHRcdFx0YXdhaXQgSGVhbHRoQ2hlY2tTZXJ2aWNlRmFjdG9yeS5nZXRIZWFsdGhDaGVja1NlcnZpY2UoKTtcblx0XHR0aGlzLmFjY2Vzc0NvbnRyb2wgPVxuXHRcdFx0YXdhaXQgQWNjZXNzQ29udHJvbE1pZGRsZXdhcmVGYWN0b3J5LmdldEFjY2Vzc0NvbnRyb2xNaWRkbGV3YXJlU2VydmljZSgpO1xuXHRcdHRoaXMuY3NyZk1pZGRsZXdhcmUgPSBhd2FpdCBNaWRkbGV3YXJlRmFjdG9yeS5nZXRDU1JGTWlkZGxld2FyZSgpO1xuXHRcdHRoaXMuY2FjaGVUVEwgPSBzZXJ2aWNlVFRMQ29uZmlnLkhlYWx0aFJvdXRlciB8fCAzMDA7XG5cdH1cblxuXHRwcml2YXRlIHNldHVwUm91dGVzKCk6IHZvaWQge1xuXHRcdHRoaXMucm91dGVyLmdldChcblx0XHRcdCcvaGVhbHRoLmh0bWwnLFxuXHRcdFx0dGhpcy5hY2Nlc3NDb250cm9sLnJlc3RyaWN0VG8oJ2FkbWluJyksXG5cdFx0XHR0aGlzLmFzeW5jSGFuZGxlcihcblx0XHRcdFx0YXN5bmMgKHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSwgbmV4dDogTmV4dEZ1bmN0aW9uKSA9PiB7XG5cdFx0XHRcdFx0Y29uc3QgY2FjaGVLZXkgPSAnaGVhbHRoQ2hlY2tEYXRhJztcblxuXHRcdFx0XHRcdHRyeSB7XG5cdFx0XHRcdFx0XHRjb25zdCBjYWNoZWREYXRhID0gYXdhaXQgdGhpcy5jYWNoZVNlcnZpY2UuZ2V0KFxuXHRcdFx0XHRcdFx0XHRjYWNoZUtleSxcblx0XHRcdFx0XHRcdFx0J2hlYWx0aENoZWNrJ1xuXHRcdFx0XHRcdFx0KTtcblxuXHRcdFx0XHRcdFx0aWYgKGNhY2hlZERhdGEpIHtcblx0XHRcdFx0XHRcdFx0dGhpcy5sb2dnZXIuaW5mbyhcblx0XHRcdFx0XHRcdFx0XHQnUmV0dXJuaW5nIGNhY2hlZCBoZWFsdGggY2hlY2sgZGF0YSdcblx0XHRcdFx0XHRcdFx0KTtcblx0XHRcdFx0XHRcdFx0cmVzLmpzb24oY2FjaGVkRGF0YSk7XG5cdFx0XHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0Y29uc3QgaGVhbHRoRGF0YSA9XG5cdFx0XHRcdFx0XHRcdGF3YWl0IHRoaXMuaGVhbHRoQ2hlY2tTZXJ2aWNlLnBlcmZvcm1IZWFsdGhDaGVjaygpO1xuXHRcdFx0XHRcdFx0YXdhaXQgdGhpcy5jYWNoZVNlcnZpY2Uuc2V0KFxuXHRcdFx0XHRcdFx0XHRjYWNoZUtleSxcblx0XHRcdFx0XHRcdFx0aGVhbHRoRGF0YSxcblx0XHRcdFx0XHRcdFx0J2hlYWx0aENoZWNrJyxcblx0XHRcdFx0XHRcdFx0dGhpcy5jYWNoZVRUTFxuXHRcdFx0XHRcdFx0KTtcblxuXHRcdFx0XHRcdFx0dGhpcy5sb2dnZXIuaW5mbyhcblx0XHRcdFx0XHRcdFx0J0hlYWx0aCBjaGVjayBkYXRhIGNhY2hlZCBzdWNjZXNzZnVsbHknXG5cdFx0XHRcdFx0XHQpO1xuXHRcdFx0XHRcdFx0cmVzLmpzb24oaGVhbHRoRGF0YSk7XG5cdFx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdFx0fSBjYXRjaCAoZXJyKSB7XG5cdFx0XHRcdFx0XHRuZXh0KGVycik7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHQpXG5cdFx0KTtcblx0fVxufVxuXG5leHBvcnQgY2xhc3MgU3RhdGljUm91dGVyIGV4dGVuZHMgQmFzZVJvdXRlciBpbXBsZW1lbnRzIFN0YXRpY1JvdXRlckludGVyZmFjZSB7XG5cdHByaXZhdGUgc3RhdGljUm9vdFBhdGggPSB0aGlzLmVudkNvbmZpZy5nZXRFbnZWYXJpYWJsZSgnc3RhdGljUm9vdFBhdGgnKTtcblxuXHRwcml2YXRlIHZhbGlkQ1NTRmlsZXM6IEZpbGVUeXBlUmVjb3JkcyA9IHt9O1xuXHRwcml2YXRlIHZhbGlkRm9udEZpbGVzOiBGaWxlVHlwZVJlY29yZHMgPSB7fTtcblx0cHJpdmF0ZSB2YWxpZEhUTUxGaWxlczogRmlsZVR5cGVSZWNvcmRzID0ge307XG5cdHByaXZhdGUgdmFsaWRJY29uRmlsZXM6IEZpbGVUeXBlUmVjb3JkcyA9IHt9O1xuXHRwcml2YXRlIHZhbGlkSW1hZ2VGaWxlczogRmlsZVR5cGVSZWNvcmRzID0ge307XG5cdHByaXZhdGUgdmFsaWRKU0ZpbGVzOiBGaWxlVHlwZVJlY29yZHMgPSB7fTtcblx0cHJpdmF0ZSB2YWxpZExvZ29GaWxlczogRmlsZVR5cGVSZWNvcmRzID0ge307XG5cdHByaXZhdGUgdmFsaWRNREZpbGVzOiBGaWxlVHlwZVJlY29yZHMgPSB7fTtcblx0cHJpdmF0ZSB2YWxpZFRYVEZpbGVzOiBGaWxlVHlwZVJlY29yZHMgPSB7fTtcblx0cHJpdmF0ZSB2YWxpZFhNTEZpbGVzOiBGaWxlVHlwZVJlY29yZHMgPSB7fTtcblxuXHRwcml2YXRlIGNzc0RpcmVjdG9yeSA9IHBhdGguam9pbih0aGlzLnN0YXRpY1Jvb3RQYXRoLCAnY3NzJyk7XG5cdHByaXZhdGUgZm9udERpcmVjdG9yeSA9IHBhdGguam9pbih0aGlzLnN0YXRpY1Jvb3RQYXRoLCAnYXNzZXRzL2ZvbnRzJyk7XG5cdHByaXZhdGUgaHRtbERpcmVjdG9yeSA9IHRoaXMuc3RhdGljUm9vdFBhdGg7XG5cdHByaXZhdGUgaWNvbkRpcmVjdG9yeSA9IHBhdGguam9pbih0aGlzLnN0YXRpY1Jvb3RQYXRoLCAnYXNzZXRzL2ljb25zJyk7XG5cdHByaXZhdGUgaW1hZ2VEaXJlY3RvcnkgPSBwYXRoLmpvaW4odGhpcy5zdGF0aWNSb290UGF0aCwgJ2Fzc2V0cy9pbWFnZXMnKTtcblx0cHJpdmF0ZSBqc0RpcmVjdG9yeSA9IHBhdGguam9pbih0aGlzLnN0YXRpY1Jvb3RQYXRoLCAnZGlzdCcpO1xuXHRwcml2YXRlIGxvZ29EaXJlY3RvcnkgPSBwYXRoLmpvaW4odGhpcy5zdGF0aWNSb290UGF0aCwgJ2Fzc2V0cy9sb2dvcycpO1xuXHRwcml2YXRlIG1kRGlyZWN0b3J5ID0gdGhpcy5zdGF0aWNSb290UGF0aDtcblx0cHJpdmF0ZSB0eHREaXJlY3RvcnkgPSB0aGlzLnN0YXRpY1Jvb3RQYXRoO1xuXHRwcml2YXRlIHhtbERpcmVjdG9yeSA9IHRoaXMuc3RhdGljUm9vdFBhdGg7XG5cblx0cHJpdmF0ZSBmb3JiaWRkZW5EaXJlY3Rvcmllczogc3RyaW5nW10gPSBbXTtcblx0cHJpdmF0ZSBmb3JiaWRkZW5FeHRlbnNpb25zOiBzdHJpbmdbXSA9IFtdO1xuXHRwcml2YXRlIGZvcmJpZGRlbkZpbGVzOiBzdHJpbmdbXSA9IFtdO1xuXHRwcml2YXRlIHZhbGlkRGlyZWN0b3JpZXM6IHN0cmluZ1tdID0gW107XG5cdHByaXZhdGUgdmFsaWRFeHRlbnNpb25zOiBzdHJpbmdbXSA9IFtdO1xuXHRwcml2YXRlIGNhY2hlVFRMcyA9IGZpbGVDYWNoZVRUTENvbmZpZztcblxuXHRwdWJsaWMgY29uc3RydWN0b3IoXG5cdFx0bG9nZ2VyOiBBcHBMb2dnZXJTZXJ2aWNlSW50ZXJmYWNlLFxuXHRcdGVycm9yTG9nZ2VyOiBFcnJvckxvZ2dlclNlcnZpY2VJbnRlcmZhY2UsXG5cdFx0ZXJyb3JIYW5kbGVyOiBFcnJvckhhbmRsZXJTZXJ2aWNlSW50ZXJmYWNlLFxuXHRcdGVudkNvbmZpZzogRW52Q29uZmlnU2VydmljZUludGVyZmFjZSxcblx0XHRjYWNoZVNlcnZpY2U6IENhY2hlU2VydmljZUludGVyZmFjZSxcblx0XHRnYXRla2VlcGVyU2VydmljZTogR2F0ZWtlZXBlclNlcnZpY2VJbnRlcmZhY2UsXG5cdFx0aGVsbWV0U2VydmljZTogSGVsbWV0TWlkZGxld2FyZVNlcnZpY2VJbnRlcmZhY2UsXG5cdFx0SldUTWlkZGxld2FyZTogSldUQXV0aE1pZGRsZXdhcmVTZXJ2aWNlSW50ZXJmYWNlLFxuXHRcdHBhc3Nwb3J0TWlkZGxld2FyZTogUGFzc3BvcnRBdXRoTWlkZGxld2FyZVNlcnZpY2VJbnRlcmZhY2Vcblx0KSB7XG5cdFx0c3VwZXIoXG5cdFx0XHRsb2dnZXIsXG5cdFx0XHRlcnJvckxvZ2dlcixcblx0XHRcdGVycm9ySGFuZGxlcixcblx0XHRcdGVudkNvbmZpZyxcblx0XHRcdGNhY2hlU2VydmljZSxcblx0XHRcdGdhdGVrZWVwZXJTZXJ2aWNlLFxuXHRcdFx0aGVsbWV0U2VydmljZSxcblx0XHRcdEpXVE1pZGRsZXdhcmUsXG5cdFx0XHRwYXNzcG9ydE1pZGRsZXdhcmVcblx0XHQpO1xuXHR9XG5cblx0cHVibGljIGFzeW5jIGluaXRpYWxpemVTdGF0aWNSb3V0ZXIoKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0d2l0aFJldHJ5KFxuXHRcdFx0YXN5bmMgKCkgPT4ge1xuXHRcdFx0XHRhd2FpdCB0aGlzLmltcG9ydFJ1bGVzKCk7XG5cdFx0XHRcdGF3YWl0IHRoaXMudmFsaWRhdGVDb25maWd1cmF0aW9uKCk7XG5cblx0XHRcdFx0Y29uc3Qgcm91dGVyUnVsZXMgPSBhd2FpdCBpbXBvcnQoJy4uL2NvbmZpZy9yb3V0ZXJSdWxlcycpO1xuXHRcdFx0XHRjb25zdCB2YWxpZGF0aW9uSW50ZXJ2YWxzID0gcm91dGVyUnVsZXMudmFsaWRhdGlvbkludGVydmFscztcblxuXHRcdFx0XHR0aGlzLnNldFVwUGVyaW9kaWNWYWxpZGF0aW9uKFxuXHRcdFx0XHRcdHRoaXMuY3NzRGlyZWN0b3J5LFxuXHRcdFx0XHRcdHRoaXMudmFsaWRDU1NGaWxlcyxcblx0XHRcdFx0XHR0aGlzLnZhbGlkQ1NTRmlsZXMsXG5cdFx0XHRcdFx0WycuY3NzJ10sXG5cdFx0XHRcdFx0dmFsaWRhdGlvbkludGVydmFscy5jc3Ncblx0XHRcdFx0KTtcblxuXHRcdFx0XHR0aGlzLnNldFVwUGVyaW9kaWNWYWxpZGF0aW9uKFxuXHRcdFx0XHRcdHRoaXMuZm9udERpcmVjdG9yeSxcblx0XHRcdFx0XHR0aGlzLnZhbGlkRm9udEZpbGVzLFxuXHRcdFx0XHRcdHRoaXMudmFsaWRGb250RmlsZXMsXG5cdFx0XHRcdFx0WycudHRmJ10sXG5cdFx0XHRcdFx0dmFsaWRhdGlvbkludGVydmFscy5mb250XG5cdFx0XHRcdCk7XG5cblx0XHRcdFx0dGhpcy5zZXRVcFBlcmlvZGljVmFsaWRhdGlvbihcblx0XHRcdFx0XHR0aGlzLmh0bWxEaXJlY3RvcnksXG5cdFx0XHRcdFx0dGhpcy52YWxpZEhUTUxGaWxlcyxcblx0XHRcdFx0XHR0aGlzLnZhbGlkSFRNTEZpbGVzLFxuXHRcdFx0XHRcdFsnLmh0bWwnXSxcblx0XHRcdFx0XHR2YWxpZGF0aW9uSW50ZXJ2YWxzLmh0bWxcblx0XHRcdFx0KTtcblxuXHRcdFx0XHR0aGlzLnNldFVwUGVyaW9kaWNWYWxpZGF0aW9uKFxuXHRcdFx0XHRcdHRoaXMuaWNvbkRpcmVjdG9yeSxcblx0XHRcdFx0XHR0aGlzLnZhbGlkSWNvbkZpbGVzLFxuXHRcdFx0XHRcdHRoaXMudmFsaWRJY29uRmlsZXMsXG5cdFx0XHRcdFx0WycucG5nJ10sXG5cdFx0XHRcdFx0dmFsaWRhdGlvbkludGVydmFscy5pY29uXG5cdFx0XHRcdCk7XG5cblx0XHRcdFx0dGhpcy5zZXRVcFBlcmlvZGljVmFsaWRhdGlvbihcblx0XHRcdFx0XHR0aGlzLmltYWdlRGlyZWN0b3J5LFxuXHRcdFx0XHRcdHRoaXMudmFsaWRJbWFnZUZpbGVzLFxuXHRcdFx0XHRcdHRoaXMudmFsaWRJbWFnZUZpbGVzLFxuXHRcdFx0XHRcdFsnLmJtcCcsICcuanBnJywgJy5qcGVnJywgJy5wbmcnLCAnLmdpZicsICcud2VicCddLFxuXHRcdFx0XHRcdHZhbGlkYXRpb25JbnRlcnZhbHMuaW1hZ2Vcblx0XHRcdFx0KTtcblxuXHRcdFx0XHR0aGlzLnNldFVwUGVyaW9kaWNWYWxpZGF0aW9uKFxuXHRcdFx0XHRcdHRoaXMuanNEaXJlY3RvcnksXG5cdFx0XHRcdFx0dGhpcy52YWxpZEpTRmlsZXMsXG5cdFx0XHRcdFx0dGhpcy52YWxpZEpTRmlsZXMsXG5cdFx0XHRcdFx0WycuanMnXSxcblx0XHRcdFx0XHR2YWxpZGF0aW9uSW50ZXJ2YWxzLmpzXG5cdFx0XHRcdCk7XG5cblx0XHRcdFx0dGhpcy5zZXRVcFBlcmlvZGljVmFsaWRhdGlvbihcblx0XHRcdFx0XHR0aGlzLmxvZ29EaXJlY3RvcnksXG5cdFx0XHRcdFx0dGhpcy52YWxpZExvZ29GaWxlcyxcblx0XHRcdFx0XHR0aGlzLnZhbGlkTG9nb0ZpbGVzLFxuXHRcdFx0XHRcdFsnLnN2ZyddLFxuXHRcdFx0XHRcdHZhbGlkYXRpb25JbnRlcnZhbHMubG9nb1xuXHRcdFx0XHQpO1xuXG5cdFx0XHRcdHRoaXMuc2V0VXBQZXJpb2RpY1ZhbGlkYXRpb24oXG5cdFx0XHRcdFx0dGhpcy5tZERpcmVjdG9yeSxcblx0XHRcdFx0XHR0aGlzLnZhbGlkTURGaWxlcyxcblx0XHRcdFx0XHR0aGlzLnZhbGlkTURGaWxlcyxcblx0XHRcdFx0XHRbJy5tZCddLFxuXHRcdFx0XHRcdHZhbGlkYXRpb25JbnRlcnZhbHMubWRcblx0XHRcdFx0KTtcblxuXHRcdFx0XHR0aGlzLnNldFVwUGVyaW9kaWNWYWxpZGF0aW9uKFxuXHRcdFx0XHRcdHRoaXMudHh0RGlyZWN0b3J5LFxuXHRcdFx0XHRcdHRoaXMudmFsaWRUWFRGaWxlcyxcblx0XHRcdFx0XHR0aGlzLnZhbGlkVFhURmlsZXMsXG5cdFx0XHRcdFx0WycudHh0J10sXG5cdFx0XHRcdFx0dmFsaWRhdGlvbkludGVydmFscy50eHRcblx0XHRcdFx0KTtcblxuXHRcdFx0XHR0aGlzLnNldFVwUGVyaW9kaWNWYWxpZGF0aW9uKFxuXHRcdFx0XHRcdHRoaXMueG1sRGlyZWN0b3J5LFxuXHRcdFx0XHRcdHRoaXMudmFsaWRYTUxGaWxlcyxcblx0XHRcdFx0XHR0aGlzLnZhbGlkWE1MRmlsZXMsXG5cdFx0XHRcdFx0WycueG1sJ10sXG5cdFx0XHRcdFx0dmFsaWRhdGlvbkludGVydmFscy54bWxcblx0XHRcdFx0KTtcblx0XHRcdH0sXG5cdFx0XHQ1LFxuXHRcdFx0MTAwMFxuXHRcdCk7XG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIGltcG9ydFJ1bGVzKCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdHRyeSB7XG5cdFx0XHRjb25zdCByb3V0ZXJSdWxlcyA9IGF3YWl0IGltcG9ydCgnLi4vY29uZmlnL3JvdXRlclJ1bGVzJyk7XG5cblx0XHRcdHRoaXMuZm9yYmlkZGVuRGlyZWN0b3JpZXMgPSByb3V0ZXJSdWxlcy5mb3JiaWRkZW5EaXJlY3Rvcmllcztcblx0XHRcdHRoaXMuZm9yYmlkZGVuRXh0ZW5zaW9ucyA9IHJvdXRlclJ1bGVzLmZvcmJpZGRlbkV4dGVuc2lvbnM7XG5cdFx0XHR0aGlzLmZvcmJpZGRlbkZpbGVzID0gcm91dGVyUnVsZXMuZm9yYmlkZGVuRmlsZXM7XG5cdFx0XHR0aGlzLnZhbGlkRGlyZWN0b3JpZXMgPSByb3V0ZXJSdWxlcy52YWxpZERpcmVjdG9yaWVzO1xuXHRcdFx0dGhpcy52YWxpZEV4dGVuc2lvbnMgPSByb3V0ZXJSdWxlcy52YWxpZEV4dGVuc2lvbnM7XG5cdFx0XHR0aGlzLnZhbGlkQ1NTRmlsZXMgPSByb3V0ZXJSdWxlcy52YWxpZENTU0ZpbGVzO1xuXHRcdFx0dGhpcy52YWxpZEZvbnRGaWxlcyA9IHJvdXRlclJ1bGVzLnZhbGlkRm9udEZpbGVzO1xuXHRcdFx0dGhpcy52YWxpZEhUTUxGaWxlcyA9IHJvdXRlclJ1bGVzLnZhbGlkSFRNTEZpbGVzO1xuXHRcdFx0dGhpcy52YWxpZE1ERmlsZXMgPSByb3V0ZXJSdWxlcy52YWxpZE1ERmlsZXM7XG5cdFx0XHR0aGlzLnZhbGlkVFhURmlsZXMgPSByb3V0ZXJSdWxlcy52YWxpZFRYVEZpbGVzO1xuXHRcdFx0dGhpcy52YWxpZFhNTEZpbGVzID0gcm91dGVyUnVsZXMudmFsaWRYTUxGaWxlcztcblxuXHRcdFx0dGhpcy5sb2dnZXIuaW5mbygnU3RhdGljIFJvdXRlciBydWxlcyBpbXBvcnRlZCBzdWNjZXNzZnVsbHknKTtcblx0XHR9IGNhdGNoIChlcnJvcikge1xuXHRcdFx0dGhpcy5sb2dnZXIuZXJyb3IoXG5cdFx0XHRcdGBGYWlsZWQgdG8gaW1wb3J0IHJvdXRlciBydWxlc1xcbiR7RXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yIDogJ1Vua25vd24gZXJyb3InfWBcblx0XHRcdCk7XG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyB2YWxpZGF0ZUNvbmZpZ3VyYXRpb24oKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0dmFsaWRhdGVEZXBlbmRlbmNpZXMoXG5cdFx0XHRbeyBuYW1lOiAnc3RhdGljUm9vdFBhdGgnLCBpbnN0YW5jZTogdGhpcy5zdGF0aWNSb290UGF0aCB9XSxcblx0XHRcdHRoaXMubG9nZ2VyXG5cdFx0KTtcblxuXHRcdGlmICghdGhpcy5zdGF0aWNSb290UGF0aCB8fCB0eXBlb2YgdGhpcy5zdGF0aWNSb290UGF0aCAhPT0gJ3N0cmluZycpIHtcblx0XHRcdHRocm93IG5ldyB0aGlzLmVycm9ySGFuZGxlci5FcnJvckNsYXNzZXMuQ29uZmlndXJhdGlvbkVycm9yKFxuXHRcdFx0XHQnSW52YWxpZCBzdGF0aWNSb290UGF0aDogbXVzdCBiZSBhIG5vbi1lbXB0eSBzdHJpbmcnLFxuXHRcdFx0XHR7IGV4cG9zZVRvQ2xpZW50OiBmYWxzZSB9XG5cdFx0XHQpO1xuXHRcdH1cblxuXHRcdGF3YWl0IHdpdGhSZXRyeSgoKSA9PiB0aGlzLmltcG9ydFJ1bGVzKCksIDMsIDEwMDApO1xuXHR9XG5cblx0cHVibGljIGFzeW5jIGhhbmRsZVJlcXVlc3QoXG5cdFx0cmVxOiBSZXF1ZXN0LFxuXHRcdHJlczogUmVzcG9uc2UsXG5cdFx0bmV4dDogTmV4dEZ1bmN0aW9uXG5cdCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdGNvbnN0IGZpbGVQYXRoID0gcGF0aC5qb2luKHRoaXMuc3RhdGljUm9vdFBhdGgsIHJlcS5wYXRoKTtcblxuXHRcdGlmIChyZXEucGF0aCA9PT0gJy8nKSB7XG5cdFx0XHRhd2FpdCB0aGlzLnNlcnZlSW5kZXhGaWxlKHJlcSwgcmVzLCBuZXh0KTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0YXdhaXQgdGhpcy5zZXJ2ZVN0YXRpY0ZpbGUoZmlsZVBhdGgsIHJlcS5wYXRoLCByZXEsIHJlcywgbmV4dCk7XG5cdFx0fVxuXHR9XG5cblx0Ly8gKkRFVi1OT1RFKiB0aGlzIHNob3VsZCB3b3JrIHdpdGggR2F0ZWtlZXBlciB0byB0cmFjayBhbnkgSVAgdGhhdCBpcyBtYWtpbmcgZGlyZWN0b3J5IHRyYXZlcnNhbCBhdHRlbXB0cyBhbmQgYWN0IGFjY29yZGluZ2x5XG5cdHByaXZhdGUgYXN5bmMgc2VydmVTdGF0aWNGaWxlKFxuXHRcdGZpbGVQYXRoOiBzdHJpbmcsXG5cdFx0cm91dGU6IHN0cmluZyxcblx0XHRyZXE6IFJlcXVlc3QsXG5cdFx0cmVzOiBSZXNwb25zZSxcblx0XHRuZXh0OiBOZXh0RnVuY3Rpb25cblx0KTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0Y29uc3QgY2FjaGVLZXkgPSB0aGlzLmdldENhY2hlS2V5KHJvdXRlKTtcblx0XHRjb25zdCBmaWxlRXh0ZW5zaW9uID0gcGF0aC5leHRuYW1lKGZpbGVQYXRoKTtcblx0XHRjb25zdCBjYWNoZVRUTCA9IHRoaXMuZ2V0Q2FjaGVUVEwoZmlsZUV4dGVuc2lvbik7XG5cblx0XHRhd2FpdCB3aXRoUmV0cnkoXG5cdFx0XHRhc3luYyAoKSA9PiB7XG5cdFx0XHRcdGF3YWl0IHRoaXMuYmxvY2tGb3JiaWRkZW5GaWxlcyhyZXEsIHJlcywgbmV4dCk7XG5cblx0XHRcdFx0Y29uc3QgY2FjaGVkRmlsZSA9IGF3YWl0IHRoaXMuY2FjaGVTZXJ2aWNlLmdldDxzdHJpbmc+KFxuXHRcdFx0XHRcdGNhY2hlS2V5LFxuXHRcdFx0XHRcdCdzdGF0aWMtZmlsZXMnXG5cdFx0XHRcdCk7XG5cblx0XHRcdFx0aWYgKGNhY2hlZEZpbGUpIHtcblx0XHRcdFx0XHR0aGlzLmxvZ2dlci5pbmZvKGBTZXJ2aW5nIGZpbGUgZnJvbSBjYWNoZTogJHtjYWNoZUtleX1gKTtcblx0XHRcdFx0XHRyZXMuc2VuZChjYWNoZWRGaWxlKTtcblx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRjb25zdCByZXNvbHZlZFBhdGggPSBwYXRoLnJlc29sdmUoZmlsZVBhdGgpO1xuXHRcdFx0XHRjb25zdCBhbGxvd2VkUGF0aCA9IHBhdGgucmVzb2x2ZSh0aGlzLnN0YXRpY1Jvb3RQYXRoKTtcblxuXHRcdFx0XHRpZiAoIXJlc29sdmVkUGF0aC5zdGFydHNXaXRoKGFsbG93ZWRQYXRoKSkge1xuXHRcdFx0XHRcdHRoaXMubG9nZ2VyLndhcm4oXG5cdFx0XHRcdFx0XHRgQXR0ZW1wdGVkIGRpcmVjdG9yeSB0cmF2ZXJzYWwgYnkgJHtyZXEuaXB9IHRvICR7cmVxLnVybH1gXG5cdFx0XHRcdFx0KTtcblx0XHRcdFx0XHRyZXMuc3RhdHVzKDQwMykuanNvbih7IG1lc3NhZ2U6ICdBY2Nlc3MgZGVuaWVkJyB9KTtcblx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRjb25zdCBleHQgPSBwYXRoLmV4dG5hbWUocmVzb2x2ZWRQYXRoKTtcblx0XHRcdFx0bGV0IHNlcnZlRnVuY3Rpb246IChcblx0XHRcdFx0XHRyZXE6IFJlcXVlc3QsXG5cdFx0XHRcdFx0cmVzOiBSZXNwb25zZSxcblx0XHRcdFx0XHRuZXh0OiBOZXh0RnVuY3Rpb25cblx0XHRcdFx0KSA9PiBQcm9taXNlPHZvaWQ+O1xuXG5cdFx0XHRcdHN3aXRjaCAoZXh0KSB7XG5cdFx0XHRcdFx0Y2FzZSAnLmh0bWwnOlxuXHRcdFx0XHRcdFx0c2VydmVGdW5jdGlvbiA9IHRoaXMuc2VydmVIVE1MRmlsZS5iaW5kKHRoaXMpO1xuXHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0Y2FzZSAnLmNzcyc6XG5cdFx0XHRcdFx0XHRzZXJ2ZUZ1bmN0aW9uID0gdGhpcy5zZXJ2ZUNTU0ZpbGUuYmluZCh0aGlzKTtcblx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdGNhc2UgJy5qcyc6XG5cdFx0XHRcdFx0XHRzZXJ2ZUZ1bmN0aW9uID0gdGhpcy5zZXJ2ZUpTRmlsZS5iaW5kKHRoaXMpO1xuXHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0Y2FzZSAnLmljbyc6XG5cdFx0XHRcdFx0XHRzZXJ2ZUZ1bmN0aW9uID0gdGhpcy5zZXJ2ZUljb25GaWxlLmJpbmQodGhpcyk7XG5cdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHRjYXNlICcucG5nJzpcblx0XHRcdFx0XHRjYXNlICcuanBnJzpcblx0XHRcdFx0XHRjYXNlICcuanBlZyc6XG5cdFx0XHRcdFx0Y2FzZSAnLmdpZic6XG5cdFx0XHRcdFx0XHRzZXJ2ZUZ1bmN0aW9uID0gdGhpcy5zZXJ2ZUltYWdlRmlsZS5iaW5kKHRoaXMpO1xuXHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0Y2FzZSAnLndlYnAnOlxuXHRcdFx0XHRcdFx0c2VydmVGdW5jdGlvbiA9IHRoaXMuc2VydmVMb2dvRmlsZS5iaW5kKHRoaXMpO1xuXHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0Y2FzZSAnLm1kJzpcblx0XHRcdFx0XHRcdHNlcnZlRnVuY3Rpb24gPSB0aGlzLnNlcnZlTURGaWxlLmJpbmQodGhpcyk7XG5cdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHRjYXNlICcudHh0Jzpcblx0XHRcdFx0XHRcdHNlcnZlRnVuY3Rpb24gPSB0aGlzLnNlcnZlVFhURmlsZS5iaW5kKHRoaXMpO1xuXHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0Y2FzZSAnLnhtbCc6XG5cdFx0XHRcdFx0XHRzZXJ2ZUZ1bmN0aW9uID0gdGhpcy5zZXJ2ZVhNTEZpbGUuYmluZCh0aGlzKTtcblx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdGRlZmF1bHQ6XG5cdFx0XHRcdFx0XHRzZXJ2ZUZ1bmN0aW9uID0gdGhpcy5zZXJ2ZU5vdEZvdW5kUGFnZS5iaW5kKHRoaXMpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHRhd2FpdCBzZXJ2ZUZ1bmN0aW9uKHJlcSwgcmVzLCBuZXh0KTtcblxuXHRcdFx0XHRcdGNvbnN0IGZpbGVDb250ZW50ID1cblx0XHRcdFx0XHRcdGF3YWl0IHRoaXMucmVhZEZpbGVDb250ZW50KHJlc29sdmVkUGF0aCk7XG5cdFx0XHRcdFx0YXdhaXQgdGhpcy5jYWNoZVNlcnZpY2Uuc2V0KFxuXHRcdFx0XHRcdFx0Y2FjaGVLZXksXG5cdFx0XHRcdFx0XHRmaWxlQ29udGVudCxcblx0XHRcdFx0XHRcdCdzdGF0aWMtZmlsZXMnLFxuXHRcdFx0XHRcdFx0Y2FjaGVUVExcblx0XHRcdFx0XHQpO1xuXG5cdFx0XHRcdFx0dGhpcy5sb2dnZXIuZGVidWcoXG5cdFx0XHRcdFx0XHRgU2VydmVkIGFuZCBjYWNoZWQgc3RhdGljIGZpbGU6ICR7cm91dGV9IHdpdGggVFRMOiAke2NhY2hlVFRMfSBzZWNvbmRzYFxuXHRcdFx0XHRcdCk7XG5cdFx0XHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHRcdFx0dGhpcy5lcnJvckxvZ2dlci5sb2dFcnJvcihcblx0XHRcdFx0XHRcdGBFcnJvciBzZXJ2aW5nIHN0YXRpYyBmaWxlICR7cm91dGV9OiAke1xuXHRcdFx0XHRcdFx0XHRlcnJvciBpbnN0YW5jZW9mIEVycm9yXG5cdFx0XHRcdFx0XHRcdFx0PyBlcnJvci5tZXNzYWdlXG5cdFx0XHRcdFx0XHRcdFx0OiAnVW5rbm93biBlcnJvcidcblx0XHRcdFx0XHRcdH1gXG5cdFx0XHRcdFx0KTtcblx0XHRcdFx0XHR0aGlzLmVycm9ySGFuZGxlci5zZW5kQ2xpZW50RXJyb3JSZXNwb25zZSh7XG5cdFx0XHRcdFx0XHRtZXNzYWdlOiBgJHtyb3V0ZX0gbm90IGZvdW5kYCxcblx0XHRcdFx0XHRcdHN0YXR1c0NvZGU6IDQwNCxcblx0XHRcdFx0XHRcdHJlc1xuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdG5leHQoZXJyb3IpO1xuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdFx0Myxcblx0XHRcdDUwMFxuXHRcdCk7XG5cdH1cblxuXHRwcml2YXRlIGdldENhY2hlVFRMKGZpbGVFeHRlbnNpb246IHN0cmluZyk6IG51bWJlciB7XG5cdFx0cmV0dXJuIHRoaXMuY2FjaGVUVExzW2ZpbGVFeHRlbnNpb25dIHx8IHRoaXMuY2FjaGVUVExzWydkZWZhdWx0J107XG5cdH1cblxuXHRwcml2YXRlIGdldENhY2hlS2V5KHJvdXRlOiBzdHJpbmcpOiBzdHJpbmcge1xuXHRcdHJldHVybiBgc3RhdGljOiR7cm91dGV9YDtcblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgcmVhZEZpbGVDb250ZW50KGZpbGVQYXRoOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuXHRcdHJldHVybiBhd2FpdCBmcy5yZWFkRmlsZShmaWxlUGF0aCwgJ3V0ZjgnKTtcblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgc2VydmVJbmRleEZpbGUoXG5cdFx0cmVxOiBSZXF1ZXN0LFxuXHRcdHJlczogUmVzcG9uc2UsXG5cdFx0bmV4dDogTmV4dEZ1bmN0aW9uXG5cdCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdGNvbnN0IGluZGV4RmlsZSA9IHRoaXMudmFsaWRIVE1MRmlsZXNbJ2luZGV4J107XG5cblx0XHRpZiAodHlwZW9mIGluZGV4RmlsZSAhPT0gJ3N0cmluZycpIHtcblx0XHRcdHRoaXMubG9nZ2VyLndhcm4oYEluZGV4IHBhZ2Ugbm90IGZvdW5kIG9yIGludmFsaWRgKTtcblx0XHRcdHJlcy5zdGF0dXMoNDA0KS5qc29uKHsgbWVzc2FnZTogJ0luZGV4IHBhZ2Ugbm90IGZvdW5kJyB9KTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRjb25zdCBmaWxlUGF0aCA9IHBhdGguam9pbih0aGlzLnN0YXRpY1Jvb3RQYXRoLCBpbmRleEZpbGUpO1xuXG5cdFx0cmV0dXJuIG5ldyBQcm9taXNlPHZvaWQ+KChyZXNvbHZlLCByZWplY3QpID0+IHtcblx0XHRcdHJlcy5zZW5kRmlsZShmaWxlUGF0aCwgZXJyb3IgPT4ge1xuXHRcdFx0XHRpZiAoZXJyb3IpIHtcblx0XHRcdFx0XHR0aGlzLmVycm9yTG9nZ2VyLmxvZ0Vycm9yKFxuXHRcdFx0XHRcdFx0YEVycm9yIHNlcnZpbmcgaW5kZXggZmlsZSAke2ZpbGVQYXRofTogJHtlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICdVbmtub3duIGVycm9yJ31gXG5cdFx0XHRcdFx0KTtcblx0XHRcdFx0XHR0aGlzLmVycm9ySGFuZGxlci5zZW5kQ2xpZW50RXJyb3JSZXNwb25zZSh7XG5cdFx0XHRcdFx0XHRtZXNzYWdlOiBgJHtmaWxlUGF0aH0gbm90IGZvdW5kYCxcblx0XHRcdFx0XHRcdHN0YXR1c0NvZGU6IDQwNCxcblx0XHRcdFx0XHRcdHJlc1xuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdHJlamVjdChlcnJvcik7XG5cdFx0XHRcdFx0cmV0dXJuIG5leHQoZXJyb3IpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHRoaXMubG9nZ2VyLmRlYnVnKGBTZXJ2ZWQgaW5kZXggZmlsZTogJHtmaWxlUGF0aH1gKTtcblx0XHRcdFx0XHRyZXNvbHZlKCk7XG5cdFx0XHRcdFx0cmV0dXJuIG5leHQoKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fSk7XG5cdH1cblxuXHRwdWJsaWMgYXN5bmMgc2VydmVOb3RGb3VuZFBhZ2UoXG5cdFx0cmVxOiBSZXF1ZXN0LFxuXHRcdHJlczogUmVzcG9uc2UsXG5cdFx0bmV4dDogTmV4dEZ1bmN0aW9uXG5cdCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdGNvbnN0IG5vdEZvdW5kUGFnZSA9IHRoaXMudmFsaWRIVE1MRmlsZXNbJ25vdEZvdW5kJ107XG5cblx0XHRpZiAodHlwZW9mIG5vdEZvdW5kUGFnZSAhPT0gJ3N0cmluZycpIHtcblx0XHRcdHRoaXMubG9nZ2VyLndhcm4oYG5vdC1mb3VuZC5odG1sIGZpbGUgaXMgbWlzc2luZ2ApO1xuXHRcdFx0cmVzLnN0YXR1cyg0MDQpLmpzb24oeyBtZXNzYWdlOiAnUGFnZSBub3QgZm91bmQnIH0pO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGNvbnN0IGZpbGVQYXRoID0gcGF0aC5qb2luKHRoaXMuc3RhdGljUm9vdFBhdGgsIG5vdEZvdW5kUGFnZSk7XG5cdFx0YXdhaXQgdGhpcy5zZXJ2ZVN0YXRpY0ZpbGUoZmlsZVBhdGgsICdub3QtZm91bmQnLCByZXEsIHJlcywgbmV4dCk7XG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIHNlcnZlQ1NTRmlsZShcblx0XHRyZXE6IFJlcXVlc3QsXG5cdFx0cmVzOiBSZXNwb25zZSxcblx0XHRuZXh0OiBOZXh0RnVuY3Rpb25cblx0KTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0Y29uc3QgY3NzRmlsZSA9IHJlcS5wYXJhbXMuZmlsZTtcblxuXHRcdGlmICh0eXBlb2YgY3NzRmlsZSAhPT0gJ3N0cmluZycpIHtcblx0XHRcdHRoaXMubG9nZ2VyLndhcm4oXG5cdFx0XHRcdGBDU1MgZmlsZSBub3QgZm91bmQgb3IgaW52YWxpZDogJHtyZXEucGFyYW1zLmZpbGVuYW1lfWBcblx0XHRcdCk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgZmlsZVBhdGggPSBwYXRoLmpvaW4odGhpcy5jc3NEaXJlY3RvcnksIGNzc0ZpbGUpO1xuXG5cdFx0cmV0dXJuIG5ldyBQcm9taXNlPHZvaWQ+KChyZXNvbHZlLCByZWplY3QpID0+IHtcblx0XHRcdHJlcy5zZW5kRmlsZShmaWxlUGF0aCwgZXJyb3IgPT4ge1xuXHRcdFx0XHRpZiAoZXJyb3IpIHtcblx0XHRcdFx0XHR0aGlzLmVycm9yTG9nZ2VyLmxvZ0Vycm9yKFxuXHRcdFx0XHRcdFx0YEVycm9yIHNlcnZpbmcgQ1NTIGZpbGUgJHtmaWxlUGF0aH06ICR7ZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiAnVW5rbm93biBlcnJvcid9YFxuXHRcdFx0XHRcdCk7XG5cdFx0XHRcdFx0dGhpcy5lcnJvckhhbmRsZXIuc2VuZENsaWVudEVycm9yUmVzcG9uc2Uoe1xuXHRcdFx0XHRcdFx0bWVzc2FnZTogYCR7ZmlsZVBhdGh9IG5vdCBmb3VuZGAsXG5cdFx0XHRcdFx0XHRzdGF0dXNDb2RlOiA0MDQsXG5cdFx0XHRcdFx0XHRyZXNcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRyZWplY3QoZXJyb3IpO1xuXHRcdFx0XHRcdHJldHVybiBuZXh0KGVycm9yKTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHR0aGlzLmxvZ2dlci5kZWJ1ZyhgU2VydmVkIENTUyBmaWxlOiAke2ZpbGVQYXRofWApO1xuXHRcdFx0XHRcdHJlc29sdmUoKTtcblx0XHRcdFx0XHRyZXR1cm4gbmV4dCgpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9KTtcblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgc2VydmVIVE1MRmlsZShcblx0XHRyZXE6IFJlcXVlc3QsXG5cdFx0cmVzOiBSZXNwb25zZSxcblx0XHRuZXh0OiBOZXh0RnVuY3Rpb25cblx0KTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0Y29uc3QgcGFnZSA9IHJlcS5wYXJhbXMucGFnZTtcblx0XHRjb25zdCBmaWxlUGF0aEVudHJ5ID0gdGhpcy52YWxpZEhUTUxGaWxlc1twYWdlXTtcblxuXHRcdGlmICh0eXBlb2YgZmlsZVBhdGhFbnRyeSAhPT0gJ3N0cmluZycpIHtcblx0XHRcdHRoaXMubG9nZ2VyLndhcm4oYEhUTUwgcGFnZSBub3QgZm91bmQ6ICR7cGFnZX1gKTtcblx0XHRcdGF3YWl0IHRoaXMuc2VydmVOb3RGb3VuZFBhZ2UocmVxLCByZXMsIG5leHQpO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGNvbnN0IGZpbGVQYXRoID0gcGF0aC5qb2luKHRoaXMuc3RhdGljUm9vdFBhdGgsIGZpbGVQYXRoRW50cnkpO1xuXG5cdFx0cmV0dXJuIG5ldyBQcm9taXNlPHZvaWQ+KChyZXNvbHZlLCByZWplY3QpID0+IHtcblx0XHRcdHJlcy5zZW5kRmlsZShmaWxlUGF0aCwgYXN5bmMgZXJyb3IgPT4ge1xuXHRcdFx0XHRpZiAoZXJyb3IpIHtcblx0XHRcdFx0XHR0aGlzLmVycm9yTG9nZ2VyLmxvZ0Vycm9yKFxuXHRcdFx0XHRcdFx0YEVycm9yIHNlcnZpbmcgSFRNTCBmaWxlICR7ZmlsZVBhdGh9OiAke2Vycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogJ1Vua25vd24gZXJyb3InfWBcblx0XHRcdFx0XHQpO1xuXHRcdFx0XHRcdGF3YWl0IHRoaXMuc2VydmVOb3RGb3VuZFBhZ2UocmVxLCByZXMsIG5leHQpO1xuXHRcdFx0XHRcdHJlamVjdChlcnJvcik7XG5cdFx0XHRcdFx0bmV4dChlcnJvcik7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0dGhpcy5sb2dnZXIuZGVidWcoYFNlcnZlZCBIVE1MIGZpbGU6ICR7ZmlsZVBhdGh9YCk7XG5cdFx0XHRcdFx0cmVzb2x2ZSgpO1xuXHRcdFx0XHRcdG5leHQoKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fSk7XG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIHNlcnZlSWNvbkZpbGUoXG5cdFx0cmVxOiBSZXF1ZXN0LFxuXHRcdHJlczogUmVzcG9uc2UsXG5cdFx0bmV4dDogTmV4dEZ1bmN0aW9uXG5cdCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdGNvbnN0IGltYWdlRmlsZSA9IHRoaXMudmFsaWRJbWFnZUZpbGVzW3JlcS5wYXJhbXMuZmlsZW5hbWVdO1xuXG5cdFx0aWYgKHR5cGVvZiBpbWFnZUZpbGUgIT09ICdzdHJpbmcnKSB7XG5cdFx0XHR0aGlzLmxvZ2dlci53YXJuKFxuXHRcdFx0XHRgSWNvbiBmaWxlIG5vdCBmb3VuZCBvciBpbnZhbGlkOiAke3JlcS5wYXJhbXMuZmlsZW5hbWV9YFxuXHRcdFx0KTtcblxuXHRcdFx0cmVzLnN0YXR1cyg0MDQpLmpzb24oeyBtZXNzYWdlOiAnTG9nbyBmaWxlIG5vdCBmb3VuZCcgfSk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0Y29uc3QgZmlsZVBhdGggPSBwYXRoLmpvaW4odGhpcy5pbWFnZURpcmVjdG9yeSwgaW1hZ2VGaWxlKTtcblxuXHRcdHJldHVybiBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cdFx0XHRyZXMuc2VuZEZpbGUoZmlsZVBhdGgsIGVycm9yID0+IHtcblx0XHRcdFx0aWYgKGVycm9yKSB7XG5cdFx0XHRcdFx0dGhpcy5lcnJvckxvZ2dlci5sb2dFcnJvcihcblx0XHRcdFx0XHRcdGBFcnJvciBzZXJ2aW5nIGljb24gZmlsZSAke2ZpbGVQYXRofTogJHtlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICdVbmtub3duIGVycm9yJ31gXG5cdFx0XHRcdFx0KTtcblx0XHRcdFx0XHR0aGlzLmVycm9ySGFuZGxlci5zZW5kQ2xpZW50RXJyb3JSZXNwb25zZSh7XG5cdFx0XHRcdFx0XHRtZXNzYWdlOiBgJHtmaWxlUGF0aH0gbm90IGZvdW5kYCxcblx0XHRcdFx0XHRcdHN0YXR1c0NvZGU6IDQwNCxcblx0XHRcdFx0XHRcdHJlc1xuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdHJlamVjdChlcnJvcik7XG5cdFx0XHRcdFx0cmV0dXJuIG5leHQoZXJyb3IpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHRoaXMubG9nZ2VyLmRlYnVnKGBTZXJ2ZWQgaWNvbiBmaWxlOiAke2ZpbGVQYXRofWApO1xuXHRcdFx0XHRcdHJlc29sdmUoKTtcblx0XHRcdFx0XHRyZXR1cm4gbmV4dCgpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9KTtcblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgc2VydmVJbWFnZUZpbGUoXG5cdFx0cmVxOiBSZXF1ZXN0LFxuXHRcdHJlczogUmVzcG9uc2UsXG5cdFx0bmV4dDogTmV4dEZ1bmN0aW9uXG5cdCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdGNvbnN0IGltYWdlRmlsZSA9IHRoaXMudmFsaWRJbWFnZUZpbGVzW3JlcS5wYXJhbXMuZmlsZW5hbWVdO1xuXG5cdFx0aWYgKHR5cGVvZiBpbWFnZUZpbGUgIT09ICdzdHJpbmcnKSB7XG5cdFx0XHR0aGlzLmxvZ2dlci53YXJuKFxuXHRcdFx0XHRgSW1hZ2UgZmlsZSBub3QgZm91bmQgb3IgaW52YWxpZDogJHtyZXEucGFyYW1zLmZpbGVuYW1lfWBcblx0XHRcdCk7XG5cdFx0XHRyZXMuc3RhdHVzKDQwNCkuanNvbih7IG1lc3NhZ2U6ICdJbWFnZSBmaWxlIG5vdCBmb3VuZCcgfSk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0Y29uc3QgZmlsZVBhdGggPSBwYXRoLmpvaW4odGhpcy5pbWFnZURpcmVjdG9yeSwgaW1hZ2VGaWxlKTtcblxuXHRcdHJldHVybiBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cdFx0XHRyZXMuc2VuZEZpbGUoZmlsZVBhdGgsIGVycm9yID0+IHtcblx0XHRcdFx0aWYgKGVycm9yKSB7XG5cdFx0XHRcdFx0dGhpcy5lcnJvckxvZ2dlci5sb2dFcnJvcihcblx0XHRcdFx0XHRcdGBFcnJvciBzZXJ2aW5nIGltYWdlIGZpbGUgJHtmaWxlUGF0aH06ICR7ZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiAnVW5rbm93biBlcnJvcid9YFxuXHRcdFx0XHRcdCk7XG5cdFx0XHRcdFx0dGhpcy5lcnJvckhhbmRsZXIuc2VuZENsaWVudEVycm9yUmVzcG9uc2Uoe1xuXHRcdFx0XHRcdFx0bWVzc2FnZTogYCR7ZmlsZVBhdGh9IG5vdCBmb3VuZGAsXG5cdFx0XHRcdFx0XHRzdGF0dXNDb2RlOiA0MDQsXG5cdFx0XHRcdFx0XHRyZXNcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRyZWplY3QoZXJyb3IpO1xuXHRcdFx0XHRcdHJldHVybiBuZXh0KGVycm9yKTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHR0aGlzLmxvZ2dlci5kZWJ1ZyhgU2VydmVkIGltYWdlIGZpbGU6ICR7ZmlsZVBhdGh9YCk7XG5cdFx0XHRcdFx0cmVzb2x2ZSgpO1xuXHRcdFx0XHRcdHJldHVybiBuZXh0KCk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH0pO1xuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyBzZXJ2ZUpTRmlsZShcblx0XHRyZXE6IFJlcXVlc3QsXG5cdFx0cmVzOiBSZXNwb25zZSxcblx0XHRuZXh0OiBOZXh0RnVuY3Rpb25cblx0KTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0Y29uc3QgaW1hZ2VGaWxlID0gdGhpcy52YWxpZEltYWdlRmlsZXNbcmVxLnBhcmFtcy5maWxlbmFtZV07XG5cblx0XHRpZiAodHlwZW9mIGltYWdlRmlsZSAhPT0gJ3N0cmluZycpIHtcblx0XHRcdHRoaXMubG9nZ2VyLndhcm4oXG5cdFx0XHRcdGBKYXZhc2NyaXB0IGZpbGUgbm90IGZvdW5kIG9yIGludmFsaWQ6ICR7cmVxLnBhcmFtcy5maWxlbmFtZX1gXG5cdFx0XHQpO1xuXHRcdFx0cmVzLnN0YXR1cyg0MDQpLmpzb24oeyBtZXNzYWdlOiAnSmF2YXNjcmlwdCBmaWxlIG5vdCBmb3VuZCcgfSk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0Y29uc3QgZmlsZVBhdGggPSBwYXRoLmpvaW4odGhpcy5pbWFnZURpcmVjdG9yeSwgaW1hZ2VGaWxlKTtcblxuXHRcdHJldHVybiBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cdFx0XHRyZXMuc2VuZEZpbGUoZmlsZVBhdGgsIGVycm9yID0+IHtcblx0XHRcdFx0aWYgKGVycm9yKSB7XG5cdFx0XHRcdFx0dGhpcy5lcnJvckxvZ2dlci5sb2dFcnJvcihcblx0XHRcdFx0XHRcdGBFcnJvciBzZXJ2aW5nIGphdmFzY3JpcHQgZmlsZSAke2ZpbGVQYXRofTogJHtlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICdVbmtub3duIGVycm9yJ31gXG5cdFx0XHRcdFx0KTtcblx0XHRcdFx0XHR0aGlzLmVycm9ySGFuZGxlci5zZW5kQ2xpZW50RXJyb3JSZXNwb25zZSh7XG5cdFx0XHRcdFx0XHRtZXNzYWdlOiBgJHtmaWxlUGF0aH0gbm90IGZvdW5kYCxcblx0XHRcdFx0XHRcdHN0YXR1c0NvZGU6IDQwNCxcblx0XHRcdFx0XHRcdHJlc1xuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdHJlamVjdChlcnJvcik7XG5cdFx0XHRcdFx0cmV0dXJuIG5leHQoZXJyb3IpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHRoaXMubG9nZ2VyLmRlYnVnKGBTZXJ2ZWQgamF2YXNjcmlwdCBmaWxlOiAke2ZpbGVQYXRofWApO1xuXHRcdFx0XHRcdHJlc29sdmUoKTtcblx0XHRcdFx0XHRyZXR1cm4gbmV4dCgpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9KTtcblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgc2VydmVMb2dvRmlsZShcblx0XHRyZXE6IFJlcXVlc3QsXG5cdFx0cmVzOiBSZXNwb25zZSxcblx0XHRuZXh0OiBOZXh0RnVuY3Rpb25cblx0KTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0Y29uc3QgaW1hZ2VGaWxlID0gdGhpcy52YWxpZEltYWdlRmlsZXNbcmVxLnBhcmFtcy5maWxlbmFtZV07XG5cblx0XHRpZiAodHlwZW9mIGltYWdlRmlsZSAhPT0gJ3N0cmluZycpIHtcblx0XHRcdHRoaXMubG9nZ2VyLndhcm4oXG5cdFx0XHRcdGBJbWFnZSBmaWxlIG5vdCBmb3VuZCBvciBpbnZhbGlkOiAke3JlcS5wYXJhbXMuZmlsZW5hbWV9YFxuXHRcdFx0KTtcblx0XHRcdHJlcy5zdGF0dXMoNDA0KS5qc29uKHsgbWVzc2FnZTogJ0ltYWdlIGZpbGUgbm90IGZvdW5kJyB9KTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRjb25zdCBmaWxlUGF0aCA9IHBhdGguam9pbih0aGlzLmltYWdlRGlyZWN0b3J5LCBpbWFnZUZpbGUpO1xuXG5cdFx0cmV0dXJuIG5ldyBQcm9taXNlPHZvaWQ+KChyZXNvbHZlLCByZWplY3QpID0+IHtcblx0XHRcdHJlcy5zZW5kRmlsZShmaWxlUGF0aCwgZXJyb3IgPT4ge1xuXHRcdFx0XHRpZiAoZXJyb3IpIHtcblx0XHRcdFx0XHR0aGlzLmVycm9yTG9nZ2VyLmxvZ0Vycm9yKFxuXHRcdFx0XHRcdFx0YEVycm9yIHNlcnZpbmcgaW1hZ2UgZmlsZSAke2ZpbGVQYXRofTogJHtlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICdVbmtub3duIGVycm9yJ31gXG5cdFx0XHRcdFx0KTtcblx0XHRcdFx0XHR0aGlzLmVycm9ySGFuZGxlci5zZW5kQ2xpZW50RXJyb3JSZXNwb25zZSh7XG5cdFx0XHRcdFx0XHRtZXNzYWdlOiBgJHtmaWxlUGF0aH0gbm90IGZvdW5kYCxcblx0XHRcdFx0XHRcdHN0YXR1c0NvZGU6IDQwNCxcblx0XHRcdFx0XHRcdHJlc1xuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdHJlamVjdChlcnJvcik7XG5cdFx0XHRcdFx0cmV0dXJuIG5leHQoZXJyb3IpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHRoaXMubG9nZ2VyLmRlYnVnKGBTZXJ2ZWQgbG9nbyBmaWxlOiAke2ZpbGVQYXRofWApO1xuXHRcdFx0XHRcdHJlc29sdmUoKTtcblx0XHRcdFx0XHRyZXR1cm4gbmV4dCgpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9KTtcblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgc2VydmVNREZpbGUoXG5cdFx0cmVxOiBSZXF1ZXN0LFxuXHRcdHJlczogUmVzcG9uc2UsXG5cdFx0bmV4dDogTmV4dEZ1bmN0aW9uXG5cdCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdGNvbnN0IGpzRmlsZSA9IHRoaXMudmFsaWRKU0ZpbGVzW3JlcS5wYXJhbXMuZmlsZW5hbWVdO1xuXG5cdFx0aWYgKHR5cGVvZiBqc0ZpbGUgIT09ICdzdHJpbmcnKSB7XG5cdFx0XHR0aGlzLmxvZ2dlci53YXJuKFxuXHRcdFx0XHRgTWFya2Rvd24gZmlsZSBub3QgZm91bmQgb3IgaW52YWxpZDogJHtyZXEucGFyYW1zLmZpbGVuYW1lfWBcblx0XHRcdCk7XG5cdFx0XHRyZXMuc3RhdHVzKDQwNCkuanNvbih7IG1lc3NhZ2U6ICdNYXJrZG93biBmaWxlIG5vdCBmb3VuZCcgfSk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0Y29uc3QgZmlsZVBhdGggPSBwYXRoLmpvaW4odGhpcy5qc0RpcmVjdG9yeSwganNGaWxlKTtcblxuXHRcdHJldHVybiBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cdFx0XHRyZXMuc2VuZEZpbGUoZmlsZVBhdGgsIGVycm9yID0+IHtcblx0XHRcdFx0aWYgKGVycm9yKSB7XG5cdFx0XHRcdFx0dGhpcy5lcnJvckxvZ2dlci5sb2dFcnJvcihcblx0XHRcdFx0XHRcdGBFcnJvciBzZXJ2aW5nIG1hcmtkb3duIGZpbGUgJHtmaWxlUGF0aH06ICR7ZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiAnVW5rbm93biBlcnJvcid9YFxuXHRcdFx0XHRcdCk7XG5cdFx0XHRcdFx0dGhpcy5lcnJvckhhbmRsZXIuc2VuZENsaWVudEVycm9yUmVzcG9uc2Uoe1xuXHRcdFx0XHRcdFx0bWVzc2FnZTogYCR7ZmlsZVBhdGh9IG5vdCBmb3VuZGAsXG5cdFx0XHRcdFx0XHRzdGF0dXNDb2RlOiA0MDQsXG5cdFx0XHRcdFx0XHRyZXNcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRyZWplY3QoZXJyb3IpO1xuXHRcdFx0XHRcdHJldHVybiBuZXh0KGVycm9yKTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHR0aGlzLmxvZ2dlci5kZWJ1ZyhgU2VydmVkIG1hcmtkb3duIGZpbGU6ICR7ZmlsZVBhdGh9YCk7XG5cdFx0XHRcdFx0cmVzb2x2ZSgpO1xuXHRcdFx0XHRcdHJldHVybiBuZXh0KCk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH0pO1xuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyBzZXJ2ZVRYVEZpbGUoXG5cdFx0cmVxOiBSZXF1ZXN0LFxuXHRcdHJlczogUmVzcG9uc2UsXG5cdFx0bmV4dDogTmV4dEZ1bmN0aW9uXG5cdCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdGNvbnN0IGpzRmlsZSA9IHRoaXMudmFsaWRKU0ZpbGVzW3JlcS5wYXJhbXMuZmlsZW5hbWVdO1xuXG5cdFx0aWYgKHR5cGVvZiBqc0ZpbGUgIT09ICdzdHJpbmcnKSB7XG5cdFx0XHR0aGlzLmxvZ2dlci53YXJuKFxuXHRcdFx0XHRgVGV4dCBmaWxlIG5vdCBmb3VuZCBvciBpbnZhbGlkOiAke3JlcS5wYXJhbXMuZmlsZW5hbWV9YFxuXHRcdFx0KTtcblx0XHRcdHJlcy5zdGF0dXMoNDA0KS5qc29uKHsgbWVzc2FnZTogJ1RleHQgZmlsZSBub3QgZm91bmQnIH0pO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGNvbnN0IGZpbGVQYXRoID0gcGF0aC5qb2luKHRoaXMuanNEaXJlY3RvcnksIGpzRmlsZSk7XG5cblx0XHRyZXR1cm4gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuXHRcdFx0cmVzLnNlbmRGaWxlKGZpbGVQYXRoLCBlcnJvciA9PiB7XG5cdFx0XHRcdGlmIChlcnJvcikge1xuXHRcdFx0XHRcdHRoaXMuZXJyb3JMb2dnZXIubG9nRXJyb3IoXG5cdFx0XHRcdFx0XHRgRXJyb3Igc2VydmluZyB0ZXh0IGZpbGUgJHtmaWxlUGF0aH06ICR7ZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiAnVW5rbm93biBlcnJvcid9YFxuXHRcdFx0XHRcdCk7XG5cdFx0XHRcdFx0dGhpcy5lcnJvckhhbmRsZXIuc2VuZENsaWVudEVycm9yUmVzcG9uc2Uoe1xuXHRcdFx0XHRcdFx0bWVzc2FnZTogYCR7ZmlsZVBhdGh9IG5vdCBmb3VuZGAsXG5cdFx0XHRcdFx0XHRzdGF0dXNDb2RlOiA0MDQsXG5cdFx0XHRcdFx0XHRyZXNcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRyZWplY3QoZXJyb3IpO1xuXHRcdFx0XHRcdHJldHVybiBuZXh0KGVycm9yKTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHR0aGlzLmxvZ2dlci5kZWJ1ZyhgU2VydmVkIHRleHQgZmlsZTogJHtmaWxlUGF0aH1gKTtcblx0XHRcdFx0XHRyZXNvbHZlKCk7XG5cdFx0XHRcdFx0cmV0dXJuIG5leHQoKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fSk7XG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIHNlcnZlWE1MRmlsZShcblx0XHRyZXE6IFJlcXVlc3QsXG5cdFx0cmVzOiBSZXNwb25zZSxcblx0XHRuZXh0OiBOZXh0RnVuY3Rpb25cblx0KTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0Y29uc3QganNGaWxlID0gdGhpcy52YWxpZEpTRmlsZXNbcmVxLnBhcmFtcy5maWxlbmFtZV07XG5cblx0XHRpZiAodHlwZW9mIGpzRmlsZSAhPT0gJ3N0cmluZycpIHtcblx0XHRcdHRoaXMubG9nZ2VyLndhcm4oXG5cdFx0XHRcdGBYTUwgZmlsZSBub3QgZm91bmQgb3IgaW52YWxpZDogJHtyZXEucGFyYW1zLmZpbGVuYW1lfWBcblx0XHRcdCk7XG5cdFx0XHRyZXMuc3RhdHVzKDQwNCkuanNvbih7IG1lc3NhZ2U6ICdUZXh0IGZpbGUgbm90IGZvdW5kJyB9KTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRjb25zdCBmaWxlUGF0aCA9IHBhdGguam9pbih0aGlzLmpzRGlyZWN0b3J5LCBqc0ZpbGUpO1xuXG5cdFx0cmV0dXJuIG5ldyBQcm9taXNlPHZvaWQ+KChyZXNvbHZlLCByZWplY3QpID0+IHtcblx0XHRcdHJlcy5zZW5kRmlsZShmaWxlUGF0aCwgZXJyb3IgPT4ge1xuXHRcdFx0XHRpZiAoZXJyb3IpIHtcblx0XHRcdFx0XHR0aGlzLmVycm9yTG9nZ2VyLmxvZ0Vycm9yKFxuXHRcdFx0XHRcdFx0YEVycm9yIHNlcnZpbmcgWE1MIGZpbGUgJHtmaWxlUGF0aH06ICR7ZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiAnVW5rbm93biBlcnJvcid9YFxuXHRcdFx0XHRcdCk7XG5cdFx0XHRcdFx0dGhpcy5lcnJvckhhbmRsZXIuc2VuZENsaWVudEVycm9yUmVzcG9uc2Uoe1xuXHRcdFx0XHRcdFx0bWVzc2FnZTogYCR7ZmlsZVBhdGh9IG5vdCBmb3VuZGAsXG5cdFx0XHRcdFx0XHRzdGF0dXNDb2RlOiA0MDQsXG5cdFx0XHRcdFx0XHRyZXNcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRyZWplY3QoZXJyb3IpO1xuXHRcdFx0XHRcdHJldHVybiBuZXh0KGVycm9yKTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHR0aGlzLmxvZ2dlci5kZWJ1ZyhgU2VydmVkIFhNTCBmaWxlOiAke2ZpbGVQYXRofWApO1xuXHRcdFx0XHRcdHJlc29sdmUoKTtcblx0XHRcdFx0XHRyZXR1cm4gbmV4dCgpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9KTtcblx0fVxuXG5cdHByaXZhdGUgdmFsaWRhdGVGaWxlcyhcblx0XHRkaXJlY3Rvcnk6IHN0cmluZyxcblx0XHRmaWxlUmVjb3JkOiBGaWxlVHlwZVJlY29yZHMsXG5cdFx0YWxsb3dlZEZpbGVzOiBGaWxlVHlwZVJlY29yZHMsXG5cdFx0dmFsaWRFeHRlbnNpb25zOiBzdHJpbmdbXVxuXHQpOiB2b2lkIHtcblx0XHR0cnkge1xuXHRcdFx0Y29uc3QgdmFsaWRGaWxlcyA9IE9iamVjdC5rZXlzKGFsbG93ZWRGaWxlcyk7XG5cdFx0XHRjb25zdCBmaWxlc0luRGlyZWN0b3J5ID0gT2JqZWN0LmtleXMoZmlsZVJlY29yZCk7XG5cblx0XHRcdGZpbGVzSW5EaXJlY3RvcnkuZm9yRWFjaChmaWxlID0+IHtcblx0XHRcdFx0Y29uc3QgZmlsZVBhdGhzID0gQXJyYXkuaXNBcnJheShmaWxlUmVjb3JkW2ZpbGVdKVxuXHRcdFx0XHRcdD8gZmlsZVJlY29yZFtmaWxlXVxuXHRcdFx0XHRcdDogW2ZpbGVSZWNvcmRbZmlsZV1dO1xuXG5cdFx0XHRcdGZpbGVQYXRocy5mb3JFYWNoKGZpbGVQYXRoID0+IHtcblx0XHRcdFx0XHRjb25zdCBleHQgPSBwYXRoLmV4dG5hbWUoZmlsZVBhdGggYXMgc3RyaW5nKTtcblxuXHRcdFx0XHRcdGlmIChcblx0XHRcdFx0XHRcdCF2YWxpZEZpbGVzLmluY2x1ZGVzKGZpbGVQYXRoIGFzIHN0cmluZykgfHxcblx0XHRcdFx0XHRcdCF2YWxpZEV4dGVuc2lvbnMuaW5jbHVkZXMoZXh0KVxuXHRcdFx0XHRcdCkge1xuXHRcdFx0XHRcdFx0dGhpcy5sb2dnZXIud2Fybihcblx0XHRcdFx0XHRcdFx0YEludmFsaWQgb3IgZm9yYmlkZGVuIGZpbGUgZGV0ZWN0ZWQgaW4gJHtkaXJlY3Rvcnl9OiAke2ZpbGVQYXRofWBcblx0XHRcdFx0XHRcdCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KTtcblx0XHRcdH0pO1xuXG5cdFx0XHR0aGlzLmxvZ2dlci5pbmZvKGBWYWxpZGF0aW9uIGNvbXBsZXRlZCBmb3IgJHtkaXJlY3Rvcnl9YCk7XG5cdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdHRoaXMubG9nZ2VyLmVycm9yKFxuXHRcdFx0XHRgRXJyb3IgdmFsaWRhdGluZyBmaWxlcyBpbiBkaXJlY3RvcnkgJHtkaXJlY3Rvcnl9OiAke1xuXHRcdFx0XHRcdGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogJ1Vua25vd24gZXJyb3InXG5cdFx0XHRcdH1gXG5cdFx0XHQpO1xuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgc2V0VXBQZXJpb2RpY1ZhbGlkYXRpb24oXG5cdFx0ZGlyZWN0b3J5OiBzdHJpbmcsXG5cdFx0ZmlsZVJlY29yZDogRmlsZVR5cGVSZWNvcmRzLFxuXHRcdGFsbG93ZWRGaWxlczogRmlsZVR5cGVSZWNvcmRzLFxuXHRcdHZhbGlkRXh0ZW5zaW9uczogc3RyaW5nW10sXG5cdFx0aW50ZXJ2YWxNczogbnVtYmVyXG5cdCk6IHZvaWQge1xuXHRcdHRyeSB7XG5cdFx0XHR0aGlzLnZhbGlkYXRlRmlsZXMoXG5cdFx0XHRcdGRpcmVjdG9yeSxcblx0XHRcdFx0ZmlsZVJlY29yZCxcblx0XHRcdFx0YWxsb3dlZEZpbGVzLFxuXHRcdFx0XHR2YWxpZEV4dGVuc2lvbnNcblx0XHRcdCk7XG5cblx0XHRcdHNldEludGVydmFsKCgpID0+IHtcblx0XHRcdFx0dGhpcy52YWxpZGF0ZUZpbGVzKFxuXHRcdFx0XHRcdGRpcmVjdG9yeSxcblx0XHRcdFx0XHRmaWxlUmVjb3JkLFxuXHRcdFx0XHRcdGFsbG93ZWRGaWxlcyxcblx0XHRcdFx0XHR2YWxpZEV4dGVuc2lvbnNcblx0XHRcdFx0KTtcblx0XHRcdFx0dGhpcy5sb2dnZXIuaW5mbyhcblx0XHRcdFx0XHRgUGVyaW9kaWMgdmFsaWRhdGlvbiBjb21wbGV0ZWQgZm9yICR7ZGlyZWN0b3J5fWBcblx0XHRcdFx0KTtcblx0XHRcdH0sIGludGVydmFsTXMpO1xuXHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHR0aGlzLmxvZ2dlci5lcnJvcihcblx0XHRcdFx0YEVycm9yIHNldHRpbmcgdXAgcGVyaW9kaWMgdmFsaWRhdGlvbiBmb3IgZGlyZWN0b3J5ICR7ZGlyZWN0b3J5fTogJHtcblx0XHRcdFx0XHRlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICdVbmtub3duIGVycm9yJ1xuXHRcdFx0XHR9YFxuXHRcdFx0KTtcblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIGJsb2NrRm9yYmlkZGVuRmlsZXMoXG5cdFx0cmVxOiBSZXF1ZXN0LFxuXHRcdHJlczogUmVzcG9uc2UsXG5cdFx0bmV4dDogTmV4dEZ1bmN0aW9uXG5cdCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdGNvbnN0IGZpbGVQYXRoID0gcGF0aC5ub3JtYWxpemUocmVxLnVybCk7XG5cdFx0Y29uc3QgcmVzb2x2ZWRQYXRoID0gcGF0aC5yZXNvbHZlKHRoaXMuc3RhdGljUm9vdFBhdGgsIGZpbGVQYXRoKTtcblx0XHRjb25zdCBpc0ZvcmJpZGRlbkRpcmVjdG9yeSA9IHRoaXMuZm9yYmlkZGVuRGlyZWN0b3JpZXMuc29tZShkaXIgPT5cblx0XHRcdHJlc29sdmVkUGF0aC5pbmNsdWRlcyhwYXRoLnJlc29sdmUodGhpcy5zdGF0aWNSb290UGF0aCwgZGlyKSlcblx0XHQpO1xuXG5cdFx0aWYgKGlzRm9yYmlkZGVuRGlyZWN0b3J5KSB7XG5cdFx0XHR0aGlzLmxvZ2dlci53YXJuKFxuXHRcdFx0XHRgQXR0ZW1wdGVkIGFjY2VzcyB0byBmb3JiaWRkZW4gZGlyZWN0b3J5OiAke3JlcS51cmx9YFxuXHRcdFx0KTtcblx0XHRcdHJlcy5zdGF0dXMoNDAzKS5qc29uKHsgbWVzc2FnZTogJ0FjY2VzcyBkZW5pZWQnIH0pO1xuXG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0Y29uc3QgaXNWYWxpZERpcmVjdG9yeSA9IHRoaXMudmFsaWREaXJlY3Rvcmllcy5zb21lKGRpciA9PlxuXHRcdFx0cmVzb2x2ZWRQYXRoLmluY2x1ZGVzKHBhdGgucmVzb2x2ZSh0aGlzLnN0YXRpY1Jvb3RQYXRoLCBkaXIpKVxuXHRcdCk7XG5cblx0XHRpZiAoIWlzVmFsaWREaXJlY3RvcnkpIHtcblx0XHRcdHRoaXMubG9nZ2VyLndhcm4oXG5cdFx0XHRcdGBBdHRlbXB0ZWQgYWNjZXNzIHRvIGludmFsaWQgZGlyZWN0b3J5OiAke3JlcS51cmx9YFxuXHRcdFx0KTtcblx0XHRcdHJlcy5zdGF0dXMoNDAzKS5qc29uKHsgbWVzc2FnZTogJ0FjY2VzcyBkZW5pZWQnIH0pO1xuXG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0Y29uc3QgZmlsZW5hbWUgPSBwYXRoLmJhc2VuYW1lKGZpbGVQYXRoKTtcblx0XHRjb25zdCBmaWxlRXh0ID0gcGF0aC5leHRuYW1lKGZpbGVuYW1lKTtcblxuXHRcdGlmICh0aGlzLmZvcmJpZGRlbkZpbGVzLmluY2x1ZGVzKGZpbGVuYW1lKSkge1xuXHRcdFx0dGhpcy5sb2dnZXIud2FybihgQXR0ZW1wdGVkIGFjY2VzcyB0byBmb3JiaWRkZW4gZmlsZTogJHtmaWxlbmFtZX1gKTtcblx0XHRcdHJlcy5zdGF0dXMoNDAzKS5qc29uKHsgbWVzc2FnZTogJ0FjY2VzcyBkZW5pZWQnIH0pO1xuXG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0aWYgKHRoaXMuZm9yYmlkZGVuRXh0ZW5zaW9ucy5pbmNsdWRlcyhmaWxlRXh0KSkge1xuXHRcdFx0dGhpcy5sb2dnZXIud2Fybihcblx0XHRcdFx0YEF0dGVtcHRlZCBhY2Nlc3MgdG8gZm9yYmlkZGVuIGZpbGUgZXh0ZW5zaW9uOiAke2ZpbGVFeHR9YFxuXHRcdFx0KTtcblx0XHRcdHJlcy5zdGF0dXMoNDAzKS5qc29uKHsgbWVzc2FnZTogJ0FjY2VzcyBkZW5pZWQnIH0pO1xuXG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0Y29uc3QgaXNWYWxpZEV4dGVuc2lvbiA9IHRoaXMudmFsaWRFeHRlbnNpb25zLmluY2x1ZGVzKGZpbGVFeHQpO1xuXG5cdFx0aWYgKCFpc1ZhbGlkRXh0ZW5zaW9uKSB7XG5cdFx0XHR0aGlzLmxvZ2dlci53YXJuKFxuXHRcdFx0XHRgQXR0ZW1wdGVkIGFjY2VzcyB0byBpbnZhbGlkIGZpbGUgZXh0ZW5zaW9uOiAke2ZpbGVFeHR9YFxuXHRcdFx0KTtcblx0XHRcdHJlcy5zdGF0dXMoNDAzKS5qc29uKHsgbWVzc2FnZTogJ0FjY2VzcyBkZW5pZWQnIH0pO1xuXG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0bmV4dCgpO1xuXHR9XG59XG5cbmV4cG9ydCBjbGFzcyBUZXN0Um91dGVyIGV4dGVuZHMgQmFzZVJvdXRlciB7XG5cdHByaXZhdGUgbm9kZUVudiA9IHRoaXMuZW52Q29uZmlnLmdldEVudlZhcmlhYmxlKCdub2RlRW52Jyk7XG5cblx0cHVibGljIGNvbnN0cnVjdG9yKFxuXHRcdGxvZ2dlcjogQXBwTG9nZ2VyU2VydmljZUludGVyZmFjZSxcblx0XHRlcnJvckxvZ2dlcjogRXJyb3JMb2dnZXJTZXJ2aWNlSW50ZXJmYWNlLFxuXHRcdGVycm9ySGFuZGxlcjogRXJyb3JIYW5kbGVyU2VydmljZUludGVyZmFjZSxcblx0XHRlbnZDb25maWc6IEVudkNvbmZpZ1NlcnZpY2VJbnRlcmZhY2UsXG5cdFx0Y2FjaGVTZXJ2aWNlOiBDYWNoZVNlcnZpY2VJbnRlcmZhY2UsXG5cdFx0Z2F0ZWtlZXBlclNlcnZpY2U6IEdhdGVrZWVwZXJTZXJ2aWNlSW50ZXJmYWNlLFxuXHRcdGhlbG1ldFNlcnZpY2U6IEhlbG1ldE1pZGRsZXdhcmVTZXJ2aWNlSW50ZXJmYWNlLFxuXHRcdEpXVE1pZGRsZXdhcmU6IEpXVEF1dGhNaWRkbGV3YXJlU2VydmljZUludGVyZmFjZSxcblx0XHRwYXNzcG9ydE1pZGRsZXdhcmU6IFBhc3Nwb3J0QXV0aE1pZGRsZXdhcmVTZXJ2aWNlSW50ZXJmYWNlXG5cdCkge1xuXHRcdHN1cGVyKFxuXHRcdFx0bG9nZ2VyLFxuXHRcdFx0ZXJyb3JMb2dnZXIsXG5cdFx0XHRlcnJvckhhbmRsZXIsXG5cdFx0XHRlbnZDb25maWcsXG5cdFx0XHRjYWNoZVNlcnZpY2UsXG5cdFx0XHRnYXRla2VlcGVyU2VydmljZSxcblx0XHRcdGhlbG1ldFNlcnZpY2UsXG5cdFx0XHRKV1RNaWRkbGV3YXJlLFxuXHRcdFx0cGFzc3BvcnRNaWRkbGV3YXJlXG5cdFx0KTtcblx0XHR0aGlzLm5vZGVFbnYgPSB0aGlzLmVudkNvbmZpZy5nZXRFbnZWYXJpYWJsZSgnbm9kZUVudicpO1xuXHRcdHRoaXMuc2V0VXBUZXN0Um91dGVzKCk7XG5cdH1cblxuXHRwcml2YXRlIHNldFVwVGVzdFJvdXRlcygpOiB2b2lkIHtcblx0XHRpZiAodGhpcy5ub2RlRW52ID09PSAncHJvZHVjdGlvbicpIHtcblx0XHRcdHRoaXMucm91dGVyLnVzZSgoX3JlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSkgPT4ge1xuXHRcdFx0XHR0aGlzLmxvZ2dlci5pbmZvKFxuXHRcdFx0XHRcdCdUZXN0IHJvdXRlIGFjY2Vzc2VkIGluIHByb2R1Y3Rpb24gZW52aXJvbm1lbnQuJ1xuXHRcdFx0XHQpO1xuXHRcdFx0XHRyZXMuc3RhdHVzKDQwNCkuanNvbih7XG5cdFx0XHRcdFx0bWVzc2FnZTogJ1Rlc3Qgcm91dGVzIGFyZSBub3QgYXZhaWxhYmxlIGluIHByb2R1Y3Rpb24uJ1xuXHRcdFx0XHR9KTtcblx0XHRcdH0pO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aGlzLnJvdXRlci5jb25uZWN0KCcvdGVzdCcsIHRoaXMudGVzdENvbm5lY3RSb3V0ZS5iaW5kKHRoaXMpKTtcblx0XHRcdHRoaXMucm91dGVyLmRlbGV0ZSgnL3Rlc3QnLCB0aGlzLnRlc3REZWxldGVSb3V0ZS5iaW5kKHRoaXMpKTtcblx0XHRcdHRoaXMucm91dGVyLmdldCgnL3Rlc3QnLCB0aGlzLnRlc3RHZXRSb3V0ZS5iaW5kKHRoaXMpKTtcblx0XHRcdHRoaXMucm91dGVyLmhlYWQoJy90ZXN0JywgdGhpcy50ZXN0SGVhZFJvdXRlLmJpbmQodGhpcykpO1xuXHRcdFx0dGhpcy5yb3V0ZXIub3B0aW9ucygnL3Rlc3QnLCB0aGlzLnRlc3RPcHRpb25zUm91dGUuYmluZCh0aGlzKSk7XG5cdFx0XHR0aGlzLnJvdXRlci5wYXRjaCgnL3Rlc3QnLCB0aGlzLnRlc3RQYXRjaFJvdXRlLmJpbmQodGhpcykpO1xuXHRcdFx0dGhpcy5yb3V0ZXIucG9zdCgnL3Rlc3QnLCB0aGlzLnRlc3RQb3N0Um91dGUuYmluZCh0aGlzKSk7XG5cdFx0XHR0aGlzLnJvdXRlci5wdXQoJy90ZXN0JywgdGhpcy50ZXN0UHV0Um91dGUuYmluZCh0aGlzKSk7XG5cdFx0XHR0aGlzLnJvdXRlci50cmFjZSgnL3Rlc3QnLCB0aGlzLnRlc3RUcmFjZVJvdXRlLmJpbmQodGhpcykpO1xuXHRcdH1cblxuXHRcdHRoaXMucm91dGVyLnVzZSh0aGlzLmhhbmRsZVRlc3RSb3V0ZUVycm9ycy5iaW5kKHRoaXMpKTtcblx0fVxuXG5cdHByaXZhdGUgdGVzdENvbm5lY3RSb3V0ZShcblx0XHRyZXE6IFJlcXVlc3QsXG5cdFx0cmVzOiBSZXNwb25zZSxcblx0XHRuZXh0OiBOZXh0RnVuY3Rpb25cblx0KTogdm9pZCB7XG5cdFx0dHJ5IHtcblx0XHRcdHRoaXMubG9nZ2VyLmluZm8oJ1Rlc3Qgcm91dGUgYWNjZXNzZWQuJyk7XG5cdFx0XHRyZXMuc2VuZCgnVGVzdCByb3V0ZSBpcyB3b3JraW5nIScpO1xuXHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHR0aGlzLmhhbmRsZVJvdXRlRXJyb3IoZXJyb3IsIHJlcSwgcmVzLCBuZXh0KTtcblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIHRlc3REZWxldGVSb3V0ZShcblx0XHRyZXE6IFJlcXVlc3QsXG5cdFx0cmVzOiBSZXNwb25zZSxcblx0XHRuZXh0OiBOZXh0RnVuY3Rpb25cblx0KTogdm9pZCB7XG5cdFx0dHJ5IHtcblx0XHRcdHRoaXMubG9nZ2VyLmluZm8oJ0RFTEVURSBUZXN0IHJvdXRlIGFjY2Vzc2VkLicpO1xuXHRcdFx0cmVzLnNlbmQoJ0RFTEVURSBUZXN0IHJvdXRlIGlzIHdvcmtpbmchJyk7XG5cdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdHRoaXMuaGFuZGxlUm91dGVFcnJvcihlcnJvciwgcmVxLCByZXMsIG5leHQpO1xuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgdGVzdEdldFJvdXRlKFxuXHRcdHJlcTogUmVxdWVzdCxcblx0XHRyZXM6IFJlc3BvbnNlLFxuXHRcdG5leHQ6IE5leHRGdW5jdGlvblxuXHQpOiB2b2lkIHtcblx0XHR0cnkge1xuXHRcdFx0dGhpcy5sb2dnZXIuaW5mbygnVGVzdCByb3V0ZSBhY2Nlc3NlZC4nKTtcblx0XHRcdHJlcy5zZW5kKCdUZXN0IHJvdXRlIGlzIHdvcmtpbmchJyk7XG5cdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdHRoaXMuaGFuZGxlUm91dGVFcnJvcihlcnJvciwgcmVxLCByZXMsIG5leHQpO1xuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgdGVzdEhlYWRSb3V0ZShcblx0XHRyZXE6IFJlcXVlc3QsXG5cdFx0cmVzOiBSZXNwb25zZSxcblx0XHRuZXh0OiBOZXh0RnVuY3Rpb25cblx0KTogdm9pZCB7XG5cdFx0dHJ5IHtcblx0XHRcdHRoaXMubG9nZ2VyLmluZm8oJ1Rlc3Qgcm91dGUgYWNjZXNzZWQuJyk7XG5cdFx0XHRyZXMuc2VuZCgnVGVzdCByb3V0ZSBpcyB3b3JraW5nIScpO1xuXHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHR0aGlzLmhhbmRsZVJvdXRlRXJyb3IoZXJyb3IsIHJlcSwgcmVzLCBuZXh0KTtcblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIHRlc3RPcHRpb25zUm91dGUoXG5cdFx0cmVxOiBSZXF1ZXN0LFxuXHRcdHJlczogUmVzcG9uc2UsXG5cdFx0bmV4dDogTmV4dEZ1bmN0aW9uXG5cdCk6IHZvaWQge1xuXHRcdHRyeSB7XG5cdFx0XHR0aGlzLmxvZ2dlci5pbmZvKCdUZXN0IHJvdXRlIGFjY2Vzc2VkLicpO1xuXHRcdFx0cmVzLnNlbmQoJ1Rlc3Qgcm91dGUgaXMgd29ya2luZyEnKTtcblx0XHR9IGNhdGNoIChlcnJvcikge1xuXHRcdFx0dGhpcy5oYW5kbGVSb3V0ZUVycm9yKGVycm9yLCByZXEsIHJlcywgbmV4dCk7XG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSB0ZXN0UGF0Y2hSb3V0ZShcblx0XHRyZXE6IFJlcXVlc3QsXG5cdFx0cmVzOiBSZXNwb25zZSxcblx0XHRuZXh0OiBOZXh0RnVuY3Rpb25cblx0KTogdm9pZCB7XG5cdFx0dHJ5IHtcblx0XHRcdHRoaXMubG9nZ2VyLmluZm8oJ1Rlc3Qgcm91dGUgYWNjZXNzZWQuJyk7XG5cdFx0XHRyZXMuc2VuZCgnVGVzdCByb3V0ZSBpcyB3b3JraW5nIScpO1xuXHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHR0aGlzLmhhbmRsZVJvdXRlRXJyb3IoZXJyb3IsIHJlcSwgcmVzLCBuZXh0KTtcblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIHRlc3RQb3N0Um91dGUoXG5cdFx0cmVxOiBSZXF1ZXN0LFxuXHRcdHJlczogUmVzcG9uc2UsXG5cdFx0bmV4dDogTmV4dEZ1bmN0aW9uXG5cdCk6IHZvaWQge1xuXHRcdHRyeSB7XG5cdFx0XHR0aGlzLmxvZ2dlci5pbmZvKCdQT1NUIFRlc3Qgcm91dGUgYWNjZXNzZWQuJyk7XG5cdFx0XHRyZXMuc2VuZCgnUE9TVCBUZXN0IHJvdXRlIGlzIHdvcmtpbmchJyk7XG5cdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdHRoaXMuaGFuZGxlUm91dGVFcnJvcihlcnJvciwgcmVxLCByZXMsIG5leHQpO1xuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgdGVzdFB1dFJvdXRlKFxuXHRcdHJlcTogUmVxdWVzdCxcblx0XHRyZXM6IFJlc3BvbnNlLFxuXHRcdG5leHQ6IE5leHRGdW5jdGlvblxuXHQpOiB2b2lkIHtcblx0XHR0cnkge1xuXHRcdFx0dGhpcy5sb2dnZXIuaW5mbygnUFVUIFRlc3Qgcm91dGUgYWNjZXNzZWQuJyk7XG5cdFx0XHRyZXMuc2VuZCgnUFVUIFRlc3Qgcm91dGUgaXMgd29ya2luZyEnKTtcblx0XHR9IGNhdGNoIChlcnJvcikge1xuXHRcdFx0dGhpcy5oYW5kbGVSb3V0ZUVycm9yKGVycm9yLCByZXEsIHJlcywgbmV4dCk7XG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSB0ZXN0VHJhY2VSb3V0ZShcblx0XHRyZXE6IFJlcXVlc3QsXG5cdFx0cmVzOiBSZXNwb25zZSxcblx0XHRuZXh0OiBOZXh0RnVuY3Rpb25cblx0KTogdm9pZCB7XG5cdFx0dHJ5IHtcblx0XHRcdHRoaXMubG9nZ2VyLmluZm8oJ1Rlc3Qgcm91dGUgYWNjZXNzZWQuJyk7XG5cdFx0XHRyZXMuc2VuZCgnVGVzdCByb3V0ZSBpcyB3b3JraW5nIScpO1xuXHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHR0aGlzLmhhbmRsZVJvdXRlRXJyb3IoZXJyb3IsIHJlcSwgcmVzLCBuZXh0KTtcblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIGhhbmRsZVRlc3RSb3V0ZUVycm9ycyhcblx0XHRlcnJvcjogdW5rbm93bixcblx0XHRyZXE6IFJlcXVlc3QsXG5cdFx0cmVzOiBSZXNwb25zZSxcblx0XHRuZXh0OiBOZXh0RnVuY3Rpb25cblx0KTogdm9pZCB7XG5cdFx0aWYgKGVycm9yIGluc3RhbmNlb2YgRXJyb3IpIHtcblx0XHRcdHRoaXMubG9nZ2VyLmVycm9yKCdVbmV4cGVjdGVkIGVycm9yIG9uIHRlc3Qgcm91dGUnKTtcblx0XHRcdHRoaXMuZXJyb3JIYW5kbGVyLmV4cHJlc3NFcnJvckhhbmRsZXIoKShlcnJvciwgcmVxLCByZXMsIG5leHQpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aGlzLmxvZ2dlci5lcnJvcihcblx0XHRcdFx0J1VuZXhwZWN0ZWQgbm9uLWVycm9yIHRocm93biBvbiB0ZXN0IHJvdXRlJyxcblx0XHRcdFx0ZXJyb3Jcblx0XHRcdCk7XG5cdFx0XHR0aGlzLmVycm9ySGFuZGxlci5oYW5kbGVFcnJvcih7XG5cdFx0XHRcdGVycm9yOiBlcnJvciBhcyBzdHJpbmcsXG5cdFx0XHRcdHJlcVxuXHRcdFx0fSk7XG5cdFx0fVxuXHRcdHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcblx0XHRcdGVycm9yOiAnSW50ZXJuYWwgcm91dGluZyBlcnJvciBvbiB0ZXN0IHJvdXRlJ1xuXHRcdH0pO1xuXHR9XG59XG4iXX0=
