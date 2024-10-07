import gracefulShutdown from 'http-graceful-shutdown';
import https from 'https';
import { constants as cryptoConstants } from 'crypto';
import { validateDependencies } from '../utils/helpers.mjs';
import { AccessControlMiddlewareFactory } from '../index/factory/subfactories/AccessControlMiddlewareFactory.mjs';
import { AuthControllerFactory } from '../index/factory/subfactories/AuthControllerFactory.mjs';
import { AuthServiceFactory } from '../index/factory/subfactories/AuthServiceFactory.mjs';
import { CacheLayerServiceFactory } from '../index/factory/subfactories/CacheLayerServiceFactory.mjs';
import { DatabaseControllerFactory } from '../index/factory/subfactories/DatabaseControllerFactory.mjs';
import { EnvConfigServiceFactory } from '../index/factory/subfactories/EnvConfigServiceFactory.mjs';
import { GatekeeperServiceFactory } from '../index/factory/subfactories/GatekeeperServiceFactory.mjs';
import { MiddlewareFactory } from '../index/factory/subfactories/MiddlewareFactory.mjs';
import { MiddlewareStatusServiceFactory } from '../index/factory/subfactories/MiddlewareStatusServiceFactory.mjs';
import { PassportServiceFactory } from '../index/factory/subfactories/PassportServiceFactory.mjs';
import { PreHTTPSFactory } from '../index/factory/subfactories/PreHTTPSFactory.mjs';
import { ResourceManagerFactory } from '../index/factory/subfactories/ResourceManagerFactory.mjs';
import { RouterFactory } from '../index/factory/subfactories/RouterFactory.mjs';
import { UserControllerFactory } from '../index/factory/subfactories/UserControllerFactory.mjs';
import { VaultServiceFactory } from '../index/factory/subfactories/VaultServiceFactory.mjs';
import { tlsCiphers } from '../config/security.mjs';
import timeout from 'connect-timeout';
import { LoggerServiceFactory } from '../index/factory/subfactories/LoggerServiceFactory.mjs';
import { ErrorHandlerServiceFactory } from '../index/factory/subfactories/ErrorHandlerServiceFactory.mjs';
import { HealthCheckServiceFactory } from '../index/factory/subfactories/HealthCheckServiceFactory.mjs';
import { RootMiddlewareFactory } from '../index/factory/subfactories/RootMiddlewareFactory.mjs';
export class HTTPSServer {
	static instance = null;
	accessControlMiddleware;
	authController;
	backupCodeService;
	baseRouter;
	cacheService;
	csrfMiddleware;
	databaseController;
	emailMFAService;
	errorLogger;
	errorHandler;
	envConfig;
	fido2Service;
	gatekeeperService;
	healthCheckService;
	helmetMiddleware;
	jwtAuthMiddlewareService;
	jwtService;
	logger;
	mailerService;
	middlewareStatusService;
	multerUploadService;
	passportAuthMiddlewareService;
	passportService;
	passwordService;
	redisService;
	resourceManager;
	rootMiddlewareService;
	totpService;
	userController;
	vault;
	yubicoOTPService;
	server = null;
	app;
	sequelize;
	shuttingDown = false;
	connections = new Set();
	options;
	port;
	requestTimeout;
	shutdownTimeout;
	constructor(
		app,
		sequelize,
		logger,
		errorLogger,
		errorHandler,
		envConfig,
		cacheService,
		redisService,
		resourceManager,
		healthCheckService,
		helmetMiddleware,
		jwtAuthMiddlewareService,
		passportAuthMiddlewareService,
		accessControlMiddleware,
		authConroller,
		backupCodeService,
		baseRouter,
		csrfMiddleware,
		databaseController,
		emailMFAService,
		fido2Service,
		gatekeeperService,
		jwtService,
		mailerService,
		middlewareStatusService,
		multerUploadService,
		passportService,
		passwordService,
		rootMiddlewareService,
		totpService,
		userController,
		vault,
		yubicoOTPService
	) {
		this.app = app;
		this.sequelize = sequelize;
		this.logger = logger;
		this.errorLogger = errorLogger;
		this.errorHandler = errorHandler;
		this.envConfig = envConfig;
		this.cacheService = cacheService;
		this.redisService = redisService;
		this.resourceManager = resourceManager;
		this.healthCheckService = healthCheckService;
		this.helmetMiddleware = helmetMiddleware;
		this.jwtAuthMiddlewareService = jwtAuthMiddlewareService;
		this.passportAuthMiddlewareService = passportAuthMiddlewareService;
		this.accessControlMiddleware = accessControlMiddleware;
		this.authController = authConroller;
		this.backupCodeService = backupCodeService;
		this.baseRouter = baseRouter;
		this.csrfMiddleware = csrfMiddleware;
		this.databaseController = databaseController;
		this.emailMFAService = emailMFAService;
		this.fido2Service = fido2Service;
		this.gatekeeperService = gatekeeperService;
		this.jwtService = jwtService;
		this.mailerService = mailerService;
		this.middlewareStatusService = middlewareStatusService;
		this.multerUploadService = multerUploadService;
		this.passportService = passportService;
		this.passwordService = passwordService;
		this.rootMiddlewareService = rootMiddlewareService;
		this.totpService = totpService;
		this.userController = userController;
		this.vault = vault;
		this.yubicoOTPService = yubicoOTPService;
		this.port = this.envConfig.getEnvVariable('serverPort');
		this.requestTimeout =
			this.envConfig.getEnvVariable('requestTimeout') || '30s';
		this.shutdownTimeout =
			this.envConfig.getEnvVariable('gracefulShutdownTimeout') || 30000;
		this.initializeServices();
		setInterval(() => {
			this.healthCheckService.performHealthCheck();
		}, 10000);
	}
	async initializeServices() {
		this.accessControlMiddleware =
			await AccessControlMiddlewareFactory.getAccessControlMiddlewareService();
		this.authController = await AuthControllerFactory.getAuthController();
		this.backupCodeService =
			await AuthServiceFactory.getBackupCodeService();
		this.baseRouter = await RouterFactory.getBaseRouter();
		this.csrfMiddleware = await MiddlewareFactory.getCSRFMiddleware();
		this.databaseController =
			await DatabaseControllerFactory.getDatabaseController();
		this.emailMFAService = await AuthServiceFactory.getEmailMFAService();
		this.fido2Service = await AuthServiceFactory.getFIDO2Service();
		this.gatekeeperService =
			await GatekeeperServiceFactory.getGatekeeperService();
		this.middlewareStatusService =
			await MiddlewareStatusServiceFactory.getMiddlewareStatusService();
		this.multerUploadService =
			await PreHTTPSFactory.getMulterUploadService();
		this.passportService =
			await PassportServiceFactory.getPassportService();
		this.passwordService = await AuthServiceFactory.getPasswordService();
		this.vault = await VaultServiceFactory.getVaultService();
		this.yubicoOTPService = await AuthServiceFactory.getYubicoOTPService();
	}
	static async getInstance(app, sequelize) {
		if (!HTTPSServer.instance) {
			const logger = await LoggerServiceFactory.getLoggerService();
			const errorLogger =
				await LoggerServiceFactory.getErrorLoggerService();
			const errorHandler =
				await ErrorHandlerServiceFactory.getErrorHandlerService();
			const envConfig =
				await EnvConfigServiceFactory.getEnvConfigService();
			const cacheService =
				await CacheLayerServiceFactory.getCacheService();
			const redisService =
				await CacheLayerServiceFactory.getRedisService();
			const resourceManager =
				await ResourceManagerFactory.getResourceManager();
			const healthCheckService =
				await HealthCheckServiceFactory.getHealthCheckService();
			const helmetMiddleware =
				await MiddlewareFactory.getHelmetMiddleware();
			const jwtAuthMiddlewareService =
				await MiddlewareFactory.getJWTAuthMiddleware();
			const passportAuthMiddlewareService =
				await MiddlewareFactory.getPassportAuthMiddleware();
			const accessControlMiddleware =
				await AccessControlMiddlewareFactory.getAccessControlMiddlewareService();
			const authConroller =
				await AuthControllerFactory.getAuthController();
			const backupCodeService =
				await AuthServiceFactory.getBackupCodeService();
			const baseRouter = await RouterFactory.getBaseRouter();
			const csrfMiddleware = await MiddlewareFactory.getCSRFMiddleware();
			const databaseController =
				await DatabaseControllerFactory.getDatabaseController();
			const emailMFAService =
				await AuthServiceFactory.getEmailMFAService();
			const fido2Service = await AuthServiceFactory.getFIDO2Service();
			const gatekeeperService =
				await GatekeeperServiceFactory.getGatekeeperService();
			const jwtService = await AuthServiceFactory.getJWTService();
			const mailerService = await PreHTTPSFactory.getMailerService();
			const middlewareStatusService =
				await MiddlewareStatusServiceFactory.getMiddlewareStatusService();
			const multerUploadService =
				await PreHTTPSFactory.getMulterUploadService();
			const passportService =
				await PassportServiceFactory.getPassportService();
			const passwordService =
				await AuthServiceFactory.getPasswordService();
			const rootMiddlewareService =
				await RootMiddlewareFactory.getRootMiddleware();
			const totpService = await AuthServiceFactory.getTOTPService();
			const userController =
				await UserControllerFactory.getUserController();
			const vault = await VaultServiceFactory.getVaultService();
			const yubicoOTPService =
				await AuthServiceFactory.getYubicoOTPService();
			HTTPSServer.instance = new HTTPSServer(
				app,
				sequelize,
				logger,
				errorLogger,
				errorHandler,
				envConfig,
				cacheService,
				redisService,
				resourceManager,
				healthCheckService,
				helmetMiddleware,
				jwtAuthMiddlewareService,
				passportAuthMiddlewareService,
				accessControlMiddleware,
				authConroller,
				backupCodeService,
				baseRouter,
				csrfMiddleware,
				databaseController,
				emailMFAService,
				fido2Service,
				gatekeeperService,
				jwtService,
				mailerService,
				middlewareStatusService,
				multerUploadService,
				passportService,
				passwordService,
				rootMiddlewareService,
				totpService,
				userController,
				vault,
				yubicoOTPService
			);
		}
		return HTTPSServer.instance;
	}
	async initialize() {
		try {
			this.logger.debug('Initializing the web server...');
			validateDependencies(
				[{ name: 'sequelize', instance: this.sequelize }],
				this.logger
			);
			this.options = await this.declareHTTPSServerOptions();
			await this.mountRouters();
			this.errorHandler.setShutdownHandler(() => this.shutdownServer());
			await this.startServer();
		} catch (error) {
			this.handleHTTPSServerErrorFatal(
				error,
				'INITIALIZE_SERVER',
				{},
				'Error initializing the web server'
			);
		}
	}
	async mountRouters() {
		const baseRouter = await this.baseRouter;
		this.app.use('/', baseRouter.getRouter());
		this.logger.info('Routers have been mounted.');
		this.app.use(timeout(this.requestTimeout));
		this.app.use((req, res, next) => {
			if (req.timedout) {
				this.logger.warn(
					`Request timed out for URL: ${req.originalUrl}`
				);
				res.status(503).json({ message: 'Request timed out' });
				return;
			}
			next();
		});
	}
	async declareHTTPSServerOptions() {
		try {
			validateDependencies(
				[{ name: 'tlsCiphers', instance: tlsCiphers }],
				this.logger
			);
			const tlsKeyPath1 = this.envConfig.getEnvVariable('tlsKeyPath1');
			const tlsCertPath1 = this.envConfig.getEnvVariable('tlsCertPath1');
			if (
				typeof tlsKeyPath1 !== 'string' ||
				typeof tlsCertPath1 !== 'string'
			) {
				throw new Error('TLS key or certificate path is not a string');
			}
			return {
				key: tlsKeyPath1,
				cert: tlsCertPath1,
				secureOptions:
					cryptoConstants.SSL_OP_NO_TLSv1 |
					cryptoConstants.SSL_OP_NO_TLSv1_1,
				ciphers: tlsCiphers.join(':'),
				honorCipherOrder:
					this.envConfig.getFeatureFlags().honorCipherOrder === true
			};
		} catch (error) {
			this.errorLogger.logError(
				`Error declaring web server options: ${error instanceof Error ? error.message : error}`
			);
			this.handleHTTPSServerErrorFatal(
				error,
				'DECLARE_SERVER_OPTIONS',
				{},
				'Error declaring web server options'
			);
			throw error;
		}
	}
	async startServer() {
		try {
			if (!this.options) {
				throw new this.errorHandler.ErrorClasses.ConfigurationErrorFatal(
					'Server options not set!'
				);
			}
			this.server = https.createServer(this.options, this.app);
			this.server.on('connection', conn => {
				this.connections.add(conn);
				conn.on('close', () => {
					this.connections.delete(conn);
				});
			});
			this.server.listen(this.port, () => {
				this.logger.info(`Server is running on port ${this.port}`);
			});
			this.setupGracefulShutdown();
		} catch (error) {
			this.errorLogger.logWarn(
				`Error starting the server: ${error instanceof Error ? error.message : error}`
			);
			this.handleHTTPSServerErrorRecoverable(
				error,
				'START_SERVER',
				{},
				'Error starting the server'
			);
		}
	}
	setupGracefulShutdown() {
		const shutdownTimeout = this.shutdownTimeout;
		gracefulShutdown(this.server, {
			signals: 'SIGINT SIGTERM',
			timeout: shutdownTimeout,
			onShutdown: async () => {
				this.logger.info('Server shutting down...');
				this.shuttingDown = true;
				await this.closeConnections();
				this.logger.info('All active connections closed.');
				await this.shutdownServer();
				this.logger.info(
					'All resources cleaned up and server shut down successfully.'
				);
			},
			finally: async () => {
				this.logger.info('Graceful shutdown process completed.');
			}
		});
		this.app.use((req, res, next) => {
			if (this.shuttingDown) {
				res.setHeader('Connection', 'close');
				return res.status(503).send('Server is shutting down.');
			}
			return next();
		});
	}
	async closeConnections() {
		try {
			await new Promise(resolve => {
				const timeout = setTimeout(() => {
					this.logger.warn('Force closing remaining connections...');
					this.connections.forEach(conn => conn.destroy());
					resolve();
				}, 30000);
				const checkConnections = setInterval(() => {
					if (this.connections.size === 0) {
						clearInterval(checkConnections);
						clearTimeout(timeout);
						resolve();
					}
				}, 100);
			});
		} catch (error) {
			this.errorLogger.logWarn(
				'Error closing connections: ${error instanceof Error ? error.message : error}'
			);
			this.handleHTTPSServerErrorRecoverable(
				error,
				'CLOSE_CONNECTIONS',
				{},
				'Error closing connections'
			);
		}
	}
	async shutdownServer() {
		if (this.shuttingDown) {
			this.logger.warn('Shutdown already in progress.');
			return;
		}
		this.shuttingDown = true;
		try {
			this.logger.info('Initiating server shutdown...');
			this.server?.close(() => {
				this.logger.info('No longer accepting new connections.');
			});
			await this.shutDownLayer20Services();
			await this.shutDownLayer19Services();
			await this.shutDownLayer17Services();
			await this.shutDownLayer16Services();
			await this.shutDownLayer15Services();
			await this.shutDownLayer14Services();
			await this.shutDownLayer13Services();
			await this.shutDownLayer12Services();
			await this.shutDownLayer11Services();
			await this.shutDownLayer10Services();
			await this.shutDownLayer9Services();
			await this.shutDownLayer8Services();
			await this.shutDownLayer7Services();
			await this.shutDownLayer6Services();
			await this.shutDownLayer5Services();
			await this.shutDownLayer4Services();
			await this.shutDownLayer3Services();
			await this.shutDownLayer2Services();
			await this.shutDownLayer1Services();
			this.logger.info('Server has shut down successfully.');
		} catch (error) {
			this.errorLogger.logError(
				`Error occurred while shutting down the server: ${error instanceof Error ? error.message : error}`
			);
			this.handleHTTPSServerErrorRecoverable(
				error,
				'SHUTDOWN_SERVER',
				{},
				'Error shutting down the server'
			);
		}
	}
	async getHTTPSServerInfo() {
		try {
			if (!this.server) {
				throw new this.errorHandler.ErrorClasses.ServerNotInitializedError(
					'HTTPS server is not initialized.'
				);
			}
			const uptime = process.uptime();
			const memoryUsage = process.memoryUsage();
			const cpuUsage = process.cpuUsage();
			return {
				status: this.server.listening ? 'Running' : 'Stopped',
				uptime_in_seconds: uptime,
				memoryUsage: {
					heapUsed: memoryUsage.heapUsed,
					heapTotal: memoryUsage.heapTotal,
					rss: memoryUsage.rss
				},
				cpuUsage: {
					user: cpuUsage.user / 1000,
					system: cpuUsage.system / 1000
				},
				connections: this.connections.size
			};
		} catch (error) {
			this.logger.error('Error getting HTTPS server info:', { error });
			throw error;
		}
	}
	async getHTTPSServerMetrics(serviceName) {
		try {
			if (!this.server) {
				throw new this.errorHandler.ErrorClasses.ServerNotInitializedError(
					'HTTPS server is not initialized.'
				);
			}
			const connectionsCount = this.connections.size;
			const uptime = process.uptime();
			const memoryUsage = process.memoryUsage();
			const cpuUsage = process.cpuUsage();
			const averageResponseTime =
				this.rootMiddlewareService.getAverageResponseTime();
			return {
				serviceName,
				connectionsCount,
				uptime_in_seconds: uptime,
				memoryUsage: {
					heapUsed: memoryUsage.heapUsed,
					heapTotal: memoryUsage.heapTotal,
					rss: memoryUsage.rss
				},
				cpuUsage: {
					user: cpuUsage.user / 1000,
					system: cpuUsage.system / 1000
				},
				averageResponseTime
			};
		} catch (error) {
			this.logger.error(
				`Error getting HTTPS server metrics for service ${serviceName}:`,
				{ error }
			);
			throw error;
		}
	}
	async shutDownLayer20Services() {
		this.logger.info('Shutting down Layer 20 services: Health Check...');
		try {
			this.healthCheckService.shutdown();
			this.logger.info('Layer 20 services have been shut down.');
		} catch (error) {
			this.handleHTTPSServerErrorRecoverable(
				error,
				'SHUTDOWN_LAYER_20',
				{},
				'Error shutting down Layer 20 services'
			);
		}
	}
	async shutDownLayer19Services() {
		this.logger.info(
			'Shutting down Layer 19 services: Resource Manager...'
		);
		try {
			await this.resourceManager.shutdown();
			this.logger.info('Layer 19 services have been shut down.');
		} catch (error) {
			this.handleHTTPSServerErrorRecoverable(
				error,
				'SHUTDOWN_LAYER_19',
				{},
				'Error shutting down Layer 19 services'
			);
		}
	}
	async shutDownLayer17Services() {
		this.logger.info(
			'Shutting down Layer 17 services: Mailer and Multer Upload Services...'
		);
		try {
			await Promise.all([
				this.mailerService.shutdown(),
				this.multerUploadService.shutdown()
			]);
			this.logger.info('Layer 17 services have been shut down.');
		} catch (error) {
			this.handleHTTPSServerErrorRecoverable(
				error,
				'SHUTDOWN_LAYER_17',
				{},
				'Error shutting down Layer 17 services'
			);
		}
	}
	async shutDownLayer16Services() {
		this.logger.info(
			'Shutting down Layer 16 services: CSRF, Helmet, JWT Auth, and Passport Middlewares...'
		);
		try {
			await Promise.all([
				this.csrfMiddleware.shutdown(),
				this.helmetMiddleware.shutdown(),
				this.jwtAuthMiddlewareService.shutdown(),
				this.passportAuthMiddlewareService.shutdown()
			]);
			this.logger.info('Layer 16 services have been shut down.');
		} catch (error) {
			this.handleHTTPSServerErrorRecoverable(
				error,
				'SHUTDOWN_LAYER_16',
				{},
				'Error shutting down Layer 16 services'
			);
		}
	}
	async shutDownLayer15Services() {
		this.logger.info(
			'Shutting down Layer 15 services: Passport Auth Service...'
		);
		try {
			await this.passportService.shutdown();
			this.logger.info('Layer 15 services have been shut down.');
		} catch (error) {
			this.handleHTTPSServerErrorRecoverable(
				error,
				'SHUTDOWN_LAYER_15',
				{},
				'Error shutting down Layer 15 services'
			);
		}
	}
	async shutDownLayer14Services() {
		this.logger.info(
			'Shutting down Layer 14 services: Backup Code, EmailMFA, FIDO2, JWT, TOTP, and Yubico OTP Services...'
		);
		try {
			await Promise.all([
				this.backupCodeService.shutdown(),
				this.emailMFAService.shutdown(),
				this.fido2Service.shutdown(),
				this.jwtService.shutdown(),
				this.passportService.shutdown(),
				this.totpService.shutdown(),
				this.yubicoOTPService.shutdown()
			]);
			this.logger.info('Layer 14 services have been shut down.');
		} catch (error) {
			this.handleHTTPSServerErrorRecoverable(
				error,
				'SHUTDOWN_LAYER_14',
				{},
				'Error shutting down Layer 14 services'
			);
		}
	}
	async shutDownLayer13Services() {
		this.logger.info('Shutting down Layer 13 services: Auth Controller...');
		try {
			await this.authController.shutdown();
			this.logger.info('Layer 13 services have been shut down.');
		} catch (error) {
			this.handleHTTPSServerErrorRecoverable(
				error,
				'SHUTDOWN_LAYER_13',
				{},
				'Error shutting down Layer 13 services'
			);
		}
	}
	async shutDownLayer12Services() {
		this.logger.info('Shutting down Layer 12 services: User Controller...');
		try {
			await this.userController.shutdown();
			this.logger.info('Layer 12 services have been shut down.');
		} catch (error) {
			this.handleHTTPSServerErrorRecoverable(
				error,
				'SHUTDOWN_LAYER_12',
				{},
				'Error shutting down Layer 12 services'
			);
		}
	}
	async shutDownLayer11Services() {
		this.logger.info(
			'Shutting down Layer 11 services: Base Router and router extensions (API Router, Health Router, Static Router, etc)...'
		);
		try {
			await this.baseRouter.shutdown();
			this.logger.info('Layer 11 services have been shut down.');
		} catch (error) {
			this.handleHTTPSServerErrorRecoverable(
				error,
				'SHUTDOWN_LAYER_11',
				{},
				'Error shutting down Layer 11 services'
			);
		}
	}
	async shutDownLayer10Services() {
		this.logger.info(
			'Shutting down Layer 10 services: Access Control Middleware...'
		);
		try {
			await this.accessControlMiddleware.shutdown();
			this.logger.info('Layer 10 services have been shut down.');
		} catch (error) {
			this.handleHTTPSServerErrorRecoverable(
				error,
				'SHUTDOWN_LAYER_10',
				{},
				'Error shutting down Layer 10 services'
			);
		}
	}
	async shutDownLayer9Services() {
		this.logger.info('Shutting down Layer 9 services: Gatekeeper...');
		try {
			await this.gatekeeperService.shutdown();
			this.logger.info('Layer 9 services have been shut down.');
		} catch (error) {
			this.handleHTTPSServerErrorRecoverable(
				error,
				'SHUTDOWN_LAYER_9',
				{},
				'Error shutting down Layer 9 services'
			);
		}
	}
	async shutDownLayer8Services() {
		this.logger.info('Shutting down Layer 8 services: Cache and Redis...');
		try {
			await Promise.all([
				this.cacheService.shutdown(),
				this.redisService.shutdown()
			]);
			this.logger.info('Layer 8 services have been shut down.');
		} catch (error) {
			this.handleHTTPSServerErrorRecoverable(
				error,
				'SHUTDOWN_LAYER_8',
				{},
				'Error shutting down Layer 8 services'
			);
		}
	}
	async shutDownLayer7Services() {
		this.logger.info(
			'Shutting down Layer 7 services: Database Controller...'
		);
		try {
			await this.databaseController.shutdown();
		} catch (error) {
			this.handleHTTPSServerErrorRecoverable(
				error,
				'SHUTDOWN_LAYER_7',
				{},
				'Error shutting down Layer 7 services'
			);
		}
	}
	async shutDownLayer6Services() {
		this.logger.info('Shutting down Layer 6 services: Root Middleware...');
		try {
			await this.databaseController.shutdown();
			this.logger.info('Layer 6 services have been shut down.');
		} catch (error) {
			this.handleHTTPSServerErrorRecoverable(
				error,
				'SHUTDOWN_LAYER_6',
				{},
				'Error shutting down Layer 6 services'
			);
		}
	}
	async shutDownLayer5Services() {
		this.logger.info(
			'Shutting down Layer 5 services: Middleware Status Service...'
		);
		try {
			await this.middlewareStatusService.shutdown();
			this.logger.info('Layer 5 services have been shut down.');
		} catch (error) {
			this.handleHTTPSServerErrorRecoverable(
				error,
				'SHUTDOWN_LAYER_5',
				{},
				'Error shutting down Layer 5 services'
			);
		}
	}
	async shutDownLayer4Services() {
		this.logger.info('Shutting down Layer 4 services: Vault...');
		try {
			await this.vault.shutdown();
			this.logger.info('Layer 4 services have been shut down.');
		} catch (error) {
			this.handleHTTPSServerErrorRecoverable(
				error,
				'SHUTDOWN_LAYER_4',
				{},
				'Error shutting down Layer 4 services'
			);
		}
	}
	async shutDownLayer3Services() {
		this.logger.info('Shutting down Layer 3 services: EnvConfig...');
		try {
			await this.envConfig.shutdown();
			this.logger.info('Layer 3 services have been shut down.');
		} catch (error) {
			this.handleHTTPSServerErrorRecoverable(
				error,
				'SHUTDOWN_LAYER_3',
				{},
				'Error shutting down Layer 3 services'
			);
		}
	}
	async shutDownLayer2Services() {
		this.logger.info('Shutting down Layer 2 services: Error Handler...');
		try {
			await this.errorHandler.shutdown();
			this.logger.info('Layer 2 services have been shut down.');
		} catch (error) {
			this.handleHTTPSServerErrorRecoverable(
				error,
				'SHUTDOWN_LAYER_2',
				{},
				'Error shutting down Layer 2 services'
			);
		}
	}
	async shutDownLayer1Services() {
		this.logger.info(
			'Shutting down Layer 1 services: Logger and Error Logger...'
		);
		try {
			await Promise.all([
				this.errorLogger.shutdown(),
				this.logger.shutdown()
			]);
			this.logger.info('Layer 1 services have been shut down.');
		} catch (error) {
			this.handleHTTPSServerErrorRecoverable(
				error,
				'SHUTDOWN_LAYER_1',
				{},
				'Error shutting down Layer 1 services'
			);
		}
	}
	handleHTTPSServerErrorRecoverable(
		error,
		errorHeader,
		errorDetails,
		customMessage
	) {
		const errorMessage = `${customMessage}: ${error}\n${error instanceof Error ? error.stack : ''}`;
		this.errorLogger.logError(errorMessage);
		const redisError =
			new this.errorHandler.ErrorClasses.HTTPSClientErrorFatal(
				errorHeader,
				{
					details: errorDetails,
					exposeToClient: false
				}
			);
		this.errorHandler.handleError({
			error: redisError
		});
		process.exit(1);
	}
	handleHTTPSServerErrorFatal(
		error,
		errorHeader,
		errorDetails,
		customMessage
	) {
		const errorMessage = `${customMessage}: ${error}\n${error instanceof Error ? error.stack : ''}`;
		this.errorLogger.logError(errorMessage);
		const redisError =
			new this.errorHandler.ErrorClasses.HTTPSClientErrorFatal(
				errorHeader,
				{
					details: errorDetails,
					exposeToClient: false
				}
			);
		this.errorHandler.handleError({
			error: redisError
		});
		process.exit(1);
	}
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSFRUUFMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvc2VydmljZXMvSFRUUFMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxnQkFBZ0IsTUFBTSx3QkFBd0IsQ0FBQztBQUN0RCxPQUFPLEtBQUssTUFBTSxPQUFPLENBQUM7QUFJMUIsT0FBTyxFQUFFLFNBQVMsSUFBSSxlQUFlLEVBQUUsTUFBTSxRQUFRLENBQUM7QUFDdEQsT0FBTyxFQUFFLG9CQUFvQixFQUFFLE1BQU0sa0JBQWtCLENBQUM7QUFtQ3hELE9BQU8sRUFBRSw4QkFBOEIsRUFBRSxNQUFNLDhEQUE4RCxDQUFDO0FBQzlHLE9BQU8sRUFBRSxxQkFBcUIsRUFBRSxNQUFNLHFEQUFxRCxDQUFDO0FBQzVGLE9BQU8sRUFBRSxrQkFBa0IsRUFBRSxNQUFNLGtEQUFrRCxDQUFDO0FBQ3RGLE9BQU8sRUFBRSx3QkFBd0IsRUFBRSxNQUFNLHdEQUF3RCxDQUFDO0FBQ2xHLE9BQU8sRUFBRSx5QkFBeUIsRUFBRSxNQUFNLHlEQUF5RCxDQUFDO0FBQ3BHLE9BQU8sRUFBRSx1QkFBdUIsRUFBRSxNQUFNLHVEQUF1RCxDQUFDO0FBQ2hHLE9BQU8sRUFBRSx3QkFBd0IsRUFBRSxNQUFNLHdEQUF3RCxDQUFDO0FBQ2xHLE9BQU8sRUFBRSxpQkFBaUIsRUFBRSxNQUFNLGlEQUFpRCxDQUFDO0FBQ3BGLE9BQU8sRUFBRSw4QkFBOEIsRUFBRSxNQUFNLDhEQUE4RCxDQUFDO0FBQzlHLE9BQU8sRUFBRSxzQkFBc0IsRUFBRSxNQUFNLHNEQUFzRCxDQUFDO0FBQzlGLE9BQU8sRUFBRSxlQUFlLEVBQUUsTUFBTSwrQ0FBK0MsQ0FBQztBQUNoRixPQUFPLEVBQUUsc0JBQXNCLEVBQUUsTUFBTSxzREFBc0QsQ0FBQztBQUM5RixPQUFPLEVBQUUsYUFBYSxFQUFFLE1BQU0sNkNBQTZDLENBQUM7QUFDNUUsT0FBTyxFQUFFLHFCQUFxQixFQUFFLE1BQU0scURBQXFELENBQUM7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LElBQUksQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLFlBQVksQ0FBQyxDQUFDO1FBQ3hDLE1BQU0sVUFBVSxHQUNmLElBQUksSUFBSSxDQUFDLFlBQVksQ0FBQyxZQUFZLENBQUMscUJBQXFCLENBQ3ZELFdBQVcsRUFDWDtZQUNDLE9BQU8sRUFBRSxZQUFZO1lBQ3JCLGNBQWMsRUFBRSxLQUFLO1NBQ3JCLENBQ0QsQ0FBQztRQUNILElBQUksQ0FBQyxZQUFZLENBQUMsV0FBVyxDQUFDO1lBQzdCLEtBQUssRUFBRSxVQUFVO1NBQ2pCLENBQUMsQ0FBQztRQUNILE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDakIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBncmFjZWZ1bFNodXRkb3duIGZyb20gJ2h0dHAtZ3JhY2VmdWwtc2h1dGRvd24nO1xuaW1wb3J0IGh0dHBzIGZyb20gJ2h0dHBzJztcbmltcG9ydCBuZXQgZnJvbSAnbmV0JztcbmltcG9ydCB7IFNlcXVlbGl6ZSB9IGZyb20gJ3NlcXVlbGl6ZSc7XG5pbXBvcnQgeyBBcHBsaWNhdGlvbiB9IGZyb20gJ2V4cHJlc3MnO1xuaW1wb3J0IHsgY29uc3RhbnRzIGFzIGNyeXB0b0NvbnN0YW50cyB9IGZyb20gJ2NyeXB0byc7XG5pbXBvcnQgeyB2YWxpZGF0ZURlcGVuZGVuY2llcyB9IGZyb20gJy4uL3V0aWxzL2hlbHBlcnMnO1xuaW1wb3J0IHtcblx0QWNjZXNzQ29udHJvbE1pZGRsZXdhcmVTZXJ2aWNlSW50ZXJmYWNlLFxuXHRBcHBMb2dnZXJTZXJ2aWNlSW50ZXJmYWNlLFxuXHRBdXRoQ29udHJvbGxlckludGVyZmFjZSxcblx0QmFja3VwQ29kZVNlcnZpY2VJbnRlcmZhY2UsXG5cdEJhc2VSb3V0ZXJJbnRlcmZhY2UsXG5cdENhY2hlU2VydmljZUludGVyZmFjZSxcblx0Q1NSRk1pZGRsZXdhcmVTZXJ2aWNlSW50ZXJmYWNlLFxuXHREYXRhYmFzZUNvbnRyb2xsZXJJbnRlcmZhY2UsXG5cdEVtYWlsTUZBU2VydmljZUludGVyZmFjZSxcblx0RXJyb3JIYW5kbGVyU2VydmljZUludGVyZmFjZSxcblx0RXJyb3JMb2dnZXJTZXJ2aWNlSW50ZXJmYWNlLFxuXHRFbnZDb25maWdTZXJ2aWNlSW50ZXJmYWNlLFxuXHRGSURPMlNlcnZpY2VJbnRlcmZhY2UsXG5cdEdhdGVrZWVwZXJTZXJ2aWNlSW50ZXJmYWNlLFxuXHRIZWFsdGhDaGVja1NlcnZpY2VJbnRlcmZhY2UsXG5cdEhlbG1ldE1pZGRsZXdhcmVTZXJ2aWNlSW50ZXJmYWNlLFxuXHRIVFRQU1NlcnZlckludGVyZmFjZSxcblx0SldUQXV0aE1pZGRsZXdhcmVTZXJ2aWNlSW50ZXJmYWNlLFxuXHRKV1RTZXJ2aWNlSW50ZXJmYWNlLFxuXHRNYWlsZXJTZXJ2aWNlSW50ZXJmYWNlLFxuXHRNaWRkbGV3YXJlU3RhdHVzU2VydmljZUludGVyZmFjZSxcblx0TXVsdGVyVXBsb2FkU2VydmljZUludGVyZmFjZSxcblx0UGFzc3BvcnRBdXRoTWlkZGxld2FyZVNlcnZpY2VJbnRlcmZhY2UsXG5cdFBhc3Nwb3J0U2VydmljZUludGVyZmFjZSxcblx0UGFzc3dvcmRTZXJ2aWNlSW50ZXJmYWNlLFxuXHRSZWRpc1NlcnZpY2VJbnRlcmZhY2UsXG5cdFJlc291cmNlTWFuYWdlckludGVyZmFjZSxcblx0Um9vdE1pZGRsZXdhcmVTZXJ2aWNlSW50ZXJmYWNlLFxuXHRUT1RQU2VydmljZUludGVyZmFjZSxcblx0VXNlckNvbnRyb2xsZXJJbnRlcmZhY2UsXG5cdFZhdWx0U2VydmljZUludGVyZmFjZSxcblx0WXViaWNvT1RQU2VydmljZUludGVyZmFjZVxufSBmcm9tICcuLi9pbmRleC9pbnRlcmZhY2VzL21haW4nO1xuaW1wb3J0IHsgQWNjZXNzQ29udHJvbE1pZGRsZXdhcmVGYWN0b3J5IH0gZnJvbSAnLi4vaW5kZXgvZmFjdG9yeS9zdWJmYWN0b3JpZXMvQWNjZXNzQ29udHJvbE1pZGRsZXdhcmVGYWN0b3J5JztcbmltcG9ydCB7IEF1dGhDb250cm9sbGVyRmFjdG9yeSB9IGZyb20gJy4uL2luZGV4L2ZhY3Rvcnkvc3ViZmFjdG9yaWVzL0F1dGhDb250cm9sbGVyRmFjdG9yeSc7XG5pbXBvcnQgeyBBdXRoU2VydmljZUZhY3RvcnkgfSBmcm9tICcuLi9pbmRleC9mYWN0b3J5L3N1YmZhY3Rvcmllcy9BdXRoU2VydmljZUZhY3RvcnknO1xuaW1wb3J0IHsgQ2FjaGVMYXllclNlcnZpY2VGYWN0b3J5IH0gZnJvbSAnLi4vaW5kZXgvZmFjdG9yeS9zdWJmYWN0b3JpZXMvQ2FjaGVMYXllclNlcnZpY2VGYWN0b3J5JztcbmltcG9ydCB7IERhdGFiYXNlQ29udHJvbGxlckZhY3RvcnkgfSBmcm9tICcuLi9pbmRleC9mYWN0b3J5L3N1YmZhY3Rvcmllcy9EYXRhYmFzZUNvbnRyb2xsZXJGYWN0b3J5JztcbmltcG9ydCB7IEVudkNvbmZpZ1NlcnZpY2VGYWN0b3J5IH0gZnJvbSAnLi4vaW5kZXgvZmFjdG9yeS9zdWJmYWN0b3JpZXMvRW52Q29uZmlnU2VydmljZUZhY3RvcnknO1xuaW1wb3J0IHsgR2F0ZWtlZXBlclNlcnZpY2VGYWN0b3J5IH0gZnJvbSAnLi4vaW5kZXgvZmFjdG9yeS9zdWJmYWN0b3JpZXMvR2F0ZWtlZXBlclNlcnZpY2VGYWN0b3J5JztcbmltcG9ydCB7IE1pZGRsZXdhcmVGYWN0b3J5IH0gZnJvbSAnLi4vaW5kZXgvZmFjdG9yeS9zdWJmYWN0b3JpZXMvTWlkZGxld2FyZUZhY3RvcnknO1xuaW1wb3J0IHsgTWlkZGxld2FyZVN0YXR1c1NlcnZpY2VGYWN0b3J5IH0gZnJvbSAnLi4vaW5kZXgvZmFjdG9yeS9zdWJmYWN0b3JpZXMvTWlkZGxld2FyZVN0YXR1c1NlcnZpY2VGYWN0b3J5JztcbmltcG9ydCB7IFBhc3Nwb3J0U2VydmljZUZhY3RvcnkgfSBmcm9tICcuLi9pbmRleC9mYWN0b3J5L3N1YmZhY3Rvcmllcy9QYXNzcG9ydFNlcnZpY2VGYWN0b3J5JztcbmltcG9ydCB7IFByZUhUVFBTRmFjdG9yeSB9IGZyb20gJy4uL2luZGV4L2ZhY3Rvcnkvc3ViZmFjdG9yaWVzL1ByZUhUVFBTRmFjdG9yeSc7XG5pbXBvcnQgeyBSZXNvdXJjZU1hbmFnZXJGYWN0b3J5IH0gZnJvbSAnLi4vaW5kZXgvZmFjdG9yeS9zdWJmYWN0b3JpZXMvUmVzb3VyY2VNYW5hZ2VyRmFjdG9yeSc7XG5pbXBvcnQgeyBSb3V0ZXJGYWN0b3J5IH0gZnJvbSAnLi4vaW5kZXgvZmFjdG9yeS9zdWJmYWN0b3JpZXMvUm91dGVyRmFjdG9yeSc7XG5pbXBvcnQgeyBVc2VyQ29udHJvbGxlckZhY3RvcnkgfSBmcm9tICcuLi9pbmRleC9mYWN0b3J5L3N1YmZhY3Rvcmllcy9Vc2VyQ29udHJvbGxlckZhY3RvcnknO1xuaW1wb3J0IHsgVmF1bHRTZXJ2aWNlRmFjdG9yeSB9IGZyb20gJy4uL2luZGV4L2ZhY3Rvcnkvc3ViZmFjdG9yaWVzL1ZhdWx0U2VydmljZUZhY3RvcnknO1xuaW1wb3J0IHsgdGxzQ2lwaGVycyB9IGZyb20gJy4uL2NvbmZpZy9zZWN1cml0eSc7XG5pbXBvcnQgeyBTZWN1cmVDb250ZXh0T3B0aW9ucyB9IGZyb20gJ3Rscyc7XG5pbXBvcnQgdGltZW91dCBmcm9tICdjb25uZWN0LXRpbWVvdXQnO1xuaW1wb3J0IHsgTG9nZ2VyU2VydmljZUZhY3RvcnkgfSBmcm9tICcuLi9pbmRleC9mYWN0b3J5L3N1YmZhY3Rvcmllcy9Mb2dnZXJTZXJ2aWNlRmFjdG9yeSc7XG5pbXBvcnQgeyBFcnJvckhhbmRsZXJTZXJ2aWNlRmFjdG9yeSB9IGZyb20gJy4uL2luZGV4L2ZhY3Rvcnkvc3ViZmFjdG9yaWVzL0Vycm9ySGFuZGxlclNlcnZpY2VGYWN0b3J5JztcbmltcG9ydCB7IEhlYWx0aENoZWNrU2VydmljZUZhY3RvcnkgfSBmcm9tICcuLi9pbmRleC9mYWN0b3J5L3N1YmZhY3Rvcmllcy9IZWFsdGhDaGVja1NlcnZpY2VGYWN0b3J5JztcbmltcG9ydCB7IFJvb3RNaWRkbGV3YXJlRmFjdG9yeSB9IGZyb20gJy4uL2luZGV4L2ZhY3Rvcnkvc3ViZmFjdG9yaWVzL1Jvb3RNaWRkbGV3YXJlRmFjdG9yeSc7XG5cbmV4cG9ydCBjbGFzcyBIVFRQU1NlcnZlciBpbXBsZW1lbnRzIEhUVFBTU2VydmVySW50ZXJmYWNlIHtcblx0cHVibGljIHN0YXRpYyBpbnN0YW5jZTogSFRUUFNTZXJ2ZXIgfCBudWxsID0gbnVsbDtcblxuXHRwcml2YXRlIGFjY2Vzc0NvbnRyb2xNaWRkbGV3YXJlOiBBY2Nlc3NDb250cm9sTWlkZGxld2FyZVNlcnZpY2VJbnRlcmZhY2U7XG5cdHByaXZhdGUgYXV0aENvbnRyb2xsZXI6IEF1dGhDb250cm9sbGVySW50ZXJmYWNlO1xuXHRwcml2YXRlIGJhY2t1cENvZGVTZXJ2aWNlOiBCYWNrdXBDb2RlU2VydmljZUludGVyZmFjZTtcblx0cHJpdmF0ZSBiYXNlUm91dGVyOiBCYXNlUm91dGVySW50ZXJmYWNlO1xuXHRwcml2YXRlIGNhY2hlU2VydmljZTogQ2FjaGVTZXJ2aWNlSW50ZXJmYWNlO1xuXHRwcml2YXRlIGNzcmZNaWRkbGV3YXJlOiBDU1JGTWlkZGxld2FyZVNlcnZpY2VJbnRlcmZhY2U7XG5cdHByaXZhdGUgZGF0YWJhc2VDb250cm9sbGVyOiBEYXRhYmFzZUNvbnRyb2xsZXJJbnRlcmZhY2U7XG5cdHByaXZhdGUgZW1haWxNRkFTZXJ2aWNlOiBFbWFpbE1GQVNlcnZpY2VJbnRlcmZhY2U7XG5cdHByaXZhdGUgZXJyb3JMb2dnZXI6IEVycm9yTG9nZ2VyU2VydmljZUludGVyZmFjZTtcblx0cHJpdmF0ZSBlcnJvckhhbmRsZXI6IEVycm9ySGFuZGxlclNlcnZpY2VJbnRlcmZhY2U7XG5cdHByaXZhdGUgZW52Q29uZmlnOiBFbnZDb25maWdTZXJ2aWNlSW50ZXJmYWNlO1xuXHRwcml2YXRlIGZpZG8yU2VydmljZTogRklETzJTZXJ2aWNlSW50ZXJmYWNlO1xuXHRwcml2YXRlIGdhdGVrZWVwZXJTZXJ2aWNlOiBHYXRla2VlcGVyU2VydmljZUludGVyZmFjZTtcblx0cHJpdmF0ZSBoZWFsdGhDaGVja1NlcnZpY2U6IEhlYWx0aENoZWNrU2VydmljZUludGVyZmFjZTtcblx0cHJpdmF0ZSBoZWxtZXRNaWRkbGV3YXJlOiBIZWxtZXRNaWRkbGV3YXJlU2VydmljZUludGVyZmFjZTtcblx0cHJpdmF0ZSBqd3RBdXRoTWlkZGxld2FyZVNlcnZpY2U6IEpXVEF1dGhNaWRkbGV3YXJlU2VydmljZUludGVyZmFjZTtcblx0cHJpdmF0ZSBqd3RTZXJ2aWNlOiBKV1RTZXJ2aWNlSW50ZXJmYWNlO1xuXHRwcml2YXRlIGxvZ2dlcjogQXBwTG9nZ2VyU2VydmljZUludGVyZmFjZTtcblx0cHJpdmF0ZSBtYWlsZXJTZXJ2aWNlOiBNYWlsZXJTZXJ2aWNlSW50ZXJmYWNlO1xuXHRwcml2YXRlIG1pZGRsZXdhcmVTdGF0dXNTZXJ2aWNlOiBNaWRkbGV3YXJlU3RhdHVzU2VydmljZUludGVyZmFjZTtcblx0cHJpdmF0ZSBtdWx0ZXJVcGxvYWRTZXJ2aWNlOiBNdWx0ZXJVcGxvYWRTZXJ2aWNlSW50ZXJmYWNlO1xuXHRwcml2YXRlIHBhc3Nwb3J0QXV0aE1pZGRsZXdhcmVTZXJ2aWNlOiBQYXNzcG9ydEF1dGhNaWRkbGV3YXJlU2VydmljZUludGVyZmFjZTtcblx0cHJpdmF0ZSBwYXNzcG9ydFNlcnZpY2U6IFBhc3Nwb3J0U2VydmljZUludGVyZmFjZTtcblx0cHJpdmF0ZSBwYXNzd29yZFNlcnZpY2U6IFBhc3N3b3JkU2VydmljZUludGVyZmFjZTtcblx0cHJpdmF0ZSByZWRpc1NlcnZpY2U6IFJlZGlzU2VydmljZUludGVyZmFjZTtcblx0cHJpdmF0ZSByZXNvdXJjZU1hbmFnZXI6IFJlc291cmNlTWFuYWdlckludGVyZmFjZTtcblx0cHJpdmF0ZSByb290TWlkZGxld2FyZVNlcnZpY2U6IFJvb3RNaWRkbGV3YXJlU2VydmljZUludGVyZmFjZTtcblx0cHJpdmF0ZSB0b3RwU2VydmljZTogVE9UUFNlcnZpY2VJbnRlcmZhY2U7XG5cdHByaXZhdGUgdXNlckNvbnRyb2xsZXI6IFVzZXJDb250cm9sbGVySW50ZXJmYWNlO1xuXHRwcml2YXRlIHZhdWx0OiBWYXVsdFNlcnZpY2VJbnRlcmZhY2U7XG5cdHByaXZhdGUgeXViaWNvT1RQU2VydmljZTogWXViaWNvT1RQU2VydmljZUludGVyZmFjZTtcblxuXHRwcml2YXRlIHNlcnZlcjogaHR0cHMuU2VydmVyIHwgbnVsbCA9IG51bGw7XG5cdHByaXZhdGUgYXBwOiBBcHBsaWNhdGlvbjtcblx0cHJpdmF0ZSBzZXF1ZWxpemU6IFNlcXVlbGl6ZTtcblx0cHJpdmF0ZSBzaHV0dGluZ0Rvd24gPSBmYWxzZTtcblx0cHJpdmF0ZSBjb25uZWN0aW9uczogU2V0PG5ldC5Tb2NrZXQ+ID0gbmV3IFNldCgpO1xuXHRwcml2YXRlIG9wdGlvbnM6IFNlY3VyZUNvbnRleHRPcHRpb25zIHwgdW5kZWZpbmVkO1xuXHRwcml2YXRlIHBvcnQ6IG51bWJlcjtcblx0cHJpdmF0ZSByZXF1ZXN0VGltZW91dDogc3RyaW5nO1xuXHRwcml2YXRlIHNodXRkb3duVGltZW91dDogbnVtYmVyO1xuXG5cdHByaXZhdGUgY29uc3RydWN0b3IoXG5cdFx0YXBwOiBBcHBsaWNhdGlvbixcblx0XHRzZXF1ZWxpemU6IFNlcXVlbGl6ZSxcblx0XHRsb2dnZXI6IEFwcExvZ2dlclNlcnZpY2VJbnRlcmZhY2UsXG5cdFx0ZXJyb3JMb2dnZXI6IEVycm9yTG9nZ2VyU2VydmljZUludGVyZmFjZSxcblx0XHRlcnJvckhhbmRsZXI6IEVycm9ySGFuZGxlclNlcnZpY2VJbnRlcmZhY2UsXG5cdFx0ZW52Q29uZmlnOiBFbnZDb25maWdTZXJ2aWNlSW50ZXJmYWNlLFxuXHRcdGNhY2hlU2VydmljZTogQ2FjaGVTZXJ2aWNlSW50ZXJmYWNlLFxuXHRcdHJlZGlzU2VydmljZTogUmVkaXNTZXJ2aWNlSW50ZXJmYWNlLFxuXHRcdHJlc291cmNlTWFuYWdlcjogUmVzb3VyY2VNYW5hZ2VySW50ZXJmYWNlLFxuXHRcdGhlYWx0aENoZWNrU2VydmljZTogSGVhbHRoQ2hlY2tTZXJ2aWNlSW50ZXJmYWNlLFxuXHRcdGhlbG1ldE1pZGRsZXdhcmU6IEhlbG1ldE1pZGRsZXdhcmVTZXJ2aWNlSW50ZXJmYWNlLFxuXHRcdGp3dEF1dGhNaWRkbGV3YXJlU2VydmljZTogSldUQXV0aE1pZGRsZXdhcmVTZXJ2aWNlSW50ZXJmYWNlLFxuXHRcdHBhc3Nwb3J0QXV0aE1pZGRsZXdhcmVTZXJ2aWNlOiBQYXNzcG9ydEF1dGhNaWRkbGV3YXJlU2VydmljZUludGVyZmFjZSxcblx0XHRhY2Nlc3NDb250cm9sTWlkZGxld2FyZTogQWNjZXNzQ29udHJvbE1pZGRsZXdhcmVTZXJ2aWNlSW50ZXJmYWNlLFxuXHRcdGF1dGhDb25yb2xsZXI6IEF1dGhDb250cm9sbGVySW50ZXJmYWNlLFxuXHRcdGJhY2t1cENvZGVTZXJ2aWNlOiBCYWNrdXBDb2RlU2VydmljZUludGVyZmFjZSxcblx0XHRiYXNlUm91dGVyOiBCYXNlUm91dGVySW50ZXJmYWNlLFxuXHRcdGNzcmZNaWRkbGV3YXJlOiBDU1JGTWlkZGxld2FyZVNlcnZpY2VJbnRlcmZhY2UsXG5cdFx0ZGF0YWJhc2VDb250cm9sbGVyOiBEYXRhYmFzZUNvbnRyb2xsZXJJbnRlcmZhY2UsXG5cdFx0ZW1haWxNRkFTZXJ2aWNlOiBFbWFpbE1GQVNlcnZpY2VJbnRlcmZhY2UsXG5cdFx0ZmlkbzJTZXJ2aWNlOiBGSURPMlNlcnZpY2VJbnRlcmZhY2UsXG5cdFx0Z2F0ZWtlZXBlclNlcnZpY2U6IEdhdGVrZWVwZXJTZXJ2aWNlSW50ZXJmYWNlLFxuXHRcdGp3dFNlcnZpY2U6IEpXVFNlcnZpY2VJbnRlcmZhY2UsXG5cdFx0bWFpbGVyU2VydmljZTogTWFpbGVyU2VydmljZUludGVyZmFjZSxcblx0XHRtaWRkbGV3YXJlU3RhdHVzU2VydmljZTogTWlkZGxld2FyZVN0YXR1c1NlcnZpY2VJbnRlcmZhY2UsXG5cdFx0bXVsdGVyVXBsb2FkU2VydmljZTogTXVsdGVyVXBsb2FkU2VydmljZUludGVyZmFjZSxcblx0XHRwYXNzcG9ydFNlcnZpY2U6IFBhc3Nwb3J0U2VydmljZUludGVyZmFjZSxcblx0XHRwYXNzd29yZFNlcnZpY2U6IFBhc3N3b3JkU2VydmljZUludGVyZmFjZSxcblx0XHRyb290TWlkZGxld2FyZVNlcnZpY2U6IFJvb3RNaWRkbGV3YXJlU2VydmljZUludGVyZmFjZSxcblx0XHR0b3RwU2VydmljZTogVE9UUFNlcnZpY2VJbnRlcmZhY2UsXG5cdFx0dXNlckNvbnRyb2xsZXI6IFVzZXJDb250cm9sbGVySW50ZXJmYWNlLFxuXHRcdHZhdWx0OiBWYXVsdFNlcnZpY2VJbnRlcmZhY2UsXG5cdFx0eXViaWNvT1RQU2VydmljZTogWXViaWNvT1RQU2VydmljZUludGVyZmFjZVxuXHQpIHtcblx0XHR0aGlzLmFwcCA9IGFwcDtcblx0XHR0aGlzLnNlcXVlbGl6ZSA9IHNlcXVlbGl6ZTtcblx0XHR0aGlzLmxvZ2dlciA9IGxvZ2dlcjtcblx0XHR0aGlzLmVycm9yTG9nZ2VyID0gZXJyb3JMb2dnZXI7XG5cdFx0dGhpcy5lcnJvckhhbmRsZXIgPSBlcnJvckhhbmRsZXI7XG5cdFx0dGhpcy5lbnZDb25maWcgPSBlbnZDb25maWc7XG5cdFx0dGhpcy5jYWNoZVNlcnZpY2UgPSBjYWNoZVNlcnZpY2U7XG5cdFx0dGhpcy5yZWRpc1NlcnZpY2UgPSByZWRpc1NlcnZpY2U7XG5cdFx0dGhpcy5yZXNvdXJjZU1hbmFnZXIgPSByZXNvdXJjZU1hbmFnZXI7XG5cdFx0dGhpcy5oZWFsdGhDaGVja1NlcnZpY2UgPSBoZWFsdGhDaGVja1NlcnZpY2U7XG5cdFx0dGhpcy5oZWxtZXRNaWRkbGV3YXJlID0gaGVsbWV0TWlkZGxld2FyZTtcblx0XHR0aGlzLmp3dEF1dGhNaWRkbGV3YXJlU2VydmljZSA9IGp3dEF1dGhNaWRkbGV3YXJlU2VydmljZTtcblx0XHR0aGlzLnBhc3Nwb3J0QXV0aE1pZGRsZXdhcmVTZXJ2aWNlID0gcGFzc3BvcnRBdXRoTWlkZGxld2FyZVNlcnZpY2U7XG5cdFx0dGhpcy5hY2Nlc3NDb250cm9sTWlkZGxld2FyZSA9IGFjY2Vzc0NvbnRyb2xNaWRkbGV3YXJlO1xuXHRcdHRoaXMuYXV0aENvbnRyb2xsZXIgPSBhdXRoQ29ucm9sbGVyO1xuXHRcdHRoaXMuYmFja3VwQ29kZVNlcnZpY2UgPSBiYWNrdXBDb2RlU2VydmljZTtcblx0XHR0aGlzLmJhc2VSb3V0ZXIgPSBiYXNlUm91dGVyO1xuXHRcdHRoaXMuY3NyZk1pZGRsZXdhcmUgPSBjc3JmTWlkZGxld2FyZTtcblx0XHR0aGlzLmRhdGFiYXNlQ29udHJvbGxlciA9IGRhdGFiYXNlQ29udHJvbGxlcjtcblx0XHR0aGlzLmVtYWlsTUZBU2VydmljZSA9IGVtYWlsTUZBU2VydmljZTtcblx0XHR0aGlzLmZpZG8yU2VydmljZSA9IGZpZG8yU2VydmljZTtcblx0XHR0aGlzLmdhdGVrZWVwZXJTZXJ2aWNlID0gZ2F0ZWtlZXBlclNlcnZpY2U7XG5cdFx0dGhpcy5qd3RTZXJ2aWNlID0gand0U2VydmljZTtcblx0XHR0aGlzLm1haWxlclNlcnZpY2UgPSBtYWlsZXJTZXJ2aWNlO1xuXHRcdHRoaXMubWlkZGxld2FyZVN0YXR1c1NlcnZpY2UgPSBtaWRkbGV3YXJlU3RhdHVzU2VydmljZTtcblx0XHR0aGlzLm11bHRlclVwbG9hZFNlcnZpY2UgPSBtdWx0ZXJVcGxvYWRTZXJ2aWNlO1xuXHRcdHRoaXMucGFzc3BvcnRTZXJ2aWNlID0gcGFzc3BvcnRTZXJ2aWNlO1xuXHRcdHRoaXMucGFzc3dvcmRTZXJ2aWNlID0gcGFzc3dvcmRTZXJ2aWNlO1xuXHRcdHRoaXMucm9vdE1pZGRsZXdhcmVTZXJ2aWNlID0gcm9vdE1pZGRsZXdhcmVTZXJ2aWNlO1xuXHRcdHRoaXMudG90cFNlcnZpY2UgPSB0b3RwU2VydmljZTtcblx0XHR0aGlzLnVzZXJDb250cm9sbGVyID0gdXNlckNvbnRyb2xsZXI7XG5cdFx0dGhpcy52YXVsdCA9IHZhdWx0O1xuXHRcdHRoaXMueXViaWNvT1RQU2VydmljZSA9IHl1Ymljb09UUFNlcnZpY2U7XG5cblx0XHR0aGlzLnBvcnQgPSB0aGlzLmVudkNvbmZpZy5nZXRFbnZWYXJpYWJsZSgnc2VydmVyUG9ydCcpO1xuXHRcdHRoaXMucmVxdWVzdFRpbWVvdXQgPVxuXHRcdFx0dGhpcy5lbnZDb25maWcuZ2V0RW52VmFyaWFibGUoJ3JlcXVlc3RUaW1lb3V0JykgfHwgJzMwcyc7XG5cdFx0dGhpcy5zaHV0ZG93blRpbWVvdXQgPVxuXHRcdFx0dGhpcy5lbnZDb25maWcuZ2V0RW52VmFyaWFibGUoJ2dyYWNlZnVsU2h1dGRvd25UaW1lb3V0JykgfHwgMzAwMDA7XG5cblx0XHR0aGlzLmluaXRpYWxpemVTZXJ2aWNlcygpO1xuXG5cdFx0c2V0SW50ZXJ2YWwoKCkgPT4ge1xuXHRcdFx0dGhpcy5oZWFsdGhDaGVja1NlcnZpY2UucGVyZm9ybUhlYWx0aENoZWNrKCk7XG5cdFx0fSwgMTAwMDApO1xuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyBpbml0aWFsaXplU2VydmljZXMoKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0dGhpcy5hY2Nlc3NDb250cm9sTWlkZGxld2FyZSA9XG5cdFx0XHRhd2FpdCBBY2Nlc3NDb250cm9sTWlkZGxld2FyZUZhY3RvcnkuZ2V0QWNjZXNzQ29udHJvbE1pZGRsZXdhcmVTZXJ2aWNlKCk7XG5cdFx0dGhpcy5hdXRoQ29udHJvbGxlciA9IGF3YWl0IEF1dGhDb250cm9sbGVyRmFjdG9yeS5nZXRBdXRoQ29udHJvbGxlcigpO1xuXHRcdHRoaXMuYmFja3VwQ29kZVNlcnZpY2UgPVxuXHRcdFx0YXdhaXQgQXV0aFNlcnZpY2VGYWN0b3J5LmdldEJhY2t1cENvZGVTZXJ2aWNlKCk7XG5cdFx0dGhpcy5iYXNlUm91dGVyID0gYXdhaXQgUm91dGVyRmFjdG9yeS5nZXRCYXNlUm91dGVyKCk7XG5cdFx0dGhpcy5jc3JmTWlkZGxld2FyZSA9IGF3YWl0IE1pZGRsZXdhcmVGYWN0b3J5LmdldENTUkZNaWRkbGV3YXJlKCk7XG5cdFx0dGhpcy5kYXRhYmFzZUNvbnRyb2xsZXIgPVxuXHRcdFx0YXdhaXQgRGF0YWJhc2VDb250cm9sbGVyRmFjdG9yeS5nZXREYXRhYmFzZUNvbnRyb2xsZXIoKTtcblx0XHR0aGlzLmVtYWlsTUZBU2VydmljZSA9IGF3YWl0IEF1dGhTZXJ2aWNlRmFjdG9yeS5nZXRFbWFpbE1GQVNlcnZpY2UoKTtcblx0XHR0aGlzLmZpZG8yU2VydmljZSA9IGF3YWl0IEF1dGhTZXJ2aWNlRmFjdG9yeS5nZXRGSURPMlNlcnZpY2UoKTtcblx0XHR0aGlzLmdhdGVrZWVwZXJTZXJ2aWNlID1cblx0XHRcdGF3YWl0IEdhdGVrZWVwZXJTZXJ2aWNlRmFjdG9yeS5nZXRHYXRla2VlcGVyU2VydmljZSgpO1xuXHRcdHRoaXMubWlkZGxld2FyZVN0YXR1c1NlcnZpY2UgPVxuXHRcdFx0YXdhaXQgTWlkZGxld2FyZVN0YXR1c1NlcnZpY2VGYWN0b3J5LmdldE1pZGRsZXdhcmVTdGF0dXNTZXJ2aWNlKCk7XG5cdFx0dGhpcy5tdWx0ZXJVcGxvYWRTZXJ2aWNlID1cblx0XHRcdGF3YWl0IFByZUhUVFBTRmFjdG9yeS5nZXRNdWx0ZXJVcGxvYWRTZXJ2aWNlKCk7XG5cdFx0dGhpcy5wYXNzcG9ydFNlcnZpY2UgPVxuXHRcdFx0YXdhaXQgUGFzc3BvcnRTZXJ2aWNlRmFjdG9yeS5nZXRQYXNzcG9ydFNlcnZpY2UoKTtcblx0XHR0aGlzLnBhc3N3b3JkU2VydmljZSA9IGF3YWl0IEF1dGhTZXJ2aWNlRmFjdG9yeS5nZXRQYXNzd29yZFNlcnZpY2UoKTtcblx0XHR0aGlzLnZhdWx0ID0gYXdhaXQgVmF1bHRTZXJ2aWNlRmFjdG9yeS5nZXRWYXVsdFNlcnZpY2UoKTtcblx0XHR0aGlzLnl1Ymljb09UUFNlcnZpY2UgPSBhd2FpdCBBdXRoU2VydmljZUZhY3RvcnkuZ2V0WXViaWNvT1RQU2VydmljZSgpO1xuXHR9XG5cblx0cHVibGljIHN0YXRpYyBhc3luYyBnZXRJbnN0YW5jZShcblx0XHRhcHA6IEFwcGxpY2F0aW9uLFxuXHRcdHNlcXVlbGl6ZTogU2VxdWVsaXplXG5cdCk6IFByb21pc2U8SFRUUFNTZXJ2ZXI+IHtcblx0XHRpZiAoIUhUVFBTU2VydmVyLmluc3RhbmNlKSB7XG5cdFx0XHRjb25zdCBsb2dnZXIgPSBhd2FpdCBMb2dnZXJTZXJ2aWNlRmFjdG9yeS5nZXRMb2dnZXJTZXJ2aWNlKCk7XG5cdFx0XHRjb25zdCBlcnJvckxvZ2dlciA9XG5cdFx0XHRcdGF3YWl0IExvZ2dlclNlcnZpY2VGYWN0b3J5LmdldEVycm9yTG9nZ2VyU2VydmljZSgpO1xuXHRcdFx0Y29uc3QgZXJyb3JIYW5kbGVyID1cblx0XHRcdFx0YXdhaXQgRXJyb3JIYW5kbGVyU2VydmljZUZhY3RvcnkuZ2V0RXJyb3JIYW5kbGVyU2VydmljZSgpO1xuXHRcdFx0Y29uc3QgZW52Q29uZmlnID1cblx0XHRcdFx0YXdhaXQgRW52Q29uZmlnU2VydmljZUZhY3RvcnkuZ2V0RW52Q29uZmlnU2VydmljZSgpO1xuXHRcdFx0Y29uc3QgY2FjaGVTZXJ2aWNlID1cblx0XHRcdFx0YXdhaXQgQ2FjaGVMYXllclNlcnZpY2VGYWN0b3J5LmdldENhY2hlU2VydmljZSgpO1xuXHRcdFx0Y29uc3QgcmVkaXNTZXJ2aWNlID1cblx0XHRcdFx0YXdhaXQgQ2FjaGVMYXllclNlcnZpY2VGYWN0b3J5LmdldFJlZGlzU2VydmljZSgpO1xuXHRcdFx0Y29uc3QgcmVzb3VyY2VNYW5hZ2VyID1cblx0XHRcdFx0YXdhaXQgUmVzb3VyY2VNYW5hZ2VyRmFjdG9yeS5nZXRSZXNvdXJjZU1hbmFnZXIoKTtcblx0XHRcdGNvbnN0IGhlYWx0aENoZWNrU2VydmljZSA9XG5cdFx0XHRcdGF3YWl0IEhlYWx0aENoZWNrU2VydmljZUZhY3RvcnkuZ2V0SGVhbHRoQ2hlY2tTZXJ2aWNlKCk7XG5cdFx0XHRjb25zdCBoZWxtZXRNaWRkbGV3YXJlID1cblx0XHRcdFx0YXdhaXQgTWlkZGxld2FyZUZhY3RvcnkuZ2V0SGVsbWV0TWlkZGxld2FyZSgpO1xuXHRcdFx0Y29uc3Qgand0QXV0aE1pZGRsZXdhcmVTZXJ2aWNlID1cblx0XHRcdFx0YXdhaXQgTWlkZGxld2FyZUZhY3RvcnkuZ2V0SldUQXV0aE1pZGRsZXdhcmUoKTtcblx0XHRcdGNvbnN0IHBhc3Nwb3J0QXV0aE1pZGRsZXdhcmVTZXJ2aWNlID1cblx0XHRcdFx0YXdhaXQgTWlkZGxld2FyZUZhY3RvcnkuZ2V0UGFzc3BvcnRBdXRoTWlkZGxld2FyZSgpO1xuXHRcdFx0Y29uc3QgYWNjZXNzQ29udHJvbE1pZGRsZXdhcmUgPVxuXHRcdFx0XHRhd2FpdCBBY2Nlc3NDb250cm9sTWlkZGxld2FyZUZhY3RvcnkuZ2V0QWNjZXNzQ29udHJvbE1pZGRsZXdhcmVTZXJ2aWNlKCk7XG5cdFx0XHRjb25zdCBhdXRoQ29ucm9sbGVyID1cblx0XHRcdFx0YXdhaXQgQXV0aENvbnRyb2xsZXJGYWN0b3J5LmdldEF1dGhDb250cm9sbGVyKCk7XG5cdFx0XHRjb25zdCBiYWNrdXBDb2RlU2VydmljZSA9XG5cdFx0XHRcdGF3YWl0IEF1dGhTZXJ2aWNlRmFjdG9yeS5nZXRCYWNrdXBDb2RlU2VydmljZSgpO1xuXHRcdFx0Y29uc3QgYmFzZVJvdXRlciA9IGF3YWl0IFJvdXRlckZhY3RvcnkuZ2V0QmFzZVJvdXRlcigpO1xuXHRcdFx0Y29uc3QgY3NyZk1pZGRsZXdhcmUgPSBhd2FpdCBNaWRkbGV3YXJlRmFjdG9yeS5nZXRDU1JGTWlkZGxld2FyZSgpO1xuXHRcdFx0Y29uc3QgZGF0YWJhc2VDb250cm9sbGVyID1cblx0XHRcdFx0YXdhaXQgRGF0YWJhc2VDb250cm9sbGVyRmFjdG9yeS5nZXREYXRhYmFzZUNvbnRyb2xsZXIoKTtcblx0XHRcdGNvbnN0IGVtYWlsTUZBU2VydmljZSA9XG5cdFx0XHRcdGF3YWl0IEF1dGhTZXJ2aWNlRmFjdG9yeS5nZXRFbWFpbE1GQVNlcnZpY2UoKTtcblx0XHRcdGNvbnN0IGZpZG8yU2VydmljZSA9IGF3YWl0IEF1dGhTZXJ2aWNlRmFjdG9yeS5nZXRGSURPMlNlcnZpY2UoKTtcblx0XHRcdGNvbnN0IGdhdGVrZWVwZXJTZXJ2aWNlID1cblx0XHRcdFx0YXdhaXQgR2F0ZWtlZXBlclNlcnZpY2VGYWN0b3J5LmdldEdhdGVrZWVwZXJTZXJ2aWNlKCk7XG5cdFx0XHRjb25zdCBqd3RTZXJ2aWNlID0gYXdhaXQgQXV0aFNlcnZpY2VGYWN0b3J5LmdldEpXVFNlcnZpY2UoKTtcblx0XHRcdGNvbnN0IG1haWxlclNlcnZpY2UgPSBhd2FpdCBQcmVIVFRQU0ZhY3RvcnkuZ2V0TWFpbGVyU2VydmljZSgpO1xuXHRcdFx0Y29uc3QgbWlkZGxld2FyZVN0YXR1c1NlcnZpY2UgPVxuXHRcdFx0XHRhd2FpdCBNaWRkbGV3YXJlU3RhdHVzU2VydmljZUZhY3RvcnkuZ2V0TWlkZGxld2FyZVN0YXR1c1NlcnZpY2UoKTtcblx0XHRcdGNvbnN0IG11bHRlclVwbG9hZFNlcnZpY2UgPVxuXHRcdFx0XHRhd2FpdCBQcmVIVFRQU0ZhY3RvcnkuZ2V0TXVsdGVyVXBsb2FkU2VydmljZSgpO1xuXHRcdFx0Y29uc3QgcGFzc3BvcnRTZXJ2aWNlID1cblx0XHRcdFx0YXdhaXQgUGFzc3BvcnRTZXJ2aWNlRmFjdG9yeS5nZXRQYXNzcG9ydFNlcnZpY2UoKTtcblx0XHRcdGNvbnN0IHBhc3N3b3JkU2VydmljZSA9XG5cdFx0XHRcdGF3YWl0IEF1dGhTZXJ2aWNlRmFjdG9yeS5nZXRQYXNzd29yZFNlcnZpY2UoKTtcblx0XHRcdGNvbnN0IHJvb3RNaWRkbGV3YXJlU2VydmljZSA9XG5cdFx0XHRcdGF3YWl0IFJvb3RNaWRkbGV3YXJlRmFjdG9yeS5nZXRSb290TWlkZGxld2FyZSgpO1xuXHRcdFx0Y29uc3QgdG90cFNlcnZpY2UgPSBhd2FpdCBBdXRoU2VydmljZUZhY3RvcnkuZ2V0VE9UUFNlcnZpY2UoKTtcblx0XHRcdGNvbnN0IHVzZXJDb250cm9sbGVyID1cblx0XHRcdFx0YXdhaXQgVXNlckNvbnRyb2xsZXJGYWN0b3J5LmdldFVzZXJDb250cm9sbGVyKCk7XG5cdFx0XHRjb25zdCB2YXVsdCA9IGF3YWl0IFZhdWx0U2VydmljZUZhY3RvcnkuZ2V0VmF1bHRTZXJ2aWNlKCk7XG5cdFx0XHRjb25zdCB5dWJpY29PVFBTZXJ2aWNlID1cblx0XHRcdFx0YXdhaXQgQXV0aFNlcnZpY2VGYWN0b3J5LmdldFl1Ymljb09UUFNlcnZpY2UoKTtcblxuXHRcdFx0SFRUUFNTZXJ2ZXIuaW5zdGFuY2UgPSBuZXcgSFRUUFNTZXJ2ZXIoXG5cdFx0XHRcdGFwcCxcblx0XHRcdFx0c2VxdWVsaXplLFxuXHRcdFx0XHRsb2dnZXIsXG5cdFx0XHRcdGVycm9yTG9nZ2VyLFxuXHRcdFx0XHRlcnJvckhhbmRsZXIsXG5cdFx0XHRcdGVudkNvbmZpZyxcblx0XHRcdFx0Y2FjaGVTZXJ2aWNlLFxuXHRcdFx0XHRyZWRpc1NlcnZpY2UsXG5cdFx0XHRcdHJlc291cmNlTWFuYWdlcixcblx0XHRcdFx0aGVhbHRoQ2hlY2tTZXJ2aWNlLFxuXHRcdFx0XHRoZWxtZXRNaWRkbGV3YXJlLFxuXHRcdFx0XHRqd3RBdXRoTWlkZGxld2FyZVNlcnZpY2UsXG5cdFx0XHRcdHBhc3Nwb3J0QXV0aE1pZGRsZXdhcmVTZXJ2aWNlLFxuXHRcdFx0XHRhY2Nlc3NDb250cm9sTWlkZGxld2FyZSxcblx0XHRcdFx0YXV0aENvbnJvbGxlcixcblx0XHRcdFx0YmFja3VwQ29kZVNlcnZpY2UsXG5cdFx0XHRcdGJhc2VSb3V0ZXIsXG5cdFx0XHRcdGNzcmZNaWRkbGV3YXJlLFxuXHRcdFx0XHRkYXRhYmFzZUNvbnRyb2xsZXIsXG5cdFx0XHRcdGVtYWlsTUZBU2VydmljZSxcblx0XHRcdFx0ZmlkbzJTZXJ2aWNlLFxuXHRcdFx0XHRnYXRla2VlcGVyU2VydmljZSxcblx0XHRcdFx0and0U2VydmljZSxcblx0XHRcdFx0bWFpbGVyU2VydmljZSxcblx0XHRcdFx0bWlkZGxld2FyZVN0YXR1c1NlcnZpY2UsXG5cdFx0XHRcdG11bHRlclVwbG9hZFNlcnZpY2UsXG5cdFx0XHRcdHBhc3Nwb3J0U2VydmljZSxcblx0XHRcdFx0cGFzc3dvcmRTZXJ2aWNlLFxuXHRcdFx0XHRyb290TWlkZGxld2FyZVNlcnZpY2UsXG5cdFx0XHRcdHRvdHBTZXJ2aWNlLFxuXHRcdFx0XHR1c2VyQ29udHJvbGxlcixcblx0XHRcdFx0dmF1bHQsXG5cdFx0XHRcdHl1Ymljb09UUFNlcnZpY2Vcblx0XHRcdCk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIEhUVFBTU2VydmVyLmluc3RhbmNlO1xuXHR9XG5cblx0cHVibGljIGFzeW5jIGluaXRpYWxpemUoKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0dHJ5IHtcblx0XHRcdHRoaXMubG9nZ2VyLmRlYnVnKCdJbml0aWFsaXppbmcgdGhlIHdlYiBzZXJ2ZXIuLi4nKTtcblx0XHRcdHZhbGlkYXRlRGVwZW5kZW5jaWVzKFxuXHRcdFx0XHRbeyBuYW1lOiAnc2VxdWVsaXplJywgaW5zdGFuY2U6IHRoaXMuc2VxdWVsaXplIH1dLFxuXHRcdFx0XHR0aGlzLmxvZ2dlclxuXHRcdFx0KTtcblxuXHRcdFx0dGhpcy5vcHRpb25zID0gYXdhaXQgdGhpcy5kZWNsYXJlSFRUUFNTZXJ2ZXJPcHRpb25zKCk7XG5cblx0XHRcdGF3YWl0IHRoaXMubW91bnRSb3V0ZXJzKCk7XG5cblx0XHRcdHRoaXMuZXJyb3JIYW5kbGVyLnNldFNodXRkb3duSGFuZGxlcigoKSA9PiB0aGlzLnNodXRkb3duU2VydmVyKCkpO1xuXG5cdFx0XHRhd2FpdCB0aGlzLnN0YXJ0U2VydmVyKCk7XG5cdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdHRoaXMuaGFuZGxlSFRUUFNTZXJ2ZXJFcnJvckZhdGFsKFxuXHRcdFx0XHRlcnJvcixcblx0XHRcdFx0J0lOSVRJQUxJWkVfU0VSVkVSJyxcblx0XHRcdFx0e30sXG5cdFx0XHRcdCdFcnJvciBpbml0aWFsaXppbmcgdGhlIHdlYiBzZXJ2ZXInXG5cdFx0XHQpO1xuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgbW91bnRSb3V0ZXJzKCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdGNvbnN0IGJhc2VSb3V0ZXIgPSBhd2FpdCB0aGlzLmJhc2VSb3V0ZXI7XG5cblx0XHR0aGlzLmFwcC51c2UoJy8nLCBiYXNlUm91dGVyLmdldFJvdXRlcigpKTtcblxuXHRcdHRoaXMubG9nZ2VyLmluZm8oJ1JvdXRlcnMgaGF2ZSBiZWVuIG1vdW50ZWQuJyk7XG5cblx0XHR0aGlzLmFwcC51c2UodGltZW91dCh0aGlzLnJlcXVlc3RUaW1lb3V0KSk7XG5cblx0XHR0aGlzLmFwcC51c2UoKHJlcSwgcmVzLCBuZXh0KSA9PiB7XG5cdFx0XHRpZiAocmVxLnRpbWVkb3V0KSB7XG5cdFx0XHRcdHRoaXMubG9nZ2VyLndhcm4oXG5cdFx0XHRcdFx0YFJlcXVlc3QgdGltZWQgb3V0IGZvciBVUkw6ICR7cmVxLm9yaWdpbmFsVXJsfWBcblx0XHRcdFx0KTtcblx0XHRcdFx0cmVzLnN0YXR1cyg1MDMpLmpzb24oeyBtZXNzYWdlOiAnUmVxdWVzdCB0aW1lZCBvdXQnIH0pO1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cdFx0XHRuZXh0KCk7XG5cdFx0fSk7XG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIGRlY2xhcmVIVFRQU1NlcnZlck9wdGlvbnMoKTogUHJvbWlzZTxTZWN1cmVDb250ZXh0T3B0aW9ucz4ge1xuXHRcdHRyeSB7XG5cdFx0XHR2YWxpZGF0ZURlcGVuZGVuY2llcyhcblx0XHRcdFx0W3sgbmFtZTogJ3Rsc0NpcGhlcnMnLCBpbnN0YW5jZTogdGxzQ2lwaGVycyB9XSxcblx0XHRcdFx0dGhpcy5sb2dnZXJcblx0XHRcdCk7XG5cblx0XHRcdGNvbnN0IHRsc0tleVBhdGgxID0gdGhpcy5lbnZDb25maWcuZ2V0RW52VmFyaWFibGUoJ3Rsc0tleVBhdGgxJyk7XG5cdFx0XHRjb25zdCB0bHNDZXJ0UGF0aDEgPSB0aGlzLmVudkNvbmZpZy5nZXRFbnZWYXJpYWJsZSgndGxzQ2VydFBhdGgxJyk7XG5cblx0XHRcdGlmIChcblx0XHRcdFx0dHlwZW9mIHRsc0tleVBhdGgxICE9PSAnc3RyaW5nJyB8fFxuXHRcdFx0XHR0eXBlb2YgdGxzQ2VydFBhdGgxICE9PSAnc3RyaW5nJ1xuXHRcdFx0KSB7XG5cdFx0XHRcdHRocm93IG5ldyBFcnJvcignVExTIGtleSBvciBjZXJ0aWZpY2F0ZSBwYXRoIGlzIG5vdCBhIHN0cmluZycpO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRrZXk6IHRsc0tleVBhdGgxLFxuXHRcdFx0XHRjZXJ0OiB0bHNDZXJ0UGF0aDEsXG5cdFx0XHRcdHNlY3VyZU9wdGlvbnM6XG5cdFx0XHRcdFx0Y3J5cHRvQ29uc3RhbnRzLlNTTF9PUF9OT19UTFN2MSB8XG5cdFx0XHRcdFx0Y3J5cHRvQ29uc3RhbnRzLlNTTF9PUF9OT19UTFN2MV8xLFxuXHRcdFx0XHRjaXBoZXJzOiB0bHNDaXBoZXJzLmpvaW4oJzonKSxcblx0XHRcdFx0aG9ub3JDaXBoZXJPcmRlcjpcblx0XHRcdFx0XHR0aGlzLmVudkNvbmZpZy5nZXRGZWF0dXJlRmxhZ3MoKS5ob25vckNpcGhlck9yZGVyID09PSB0cnVlXG5cdFx0XHR9O1xuXHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHR0aGlzLmVycm9yTG9nZ2VyLmxvZ0Vycm9yKFxuXHRcdFx0XHRgRXJyb3IgZGVjbGFyaW5nIHdlYiBzZXJ2ZXIgb3B0aW9uczogJHtlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IGVycm9yfWBcblx0XHRcdCk7XG5cdFx0XHR0aGlzLmhhbmRsZUhUVFBTU2VydmVyRXJyb3JGYXRhbChcblx0XHRcdFx0ZXJyb3IsXG5cdFx0XHRcdCdERUNMQVJFX1NFUlZFUl9PUFRJT05TJyxcblx0XHRcdFx0e30sXG5cdFx0XHRcdCdFcnJvciBkZWNsYXJpbmcgd2ViIHNlcnZlciBvcHRpb25zJ1xuXHRcdFx0KTtcblx0XHRcdHRocm93IGVycm9yO1xuXHRcdH1cblx0fVxuXG5cdHB1YmxpYyBhc3luYyBzdGFydFNlcnZlcigpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHR0cnkge1xuXHRcdFx0aWYgKCF0aGlzLm9wdGlvbnMpIHtcblx0XHRcdFx0dGhyb3cgbmV3IHRoaXMuZXJyb3JIYW5kbGVyLkVycm9yQ2xhc3Nlcy5Db25maWd1cmF0aW9uRXJyb3JGYXRhbChcblx0XHRcdFx0XHQnU2VydmVyIG9wdGlvbnMgbm90IHNldCEnXG5cdFx0XHRcdCk7XG5cdFx0XHR9XG5cblx0XHRcdHRoaXMuc2VydmVyID0gaHR0cHMuY3JlYXRlU2VydmVyKHRoaXMub3B0aW9ucywgdGhpcy5hcHApO1xuXG5cdFx0XHR0aGlzLnNlcnZlci5vbignY29ubmVjdGlvbicsIChjb25uOiBuZXQuU29ja2V0KSA9PiB7XG5cdFx0XHRcdHRoaXMuY29ubmVjdGlvbnMuYWRkKGNvbm4pO1xuXHRcdFx0XHRjb25uLm9uKCdjbG9zZScsICgpID0+IHtcblx0XHRcdFx0XHR0aGlzLmNvbm5lY3Rpb25zLmRlbGV0ZShjb25uKTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9KTtcblxuXHRcdFx0dGhpcy5zZXJ2ZXIubGlzdGVuKHRoaXMucG9ydCwgKCkgPT4ge1xuXHRcdFx0XHR0aGlzLmxvZ2dlci5pbmZvKGBTZXJ2ZXIgaXMgcnVubmluZyBvbiBwb3J0ICR7dGhpcy5wb3J0fWApO1xuXHRcdFx0fSk7XG5cblx0XHRcdHRoaXMuc2V0dXBHcmFjZWZ1bFNodXRkb3duKCk7XG5cdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdHRoaXMuZXJyb3JMb2dnZXIubG9nV2Fybihcblx0XHRcdFx0YEVycm9yIHN0YXJ0aW5nIHRoZSBzZXJ2ZXI6ICR7ZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBlcnJvcn1gXG5cdFx0XHQpO1xuXHRcdFx0dGhpcy5oYW5kbGVIVFRQU1NlcnZlckVycm9yUmVjb3ZlcmFibGUoXG5cdFx0XHRcdGVycm9yLFxuXHRcdFx0XHQnU1RBUlRfU0VSVkVSJyxcblx0XHRcdFx0e30sXG5cdFx0XHRcdCdFcnJvciBzdGFydGluZyB0aGUgc2VydmVyJ1xuXHRcdFx0KTtcblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIHNldHVwR3JhY2VmdWxTaHV0ZG93bigpOiB2b2lkIHtcblx0XHRjb25zdCBzaHV0ZG93blRpbWVvdXQgPSB0aGlzLnNodXRkb3duVGltZW91dDtcblxuXHRcdGdyYWNlZnVsU2h1dGRvd24odGhpcy5zZXJ2ZXIhLCB7XG5cdFx0XHRzaWduYWxzOiAnU0lHSU5UIFNJR1RFUk0nLFxuXHRcdFx0dGltZW91dDogc2h1dGRvd25UaW1lb3V0LFxuXHRcdFx0b25TaHV0ZG93bjogYXN5bmMgKCkgPT4ge1xuXHRcdFx0XHR0aGlzLmxvZ2dlci5pbmZvKCdTZXJ2ZXIgc2h1dHRpbmcgZG93bi4uLicpO1xuXHRcdFx0XHR0aGlzLnNodXR0aW5nRG93biA9IHRydWU7XG5cblx0XHRcdFx0YXdhaXQgdGhpcy5jbG9zZUNvbm5lY3Rpb25zKCk7XG5cdFx0XHRcdHRoaXMubG9nZ2VyLmluZm8oJ0FsbCBhY3RpdmUgY29ubmVjdGlvbnMgY2xvc2VkLicpO1xuXG5cdFx0XHRcdGF3YWl0IHRoaXMuc2h1dGRvd25TZXJ2ZXIoKTtcblxuXHRcdFx0XHR0aGlzLmxvZ2dlci5pbmZvKFxuXHRcdFx0XHRcdCdBbGwgcmVzb3VyY2VzIGNsZWFuZWQgdXAgYW5kIHNlcnZlciBzaHV0IGRvd24gc3VjY2Vzc2Z1bGx5Lidcblx0XHRcdFx0KTtcblx0XHRcdH0sXG5cdFx0XHRmaW5hbGx5OiBhc3luYyAoKSA9PiB7XG5cdFx0XHRcdHRoaXMubG9nZ2VyLmluZm8oJ0dyYWNlZnVsIHNodXRkb3duIHByb2Nlc3MgY29tcGxldGVkLicpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0dGhpcy5hcHAudXNlKChyZXEsIHJlcywgbmV4dCkgPT4ge1xuXHRcdFx0aWYgKHRoaXMuc2h1dHRpbmdEb3duKSB7XG5cdFx0XHRcdHJlcy5zZXRIZWFkZXIoJ0Nvbm5lY3Rpb24nLCAnY2xvc2UnKTtcblx0XHRcdFx0cmV0dXJuIHJlcy5zdGF0dXMoNTAzKS5zZW5kKCdTZXJ2ZXIgaXMgc2h1dHRpbmcgZG93bi4nKTtcblx0XHRcdH1cblx0XHRcdHJldHVybiBuZXh0KCk7XG5cdFx0fSk7XG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIGNsb3NlQ29ubmVjdGlvbnMoKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0dHJ5IHtcblx0XHRcdGF3YWl0IG5ldyBQcm9taXNlPHZvaWQ+KHJlc29sdmUgPT4ge1xuXHRcdFx0XHRjb25zdCB0aW1lb3V0ID0gc2V0VGltZW91dCgoKSA9PiB7XG5cdFx0XHRcdFx0dGhpcy5sb2dnZXIud2FybignRm9yY2UgY2xvc2luZyByZW1haW5pbmcgY29ubmVjdGlvbnMuLi4nKTtcblx0XHRcdFx0XHR0aGlzLmNvbm5lY3Rpb25zLmZvckVhY2goY29ubiA9PiBjb25uLmRlc3Ryb3koKSk7XG5cdFx0XHRcdFx0cmVzb2x2ZSgpO1xuXHRcdFx0XHR9LCAzMDAwMCk7XG5cblx0XHRcdFx0Y29uc3QgY2hlY2tDb25uZWN0aW9ucyA9IHNldEludGVydmFsKCgpID0+IHtcblx0XHRcdFx0XHRpZiAodGhpcy5jb25uZWN0aW9ucy5zaXplID09PSAwKSB7XG5cdFx0XHRcdFx0XHRjbGVhckludGVydmFsKGNoZWNrQ29ubmVjdGlvbnMpO1xuXHRcdFx0XHRcdFx0Y2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xuXHRcdFx0XHRcdFx0cmVzb2x2ZSgpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSwgMTAwKTtcblx0XHRcdH0pO1xuXHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHR0aGlzLmVycm9yTG9nZ2VyLmxvZ1dhcm4oXG5cdFx0XHRcdCdFcnJvciBjbG9zaW5nIGNvbm5lY3Rpb25zOiAke2Vycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogZXJyb3J9J1xuXHRcdFx0KTtcblx0XHRcdHRoaXMuaGFuZGxlSFRUUFNTZXJ2ZXJFcnJvclJlY292ZXJhYmxlKFxuXHRcdFx0XHRlcnJvcixcblx0XHRcdFx0J0NMT1NFX0NPTk5FQ1RJT05TJyxcblx0XHRcdFx0e30sXG5cdFx0XHRcdCdFcnJvciBjbG9zaW5nIGNvbm5lY3Rpb25zJ1xuXHRcdFx0KTtcblx0XHR9XG5cdH1cblxuXHRwdWJsaWMgYXN5bmMgc2h1dGRvd25TZXJ2ZXIoKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0aWYgKHRoaXMuc2h1dHRpbmdEb3duKSB7XG5cdFx0XHR0aGlzLmxvZ2dlci53YXJuKCdTaHV0ZG93biBhbHJlYWR5IGluIHByb2dyZXNzLicpO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdHRoaXMuc2h1dHRpbmdEb3duID0gdHJ1ZTtcblxuXHRcdHRyeSB7XG5cdFx0XHR0aGlzLmxvZ2dlci5pbmZvKCdJbml0aWF0aW5nIHNlcnZlciBzaHV0ZG93bi4uLicpO1xuXG5cdFx0XHR0aGlzLnNlcnZlcj8uY2xvc2UoKCkgPT4ge1xuXHRcdFx0XHR0aGlzLmxvZ2dlci5pbmZvKCdObyBsb25nZXIgYWNjZXB0aW5nIG5ldyBjb25uZWN0aW9ucy4nKTtcblx0XHRcdH0pO1xuXG5cdFx0XHRhd2FpdCB0aGlzLnNodXREb3duTGF5ZXIyMFNlcnZpY2VzKCk7XG5cdFx0XHRhd2FpdCB0aGlzLnNodXREb3duTGF5ZXIxOVNlcnZpY2VzKCk7XG5cdFx0XHRhd2FpdCB0aGlzLnNodXREb3duTGF5ZXIxN1NlcnZpY2VzKCk7XG5cdFx0XHRhd2FpdCB0aGlzLnNodXREb3duTGF5ZXIxNlNlcnZpY2VzKCk7XG5cdFx0XHRhd2FpdCB0aGlzLnNodXREb3duTGF5ZXIxNVNlcnZpY2VzKCk7XG5cdFx0XHRhd2FpdCB0aGlzLnNodXREb3duTGF5ZXIxNFNlcnZpY2VzKCk7XG5cdFx0XHRhd2FpdCB0aGlzLnNodXREb3duTGF5ZXIxM1NlcnZpY2VzKCk7XG5cdFx0XHRhd2FpdCB0aGlzLnNodXREb3duTGF5ZXIxMlNlcnZpY2VzKCk7XG5cdFx0XHRhd2FpdCB0aGlzLnNodXREb3duTGF5ZXIxMVNlcnZpY2VzKCk7XG5cdFx0XHRhd2FpdCB0aGlzLnNodXREb3duTGF5ZXIxMFNlcnZpY2VzKCk7XG5cdFx0XHRhd2FpdCB0aGlzLnNodXREb3duTGF5ZXI5U2VydmljZXMoKTtcblx0XHRcdGF3YWl0IHRoaXMuc2h1dERvd25MYXllcjhTZXJ2aWNlcygpO1xuXHRcdFx0YXdhaXQgdGhpcy5zaHV0RG93bkxheWVyN1NlcnZpY2VzKCk7XG5cdFx0XHRhd2FpdCB0aGlzLnNodXREb3duTGF5ZXI2U2VydmljZXMoKTtcblx0XHRcdGF3YWl0IHRoaXMuc2h1dERvd25MYXllcjVTZXJ2aWNlcygpO1xuXHRcdFx0YXdhaXQgdGhpcy5zaHV0RG93bkxheWVyNFNlcnZpY2VzKCk7XG5cdFx0XHRhd2FpdCB0aGlzLnNodXREb3duTGF5ZXIzU2VydmljZXMoKTtcblx0XHRcdGF3YWl0IHRoaXMuc2h1dERvd25MYXllcjJTZXJ2aWNlcygpO1xuXHRcdFx0YXdhaXQgdGhpcy5zaHV0RG93bkxheWVyMVNlcnZpY2VzKCk7XG5cblx0XHRcdHRoaXMubG9nZ2VyLmluZm8oJ1NlcnZlciBoYXMgc2h1dCBkb3duIHN1Y2Nlc3NmdWxseS4nKTtcblx0XHR9IGNhdGNoIChlcnJvcikge1xuXHRcdFx0dGhpcy5lcnJvckxvZ2dlci5sb2dFcnJvcihcblx0XHRcdFx0YEVycm9yIG9jY3VycmVkIHdoaWxlIHNodXR0aW5nIGRvd24gdGhlIHNlcnZlcjogJHtlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IGVycm9yfWBcblx0XHRcdCk7XG5cdFx0XHR0aGlzLmhhbmRsZUhUVFBTU2VydmVyRXJyb3JSZWNvdmVyYWJsZShcblx0XHRcdFx0ZXJyb3IsXG5cdFx0XHRcdCdTSFVURE9XTl9TRVJWRVInLFxuXHRcdFx0XHR7fSxcblx0XHRcdFx0J0Vycm9yIHNodXR0aW5nIGRvd24gdGhlIHNlcnZlcidcblx0XHRcdCk7XG5cdFx0fVxuXHR9XG5cblx0cHVibGljIGFzeW5jIGdldEhUVFBTU2VydmVySW5mbygpOiBQcm9taXNlPFJlY29yZDxzdHJpbmcsIHVua25vd24+PiB7XG5cdFx0dHJ5IHtcblx0XHRcdGlmICghdGhpcy5zZXJ2ZXIpIHtcblx0XHRcdFx0dGhyb3cgbmV3IHRoaXMuZXJyb3JIYW5kbGVyLkVycm9yQ2xhc3Nlcy5TZXJ2ZXJOb3RJbml0aWFsaXplZEVycm9yKFxuXHRcdFx0XHRcdCdIVFRQUyBzZXJ2ZXIgaXMgbm90IGluaXRpYWxpemVkLidcblx0XHRcdFx0KTtcblx0XHRcdH1cblxuXHRcdFx0Y29uc3QgdXB0aW1lID0gcHJvY2Vzcy51cHRpbWUoKTtcblx0XHRcdGNvbnN0IG1lbW9yeVVzYWdlID0gcHJvY2Vzcy5tZW1vcnlVc2FnZSgpO1xuXHRcdFx0Y29uc3QgY3B1VXNhZ2UgPSBwcm9jZXNzLmNwdVVzYWdlKCk7XG5cblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdHN0YXR1czogdGhpcy5zZXJ2ZXIubGlzdGVuaW5nID8gJ1J1bm5pbmcnIDogJ1N0b3BwZWQnLFxuXHRcdFx0XHR1cHRpbWVfaW5fc2Vjb25kczogdXB0aW1lLFxuXHRcdFx0XHRtZW1vcnlVc2FnZToge1xuXHRcdFx0XHRcdGhlYXBVc2VkOiBtZW1vcnlVc2FnZS5oZWFwVXNlZCxcblx0XHRcdFx0XHRoZWFwVG90YWw6IG1lbW9yeVVzYWdlLmhlYXBUb3RhbCxcblx0XHRcdFx0XHRyc3M6IG1lbW9yeVVzYWdlLnJzc1xuXHRcdFx0XHR9LFxuXHRcdFx0XHRjcHVVc2FnZToge1xuXHRcdFx0XHRcdHVzZXI6IGNwdVVzYWdlLnVzZXIgLyAxMDAwLFxuXHRcdFx0XHRcdHN5c3RlbTogY3B1VXNhZ2Uuc3lzdGVtIC8gMTAwMFxuXHRcdFx0XHR9LFxuXHRcdFx0XHRjb25uZWN0aW9uczogdGhpcy5jb25uZWN0aW9ucy5zaXplXG5cdFx0XHR9O1xuXHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHR0aGlzLmxvZ2dlci5lcnJvcignRXJyb3IgZ2V0dGluZyBIVFRQUyBzZXJ2ZXIgaW5mbzonLCB7IGVycm9yIH0pO1xuXHRcdFx0dGhyb3cgZXJyb3I7XG5cdFx0fVxuXHR9XG5cblx0cHVibGljIGFzeW5jIGdldEhUVFBTU2VydmVyTWV0cmljcyhcblx0XHRzZXJ2aWNlTmFtZTogc3RyaW5nXG5cdCk6IFByb21pc2U8UmVjb3JkPHN0cmluZywgdW5rbm93bj4+IHtcblx0XHR0cnkge1xuXHRcdFx0aWYgKCF0aGlzLnNlcnZlcikge1xuXHRcdFx0XHR0aHJvdyBuZXcgdGhpcy5lcnJvckhhbmRsZXIuRXJyb3JDbGFzc2VzLlNlcnZlck5vdEluaXRpYWxpemVkRXJyb3IoXG5cdFx0XHRcdFx0J0hUVFBTIHNlcnZlciBpcyBub3QgaW5pdGlhbGl6ZWQuJ1xuXHRcdFx0XHQpO1xuXHRcdFx0fVxuXG5cdFx0XHRjb25zdCBjb25uZWN0aW9uc0NvdW50ID0gdGhpcy5jb25uZWN0aW9ucy5zaXplO1xuXHRcdFx0Y29uc3QgdXB0aW1lID0gcHJvY2Vzcy51cHRpbWUoKTtcblx0XHRcdGNvbnN0IG1lbW9yeVVzYWdlID0gcHJvY2Vzcy5tZW1vcnlVc2FnZSgpO1xuXHRcdFx0Y29uc3QgY3B1VXNhZ2UgPSBwcm9jZXNzLmNwdVVzYWdlKCk7XG5cdFx0XHRjb25zdCBhdmVyYWdlUmVzcG9uc2VUaW1lID1cblx0XHRcdFx0dGhpcy5yb290TWlkZGxld2FyZVNlcnZpY2UuZ2V0QXZlcmFnZVJlc3BvbnNlVGltZSgpO1xuXG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRzZXJ2aWNlTmFtZSxcblx0XHRcdFx0Y29ubmVjdGlvbnNDb3VudCxcblx0XHRcdFx0dXB0aW1lX2luX3NlY29uZHM6IHVwdGltZSxcblx0XHRcdFx0bWVtb3J5VXNhZ2U6IHtcblx0XHRcdFx0XHRoZWFwVXNlZDogbWVtb3J5VXNhZ2UuaGVhcFVzZWQsXG5cdFx0XHRcdFx0aGVhcFRvdGFsOiBtZW1vcnlVc2FnZS5oZWFwVG90YWwsXG5cdFx0XHRcdFx0cnNzOiBtZW1vcnlVc2FnZS5yc3Ncblx0XHRcdFx0fSxcblx0XHRcdFx0Y3B1VXNhZ2U6IHtcblx0XHRcdFx0XHR1c2VyOiBjcHVVc2FnZS51c2VyIC8gMTAwMCxcblx0XHRcdFx0XHRzeXN0ZW06IGNwdVVzYWdlLnN5c3RlbSAvIDEwMDBcblx0XHRcdFx0fSxcblx0XHRcdFx0YXZlcmFnZVJlc3BvbnNlVGltZVxuXHRcdFx0fTtcblx0XHR9IGNhdGNoIChlcnJvcikge1xuXHRcdFx0dGhpcy5sb2dnZXIuZXJyb3IoXG5cdFx0XHRcdGBFcnJvciBnZXR0aW5nIEhUVFBTIHNlcnZlciBtZXRyaWNzIGZvciBzZXJ2aWNlICR7c2VydmljZU5hbWV9OmAsXG5cdFx0XHRcdHsgZXJyb3IgfVxuXHRcdFx0KTtcblx0XHRcdHRocm93IGVycm9yO1xuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgc2h1dERvd25MYXllcjIwU2VydmljZXMoKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0dGhpcy5sb2dnZXIuaW5mbygnU2h1dHRpbmcgZG93biBMYXllciAyMCBzZXJ2aWNlczogSGVhbHRoIENoZWNrLi4uJyk7XG5cdFx0dHJ5IHtcblx0XHRcdHRoaXMuaGVhbHRoQ2hlY2tTZXJ2aWNlLnNodXRkb3duKCk7XG5cdFx0XHR0aGlzLmxvZ2dlci5pbmZvKCdMYXllciAyMCBzZXJ2aWNlcyBoYXZlIGJlZW4gc2h1dCBkb3duLicpO1xuXHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHR0aGlzLmhhbmRsZUhUVFBTU2VydmVyRXJyb3JSZWNvdmVyYWJsZShcblx0XHRcdFx0ZXJyb3IsXG5cdFx0XHRcdCdTSFVURE9XTl9MQVlFUl8yMCcsXG5cdFx0XHRcdHt9LFxuXHRcdFx0XHQnRXJyb3Igc2h1dHRpbmcgZG93biBMYXllciAyMCBzZXJ2aWNlcydcblx0XHRcdCk7XG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyBzaHV0RG93bkxheWVyMTlTZXJ2aWNlcygpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHR0aGlzLmxvZ2dlci5pbmZvKFxuXHRcdFx0J1NodXR0aW5nIGRvd24gTGF5ZXIgMTkgc2VydmljZXM6IFJlc291cmNlIE1hbmFnZXIuLi4nXG5cdFx0KTtcblx0XHR0cnkge1xuXHRcdFx0YXdhaXQgdGhpcy5yZXNvdXJjZU1hbmFnZXIuc2h1dGRvd24oKTtcblx0XHRcdHRoaXMubG9nZ2VyLmluZm8oJ0xheWVyIDE5IHNlcnZpY2VzIGhhdmUgYmVlbiBzaHV0IGRvd24uJyk7XG5cdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdHRoaXMuaGFuZGxlSFRUUFNTZXJ2ZXJFcnJvclJlY292ZXJhYmxlKFxuXHRcdFx0XHRlcnJvcixcblx0XHRcdFx0J1NIVVRET1dOX0xBWUVSXzE5Jyxcblx0XHRcdFx0e30sXG5cdFx0XHRcdCdFcnJvciBzaHV0dGluZyBkb3duIExheWVyIDE5IHNlcnZpY2VzJ1xuXHRcdFx0KTtcblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIHNodXREb3duTGF5ZXIxN1NlcnZpY2VzKCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdHRoaXMubG9nZ2VyLmluZm8oXG5cdFx0XHQnU2h1dHRpbmcgZG93biBMYXllciAxNyBzZXJ2aWNlczogTWFpbGVyIGFuZCBNdWx0ZXIgVXBsb2FkIFNlcnZpY2VzLi4uJ1xuXHRcdCk7XG5cdFx0dHJ5IHtcblx0XHRcdGF3YWl0IFByb21pc2UuYWxsKFtcblx0XHRcdFx0dGhpcy5tYWlsZXJTZXJ2aWNlLnNodXRkb3duKCksXG5cdFx0XHRcdHRoaXMubXVsdGVyVXBsb2FkU2VydmljZS5zaHV0ZG93bigpXG5cdFx0XHRdKTtcblx0XHRcdHRoaXMubG9nZ2VyLmluZm8oJ0xheWVyIDE3IHNlcnZpY2VzIGhhdmUgYmVlbiBzaHV0IGRvd24uJyk7XG5cdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdHRoaXMuaGFuZGxlSFRUUFNTZXJ2ZXJFcnJvclJlY292ZXJhYmxlKFxuXHRcdFx0XHRlcnJvcixcblx0XHRcdFx0J1NIVVRET1dOX0xBWUVSXzE3Jyxcblx0XHRcdFx0e30sXG5cdFx0XHRcdCdFcnJvciBzaHV0dGluZyBkb3duIExheWVyIDE3IHNlcnZpY2VzJ1xuXHRcdFx0KTtcblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIHNodXREb3duTGF5ZXIxNlNlcnZpY2VzKCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdHRoaXMubG9nZ2VyLmluZm8oXG5cdFx0XHQnU2h1dHRpbmcgZG93biBMYXllciAxNiBzZXJ2aWNlczogQ1NSRiwgSGVsbWV0LCBKV1QgQXV0aCwgYW5kIFBhc3Nwb3J0IE1pZGRsZXdhcmVzLi4uJ1xuXHRcdCk7XG5cdFx0dHJ5IHtcblx0XHRcdGF3YWl0IFByb21pc2UuYWxsKFtcblx0XHRcdFx0dGhpcy5jc3JmTWlkZGxld2FyZS5zaHV0ZG93bigpLFxuXHRcdFx0XHR0aGlzLmhlbG1ldE1pZGRsZXdhcmUuc2h1dGRvd24oKSxcblx0XHRcdFx0dGhpcy5qd3RBdXRoTWlkZGxld2FyZVNlcnZpY2Uuc2h1dGRvd24oKSxcblx0XHRcdFx0dGhpcy5wYXNzcG9ydEF1dGhNaWRkbGV3YXJlU2VydmljZS5zaHV0ZG93bigpXG5cdFx0XHRdKTtcblx0XHRcdHRoaXMubG9nZ2VyLmluZm8oJ0xheWVyIDE2IHNlcnZpY2VzIGhhdmUgYmVlbiBzaHV0IGRvd24uJyk7XG5cdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdHRoaXMuaGFuZGxlSFRUUFNTZXJ2ZXJFcnJvclJlY292ZXJhYmxlKFxuXHRcdFx0XHRlcnJvcixcblx0XHRcdFx0J1NIVVRET1dOX0xBWUVSXzE2Jyxcblx0XHRcdFx0e30sXG5cdFx0XHRcdCdFcnJvciBzaHV0dGluZyBkb3duIExheWVyIDE2IHNlcnZpY2VzJ1xuXHRcdFx0KTtcblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIHNodXREb3duTGF5ZXIxNVNlcnZpY2VzKCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdHRoaXMubG9nZ2VyLmluZm8oXG5cdFx0XHQnU2h1dHRpbmcgZG93biBMYXllciAxNSBzZXJ2aWNlczogUGFzc3BvcnQgQXV0aCBTZXJ2aWNlLi4uJ1xuXHRcdCk7XG5cdFx0dHJ5IHtcblx0XHRcdGF3YWl0IHRoaXMucGFzc3BvcnRTZXJ2aWNlLnNodXRkb3duKCk7XG5cdFx0XHR0aGlzLmxvZ2dlci5pbmZvKCdMYXllciAxNSBzZXJ2aWNlcyBoYXZlIGJlZW4gc2h1dCBkb3duLicpO1xuXHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHR0aGlzLmhhbmRsZUhUVFBTU2VydmVyRXJyb3JSZWNvdmVyYWJsZShcblx0XHRcdFx0ZXJyb3IsXG5cdFx0XHRcdCdTSFVURE9XTl9MQVlFUl8xNScsXG5cdFx0XHRcdHt9LFxuXHRcdFx0XHQnRXJyb3Igc2h1dHRpbmcgZG93biBMYXllciAxNSBzZXJ2aWNlcydcblx0XHRcdCk7XG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyBzaHV0RG93bkxheWVyMTRTZXJ2aWNlcygpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHR0aGlzLmxvZ2dlci5pbmZvKFxuXHRcdFx0J1NodXR0aW5nIGRvd24gTGF5ZXIgMTQgc2VydmljZXM6IEJhY2t1cCBDb2RlLCBFbWFpbE1GQSwgRklETzIsIEpXVCwgVE9UUCwgYW5kIFl1YmljbyBPVFAgU2VydmljZXMuLi4nXG5cdFx0KTtcblx0XHR0cnkge1xuXHRcdFx0YXdhaXQgUHJvbWlzZS5hbGwoW1xuXHRcdFx0XHR0aGlzLmJhY2t1cENvZGVTZXJ2aWNlLnNodXRkb3duKCksXG5cdFx0XHRcdHRoaXMuZW1haWxNRkFTZXJ2aWNlLnNodXRkb3duKCksXG5cdFx0XHRcdHRoaXMuZmlkbzJTZXJ2aWNlLnNodXRkb3duKCksXG5cdFx0XHRcdHRoaXMuand0U2VydmljZS5zaHV0ZG93bigpLFxuXHRcdFx0XHR0aGlzLnBhc3Nwb3J0U2VydmljZS5zaHV0ZG93bigpLFxuXHRcdFx0XHR0aGlzLnRvdHBTZXJ2aWNlLnNodXRkb3duKCksXG5cdFx0XHRcdHRoaXMueXViaWNvT1RQU2VydmljZS5zaHV0ZG93bigpXG5cdFx0XHRdKTtcblx0XHRcdHRoaXMubG9nZ2VyLmluZm8oJ0xheWVyIDE0IHNlcnZpY2VzIGhhdmUgYmVlbiBzaHV0IGRvd24uJyk7XG5cdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdHRoaXMuaGFuZGxlSFRUUFNTZXJ2ZXJFcnJvclJlY292ZXJhYmxlKFxuXHRcdFx0XHRlcnJvcixcblx0XHRcdFx0J1NIVVRET1dOX0xBWUVSXzE0Jyxcblx0XHRcdFx0e30sXG5cdFx0XHRcdCdFcnJvciBzaHV0dGluZyBkb3duIExheWVyIDE0IHNlcnZpY2VzJ1xuXHRcdFx0KTtcblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIHNodXREb3duTGF5ZXIxM1NlcnZpY2VzKCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdHRoaXMubG9nZ2VyLmluZm8oJ1NodXR0aW5nIGRvd24gTGF5ZXIgMTMgc2VydmljZXM6IEF1dGggQ29udHJvbGxlci4uLicpO1xuXHRcdHRyeSB7XG5cdFx0XHRhd2FpdCB0aGlzLmF1dGhDb250cm9sbGVyLnNodXRkb3duKCk7XG5cdFx0XHR0aGlzLmxvZ2dlci5pbmZvKCdMYXllciAxMyBzZXJ2aWNlcyBoYXZlIGJlZW4gc2h1dCBkb3duLicpO1xuXHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHR0aGlzLmhhbmRsZUhUVFBTU2VydmVyRXJyb3JSZWNvdmVyYWJsZShcblx0XHRcdFx0ZXJyb3IsXG5cdFx0XHRcdCdTSFVURE9XTl9MQVlFUl8xMycsXG5cdFx0XHRcdHt9LFxuXHRcdFx0XHQnRXJyb3Igc2h1dHRpbmcgZG93biBMYXllciAxMyBzZXJ2aWNlcydcblx0XHRcdCk7XG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyBzaHV0RG93bkxheWVyMTJTZXJ2aWNlcygpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHR0aGlzLmxvZ2dlci5pbmZvKCdTaHV0dGluZyBkb3duIExheWVyIDEyIHNlcnZpY2VzOiBVc2VyIENvbnRyb2xsZXIuLi4nKTtcblx0XHR0cnkge1xuXHRcdFx0YXdhaXQgdGhpcy51c2VyQ29udHJvbGxlci5zaHV0ZG93bigpO1xuXHRcdFx0dGhpcy5sb2dnZXIuaW5mbygnTGF5ZXIgMTIgc2VydmljZXMgaGF2ZSBiZWVuIHNodXQgZG93bi4nKTtcblx0XHR9IGNhdGNoIChlcnJvcikge1xuXHRcdFx0dGhpcy5oYW5kbGVIVFRQU1NlcnZlckVycm9yUmVjb3ZlcmFibGUoXG5cdFx0XHRcdGVycm9yLFxuXHRcdFx0XHQnU0hVVERPV05fTEFZRVJfMTInLFxuXHRcdFx0XHR7fSxcblx0XHRcdFx0J0Vycm9yIHNodXR0aW5nIGRvd24gTGF5ZXIgMTIgc2VydmljZXMnXG5cdFx0XHQpO1xuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgc2h1dERvd25MYXllcjExU2VydmljZXMoKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0dGhpcy5sb2dnZXIuaW5mbyhcblx0XHRcdCdTaHV0dGluZyBkb3duIExheWVyIDExIHNlcnZpY2VzOiBCYXNlIFJvdXRlciBhbmQgcm91dGVyIGV4dGVuc2lvbnMgKEFQSSBSb3V0ZXIsIEhlYWx0aCBSb3V0ZXIsIFN0YXRpYyBSb3V0ZXIsIGV0YykuLi4nXG5cdFx0KTtcblx0XHR0cnkge1xuXHRcdFx0YXdhaXQgdGhpcy5iYXNlUm91dGVyLnNodXRkb3duKCk7XG5cdFx0XHR0aGlzLmxvZ2dlci5pbmZvKCdMYXllciAxMSBzZXJ2aWNlcyBoYXZlIGJlZW4gc2h1dCBkb3duLicpO1xuXHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHR0aGlzLmhhbmRsZUhUVFBTU2VydmVyRXJyb3JSZWNvdmVyYWJsZShcblx0XHRcdFx0ZXJyb3IsXG5cdFx0XHRcdCdTSFVURE9XTl9MQVlFUl8xMScsXG5cdFx0XHRcdHt9LFxuXHRcdFx0XHQnRXJyb3Igc2h1dHRpbmcgZG93biBMYXllciAxMSBzZXJ2aWNlcydcblx0XHRcdCk7XG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyBzaHV0RG93bkxheWVyMTBTZXJ2aWNlcygpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHR0aGlzLmxvZ2dlci5pbmZvKFxuXHRcdFx0J1NodXR0aW5nIGRvd24gTGF5ZXIgMTAgc2VydmljZXM6IEFjY2VzcyBDb250cm9sIE1pZGRsZXdhcmUuLi4nXG5cdFx0KTtcblx0XHR0cnkge1xuXHRcdFx0YXdhaXQgdGhpcy5hY2Nlc3NDb250cm9sTWlkZGxld2FyZS5zaHV0ZG93bigpO1xuXHRcdFx0dGhpcy5sb2dnZXIuaW5mbygnTGF5ZXIgMTAgc2VydmljZXMgaGF2ZSBiZWVuIHNodXQgZG93bi4nKTtcblx0XHR9IGNhdGNoIChlcnJvcikge1xuXHRcdFx0dGhpcy5oYW5kbGVIVFRQU1NlcnZlckVycm9yUmVjb3ZlcmFibGUoXG5cdFx0XHRcdGVycm9yLFxuXHRcdFx0XHQnU0hVVERPV05fTEFZRVJfMTAnLFxuXHRcdFx0XHR7fSxcblx0XHRcdFx0J0Vycm9yIHNodXR0aW5nIGRvd24gTGF5ZXIgMTAgc2VydmljZXMnXG5cdFx0XHQpO1xuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgc2h1dERvd25MYXllcjlTZXJ2aWNlcygpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHR0aGlzLmxvZ2dlci5pbmZvKCdTaHV0dGluZyBkb3duIExheWVyIDkgc2VydmljZXM6IEdhdGVrZWVwZXIuLi4nKTtcblx0XHR0cnkge1xuXHRcdFx0YXdhaXQgdGhpcy5nYXRla2VlcGVyU2VydmljZS5zaHV0ZG93bigpO1xuXHRcdFx0dGhpcy5sb2dnZXIuaW5mbygnTGF5ZXIgOSBzZXJ2aWNlcyBoYXZlIGJlZW4gc2h1dCBkb3duLicpO1xuXHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHR0aGlzLmhhbmRsZUhUVFBTU2VydmVyRXJyb3JSZWNvdmVyYWJsZShcblx0XHRcdFx0ZXJyb3IsXG5cdFx0XHRcdCdTSFVURE9XTl9MQVlFUl85Jyxcblx0XHRcdFx0e30sXG5cdFx0XHRcdCdFcnJvciBzaHV0dGluZyBkb3duIExheWVyIDkgc2VydmljZXMnXG5cdFx0XHQpO1xuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgc2h1dERvd25MYXllcjhTZXJ2aWNlcygpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHR0aGlzLmxvZ2dlci5pbmZvKCdTaHV0dGluZyBkb3duIExheWVyIDggc2VydmljZXM6IENhY2hlIGFuZCBSZWRpcy4uLicpO1xuXHRcdHRyeSB7XG5cdFx0XHRhd2FpdCBQcm9taXNlLmFsbChbXG5cdFx0XHRcdHRoaXMuY2FjaGVTZXJ2aWNlLnNodXRkb3duKCksXG5cdFx0XHRcdHRoaXMucmVkaXNTZXJ2aWNlLnNodXRkb3duKClcblx0XHRcdF0pO1xuXHRcdFx0dGhpcy5sb2dnZXIuaW5mbygnTGF5ZXIgOCBzZXJ2aWNlcyBoYXZlIGJlZW4gc2h1dCBkb3duLicpO1xuXHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHR0aGlzLmhhbmRsZUhUVFBTU2VydmVyRXJyb3JSZWNvdmVyYWJsZShcblx0XHRcdFx0ZXJyb3IsXG5cdFx0XHRcdCdTSFVURE9XTl9MQVlFUl84Jyxcblx0XHRcdFx0e30sXG5cdFx0XHRcdCdFcnJvciBzaHV0dGluZyBkb3duIExheWVyIDggc2VydmljZXMnXG5cdFx0XHQpO1xuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgc2h1dERvd25MYXllcjdTZXJ2aWNlcygpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHR0aGlzLmxvZ2dlci5pbmZvKFxuXHRcdFx0J1NodXR0aW5nIGRvd24gTGF5ZXIgNyBzZXJ2aWNlczogRGF0YWJhc2UgQ29udHJvbGxlci4uLidcblx0XHQpO1xuXHRcdHRyeSB7XG5cdFx0XHRhd2FpdCB0aGlzLmRhdGFiYXNlQ29udHJvbGxlci5zaHV0ZG93bigpO1xuXHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHR0aGlzLmhhbmRsZUhUVFBTU2VydmVyRXJyb3JSZWNvdmVyYWJsZShcblx0XHRcdFx0ZXJyb3IsXG5cdFx0XHRcdCdTSFVURE9XTl9MQVlFUl83Jyxcblx0XHRcdFx0e30sXG5cdFx0XHRcdCdFcnJvciBzaHV0dGluZyBkb3duIExheWVyIDcgc2VydmljZXMnXG5cdFx0XHQpO1xuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgc2h1dERvd25MYXllcjZTZXJ2aWNlcygpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHR0aGlzLmxvZ2dlci5pbmZvKCdTaHV0dGluZyBkb3duIExheWVyIDYgc2VydmljZXM6IFJvb3QgTWlkZGxld2FyZS4uLicpO1xuXHRcdHRyeSB7XG5cdFx0XHRhd2FpdCB0aGlzLmRhdGFiYXNlQ29udHJvbGxlci5zaHV0ZG93bigpO1xuXHRcdFx0dGhpcy5sb2dnZXIuaW5mbygnTGF5ZXIgNiBzZXJ2aWNlcyBoYXZlIGJlZW4gc2h1dCBkb3duLicpO1xuXHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHR0aGlzLmhhbmRsZUhUVFBTU2VydmVyRXJyb3JSZWNvdmVyYWJsZShcblx0XHRcdFx0ZXJyb3IsXG5cdFx0XHRcdCdTSFVURE9XTl9MQVlFUl82Jyxcblx0XHRcdFx0e30sXG5cdFx0XHRcdCdFcnJvciBzaHV0dGluZyBkb3duIExheWVyIDYgc2VydmljZXMnXG5cdFx0XHQpO1xuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgc2h1dERvd25MYXllcjVTZXJ2aWNlcygpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHR0aGlzLmxvZ2dlci5pbmZvKFxuXHRcdFx0J1NodXR0aW5nIGRvd24gTGF5ZXIgNSBzZXJ2aWNlczogTWlkZGxld2FyZSBTdGF0dXMgU2VydmljZS4uLidcblx0XHQpO1xuXHRcdHRyeSB7XG5cdFx0XHRhd2FpdCB0aGlzLm1pZGRsZXdhcmVTdGF0dXNTZXJ2aWNlLnNodXRkb3duKCk7XG5cdFx0XHR0aGlzLmxvZ2dlci5pbmZvKCdMYXllciA1IHNlcnZpY2VzIGhhdmUgYmVlbiBzaHV0IGRvd24uJyk7XG5cdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdHRoaXMuaGFuZGxlSFRUUFNTZXJ2ZXJFcnJvclJlY292ZXJhYmxlKFxuXHRcdFx0XHRlcnJvcixcblx0XHRcdFx0J1NIVVRET1dOX0xBWUVSXzUnLFxuXHRcdFx0XHR7fSxcblx0XHRcdFx0J0Vycm9yIHNodXR0aW5nIGRvd24gTGF5ZXIgNSBzZXJ2aWNlcydcblx0XHRcdCk7XG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyBzaHV0RG93bkxheWVyNFNlcnZpY2VzKCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdHRoaXMubG9nZ2VyLmluZm8oJ1NodXR0aW5nIGRvd24gTGF5ZXIgNCBzZXJ2aWNlczogVmF1bHQuLi4nKTtcblx0XHR0cnkge1xuXHRcdFx0YXdhaXQgdGhpcy52YXVsdC5zaHV0ZG93bigpO1xuXHRcdFx0dGhpcy5sb2dnZXIuaW5mbygnTGF5ZXIgNCBzZXJ2aWNlcyBoYXZlIGJlZW4gc2h1dCBkb3duLicpO1xuXHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHR0aGlzLmhhbmRsZUhUVFBTU2VydmVyRXJyb3JSZWNvdmVyYWJsZShcblx0XHRcdFx0ZXJyb3IsXG5cdFx0XHRcdCdTSFVURE9XTl9MQVlFUl80Jyxcblx0XHRcdFx0e30sXG5cdFx0XHRcdCdFcnJvciBzaHV0dGluZyBkb3duIExheWVyIDQgc2VydmljZXMnXG5cdFx0XHQpO1xuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgc2h1dERvd25MYXllcjNTZXJ2aWNlcygpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHR0aGlzLmxvZ2dlci5pbmZvKCdTaHV0dGluZyBkb3duIExheWVyIDMgc2VydmljZXM6IEVudkNvbmZpZy4uLicpO1xuXHRcdHRyeSB7XG5cdFx0XHRhd2FpdCB0aGlzLmVudkNvbmZpZy5zaHV0ZG93bigpO1xuXHRcdFx0dGhpcy5sb2dnZXIuaW5mbygnTGF5ZXIgMyBzZXJ2aWNlcyBoYXZlIGJlZW4gc2h1dCBkb3duLicpO1xuXHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHR0aGlzLmhhbmRsZUhUVFBTU2VydmVyRXJyb3JSZWNvdmVyYWJsZShcblx0XHRcdFx0ZXJyb3IsXG5cdFx0XHRcdCdTSFVURE9XTl9MQVlFUl8zJyxcblx0XHRcdFx0e30sXG5cdFx0XHRcdCdFcnJvciBzaHV0dGluZyBkb3duIExheWVyIDMgc2VydmljZXMnXG5cdFx0XHQpO1xuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgc2h1dERvd25MYXllcjJTZXJ2aWNlcygpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHR0aGlzLmxvZ2dlci5pbmZvKCdTaHV0dGluZyBkb3duIExheWVyIDIgc2VydmljZXM6IEVycm9yIEhhbmRsZXIuLi4nKTtcblx0XHR0cnkge1xuXHRcdFx0YXdhaXQgdGhpcy5lcnJvckhhbmRsZXIuc2h1dGRvd24oKTtcblx0XHRcdHRoaXMubG9nZ2VyLmluZm8oJ0xheWVyIDIgc2VydmljZXMgaGF2ZSBiZWVuIHNodXQgZG93bi4nKTtcblx0XHR9IGNhdGNoIChlcnJvcikge1xuXHRcdFx0dGhpcy5oYW5kbGVIVFRQU1NlcnZlckVycm9yUmVjb3ZlcmFibGUoXG5cdFx0XHRcdGVycm9yLFxuXHRcdFx0XHQnU0hVVERPV05fTEFZRVJfMicsXG5cdFx0XHRcdHt9LFxuXHRcdFx0XHQnRXJyb3Igc2h1dHRpbmcgZG93biBMYXllciAyIHNlcnZpY2VzJ1xuXHRcdFx0KTtcblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIHNodXREb3duTGF5ZXIxU2VydmljZXMoKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0dGhpcy5sb2dnZXIuaW5mbyhcblx0XHRcdCdTaHV0dGluZyBkb3duIExheWVyIDEgc2VydmljZXM6IExvZ2dlciBhbmQgRXJyb3IgTG9nZ2VyLi4uJ1xuXHRcdCk7XG5cdFx0dHJ5IHtcblx0XHRcdGF3YWl0IFByb21pc2UuYWxsKFtcblx0XHRcdFx0dGhpcy5lcnJvckxvZ2dlci5zaHV0ZG93bigpLFxuXHRcdFx0XHR0aGlzLmxvZ2dlci5zaHV0ZG93bigpXG5cdFx0XHRdKTtcblx0XHRcdHRoaXMubG9nZ2VyLmluZm8oJ0xheWVyIDEgc2VydmljZXMgaGF2ZSBiZWVuIHNodXQgZG93bi4nKTtcblx0XHR9IGNhdGNoIChlcnJvcikge1xuXHRcdFx0dGhpcy5oYW5kbGVIVFRQU1NlcnZlckVycm9yUmVjb3ZlcmFibGUoXG5cdFx0XHRcdGVycm9yLFxuXHRcdFx0XHQnU0hVVERPV05fTEFZRVJfMScsXG5cdFx0XHRcdHt9LFxuXHRcdFx0XHQnRXJyb3Igc2h1dHRpbmcgZG93biBMYXllciAxIHNlcnZpY2VzJ1xuXHRcdFx0KTtcblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIGhhbmRsZUhUVFBTU2VydmVyRXJyb3JSZWNvdmVyYWJsZShcblx0XHRlcnJvcjogdW5rbm93bixcblx0XHRlcnJvckhlYWRlcjogc3RyaW5nLFxuXHRcdGVycm9yRGV0YWlsczogb2JqZWN0LFxuXHRcdGN1c3RvbU1lc3NhZ2U6IHN0cmluZ1xuXHQpOiB2b2lkIHtcblx0XHRjb25zdCBlcnJvck1lc3NhZ2UgPSBgJHtjdXN0b21NZXNzYWdlfTogJHtlcnJvcn1cXG4ke2Vycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5zdGFjayA6ICcnfWA7XG5cdFx0dGhpcy5lcnJvckxvZ2dlci5sb2dFcnJvcihlcnJvck1lc3NhZ2UpO1xuXHRcdGNvbnN0IHJlZGlzRXJyb3IgPVxuXHRcdFx0bmV3IHRoaXMuZXJyb3JIYW5kbGVyLkVycm9yQ2xhc3Nlcy5IVFRQU0NsaWVudEVycm9yRmF0YWwoXG5cdFx0XHRcdGVycm9ySGVhZGVyLFxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0ZGV0YWlsczogZXJyb3JEZXRhaWxzLFxuXHRcdFx0XHRcdGV4cG9zZVRvQ2xpZW50OiBmYWxzZVxuXHRcdFx0XHR9XG5cdFx0XHQpO1xuXHRcdHRoaXMuZXJyb3JIYW5kbGVyLmhhbmRsZUVycm9yKHtcblx0XHRcdGVycm9yOiByZWRpc0Vycm9yXG5cdFx0fSk7XG5cdFx0cHJvY2Vzcy5leGl0KDEpO1xuXHR9XG5cblx0cHJpdmF0ZSBoYW5kbGVIVFRQU1NlcnZlckVycm9yRmF0YWwoXG5cdFx0ZXJyb3I6IHVua25vd24sXG5cdFx0ZXJyb3JIZWFkZXI6IHN0cmluZyxcblx0XHRlcnJvckRldGFpbHM6IG9iamVjdCxcblx0XHRjdXN0b21NZXNzYWdlOiBzdHJpbmdcblx0KTogdm9pZCB7XG5cdFx0Y29uc3QgZXJyb3JNZXNzYWdlID0gYCR7Y3VzdG9tTWVzc2FnZX06ICR7ZXJyb3J9XFxuJHtlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3Iuc3RhY2sgOiAnJ31gO1xuXHRcdHRoaXMuZXJyb3JMb2dnZXIubG9nRXJyb3IoZXJyb3JNZXNzYWdlKTtcblx0XHRjb25zdCByZWRpc0Vycm9yID1cblx0XHRcdG5ldyB0aGlzLmVycm9ySGFuZGxlci5FcnJvckNsYXNzZXMuSFRUUFNDbGllbnRFcnJvckZhdGFsKFxuXHRcdFx0XHRlcnJvckhlYWRlcixcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGRldGFpbHM6IGVycm9yRGV0YWlscyxcblx0XHRcdFx0XHRleHBvc2VUb0NsaWVudDogZmFsc2Vcblx0XHRcdFx0fVxuXHRcdFx0KTtcblx0XHR0aGlzLmVycm9ySGFuZGxlci5oYW5kbGVFcnJvcih7XG5cdFx0XHRlcnJvcjogcmVkaXNFcnJvclxuXHRcdH0pO1xuXHRcdHByb2Nlc3MuZXhpdCgxKTtcblx0fVxufVxuIl19
