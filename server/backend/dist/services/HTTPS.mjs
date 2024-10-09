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
		this.logger.info('Shutting down Layer 8 services: Cache Service...');
		try {
			await this.cacheService.shutdown();
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSFRUUFMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvc2VydmljZXMvSFRUUFMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxnQkFBZ0IsTUFBTSx3QkFBd0IsQ0FBQztBQUN0RCxPQUFPLEtBQUssTUFBTSxPQUFPLENBQUM7QUFJMUIsT0FBTyxFQUFFLFNBQVMsSUFBSSxlQUFlLEVBQUUsTUFBTSxRQUFRLENBQUM7QUFDdEQsT0FBTyxFQUFFLG9CQUFvQixFQUFFLE1BQU0sa0JBQWtCLENBQUM7QUFrQ3hELE9BQU8sRUFBRSw4QkFBOEIsRUFBRSxNQUFNLDhEQUE4RCxDQUFDO0FBQzlHLE9BQU8sRUFBRSxxQkFBcUIsRUFBRSxNQUFNLHFEQUFxRCxDQUFDO0FBQzVGLE9BQU8sRUFBRSxrQkFBa0IsRUFBRSxNQUFNLGtEQUFrRCxDQUFDO0FBQ3RGLE9BQU8sRUFBRSx3QkFBd0IsRUFBRSxNQUFNLHdEQUF3RCxDQUFDO0FBQ2xHLE9BQU8sRUFBRSx5QkFBeUIsRUFBRSxNQUFNLHlEQUF5RCxDQUFDO0FBQ3BHLE9BQU8sRUFBRSx1QkFBdUIsRUFBRSxNQUFNLHVEQUF1RCxDQUFDO0FBQ2hHLE9BQU8sRUFBRSx3QkFBd0IsRUFBRSxNQUFNLHdEQUF3RCxDQUFDO0FBQ2xHLE9BQU8sRUFBRSxpQkFBaUIsRUFBRSxNQUFNLGlEQUFpRCxDQUFDO0FBQ3BGLE9BQU8sRUFBRSw4QkFBOEIsRUFBRSxNQUFNLDhEQUE4RCxDQUFDO0FBQzlHLE9BQU8sRUFBRSxzQkFBc0IsRUFBRSxNQUFNLHNEQUFzRCxDQUFDO0FBQzlGLE9BQU8sRUFBRSxlQUFlLEVBQUUsTUFBTSwrQ0FBK0MsQ0FBQztBQUNoRixPQUFPLEVBQUUsc0JBQXNCLEVBQUUsTUFBTSxzREFBc0QsQ0FBQztBQUM5RixPQUFPLEVBQUUsYUFBYSxFQUFFLE1BQU0sNkNBQTZDLENBQUM7QUFDNUUsT0FBTyxFQUFFLHFCQUFxQixFQUFFLE1BQU0scURBQXFELENBQUM7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QUFDLFdBQVcsQ0FBQztZQUM3QixLQUFLLEVBQUUsVUFBVTtTQUNqQixDQUFDLENBQUM7UUFDSCxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ2pCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgZ3JhY2VmdWxTaHV0ZG93biBmcm9tICdodHRwLWdyYWNlZnVsLXNodXRkb3duJztcbmltcG9ydCBodHRwcyBmcm9tICdodHRwcyc7XG5pbXBvcnQgbmV0IGZyb20gJ25ldCc7XG5pbXBvcnQgeyBTZXF1ZWxpemUgfSBmcm9tICdzZXF1ZWxpemUnO1xuaW1wb3J0IHsgQXBwbGljYXRpb24gfSBmcm9tICdleHByZXNzJztcbmltcG9ydCB7IGNvbnN0YW50cyBhcyBjcnlwdG9Db25zdGFudHMgfSBmcm9tICdjcnlwdG8nO1xuaW1wb3J0IHsgdmFsaWRhdGVEZXBlbmRlbmNpZXMgfSBmcm9tICcuLi91dGlscy9oZWxwZXJzJztcbmltcG9ydCB7XG5cdEFjY2Vzc0NvbnRyb2xNaWRkbGV3YXJlU2VydmljZUludGVyZmFjZSxcblx0QXBwTG9nZ2VyU2VydmljZUludGVyZmFjZSxcblx0QXV0aENvbnRyb2xsZXJJbnRlcmZhY2UsXG5cdEJhY2t1cENvZGVTZXJ2aWNlSW50ZXJmYWNlLFxuXHRCYXNlUm91dGVySW50ZXJmYWNlLFxuXHRDYWNoZVNlcnZpY2VJbnRlcmZhY2UsXG5cdENTUkZNaWRkbGV3YXJlU2VydmljZUludGVyZmFjZSxcblx0RGF0YWJhc2VDb250cm9sbGVySW50ZXJmYWNlLFxuXHRFbWFpbE1GQVNlcnZpY2VJbnRlcmZhY2UsXG5cdEVycm9ySGFuZGxlclNlcnZpY2VJbnRlcmZhY2UsXG5cdEVycm9yTG9nZ2VyU2VydmljZUludGVyZmFjZSxcblx0RW52Q29uZmlnU2VydmljZUludGVyZmFjZSxcblx0RklETzJTZXJ2aWNlSW50ZXJmYWNlLFxuXHRHYXRla2VlcGVyU2VydmljZUludGVyZmFjZSxcblx0SGVhbHRoQ2hlY2tTZXJ2aWNlSW50ZXJmYWNlLFxuXHRIZWxtZXRNaWRkbGV3YXJlU2VydmljZUludGVyZmFjZSxcblx0SFRUUFNTZXJ2ZXJJbnRlcmZhY2UsXG5cdEpXVEF1dGhNaWRkbGV3YXJlU2VydmljZUludGVyZmFjZSxcblx0SldUU2VydmljZUludGVyZmFjZSxcblx0TWFpbGVyU2VydmljZUludGVyZmFjZSxcblx0TWlkZGxld2FyZVN0YXR1c1NlcnZpY2VJbnRlcmZhY2UsXG5cdE11bHRlclVwbG9hZFNlcnZpY2VJbnRlcmZhY2UsXG5cdFBhc3Nwb3J0QXV0aE1pZGRsZXdhcmVTZXJ2aWNlSW50ZXJmYWNlLFxuXHRQYXNzcG9ydFNlcnZpY2VJbnRlcmZhY2UsXG5cdFBhc3N3b3JkU2VydmljZUludGVyZmFjZSxcblx0UmVzb3VyY2VNYW5hZ2VySW50ZXJmYWNlLFxuXHRSb290TWlkZGxld2FyZVNlcnZpY2VJbnRlcmZhY2UsXG5cdFRPVFBTZXJ2aWNlSW50ZXJmYWNlLFxuXHRVc2VyQ29udHJvbGxlckludGVyZmFjZSxcblx0VmF1bHRTZXJ2aWNlSW50ZXJmYWNlLFxuXHRZdWJpY29PVFBTZXJ2aWNlSW50ZXJmYWNlXG59IGZyb20gJy4uL2luZGV4L2ludGVyZmFjZXMvbWFpbic7XG5pbXBvcnQgeyBBY2Nlc3NDb250cm9sTWlkZGxld2FyZUZhY3RvcnkgfSBmcm9tICcuLi9pbmRleC9mYWN0b3J5L3N1YmZhY3Rvcmllcy9BY2Nlc3NDb250cm9sTWlkZGxld2FyZUZhY3RvcnknO1xuaW1wb3J0IHsgQXV0aENvbnRyb2xsZXJGYWN0b3J5IH0gZnJvbSAnLi4vaW5kZXgvZmFjdG9yeS9zdWJmYWN0b3JpZXMvQXV0aENvbnRyb2xsZXJGYWN0b3J5JztcbmltcG9ydCB7IEF1dGhTZXJ2aWNlRmFjdG9yeSB9IGZyb20gJy4uL2luZGV4L2ZhY3Rvcnkvc3ViZmFjdG9yaWVzL0F1dGhTZXJ2aWNlRmFjdG9yeSc7XG5pbXBvcnQgeyBDYWNoZUxheWVyU2VydmljZUZhY3RvcnkgfSBmcm9tICcuLi9pbmRleC9mYWN0b3J5L3N1YmZhY3Rvcmllcy9DYWNoZUxheWVyU2VydmljZUZhY3RvcnknO1xuaW1wb3J0IHsgRGF0YWJhc2VDb250cm9sbGVyRmFjdG9yeSB9IGZyb20gJy4uL2luZGV4L2ZhY3Rvcnkvc3ViZmFjdG9yaWVzL0RhdGFiYXNlQ29udHJvbGxlckZhY3RvcnknO1xuaW1wb3J0IHsgRW52Q29uZmlnU2VydmljZUZhY3RvcnkgfSBmcm9tICcuLi9pbmRleC9mYWN0b3J5L3N1YmZhY3Rvcmllcy9FbnZDb25maWdTZXJ2aWNlRmFjdG9yeSc7XG5pbXBvcnQgeyBHYXRla2VlcGVyU2VydmljZUZhY3RvcnkgfSBmcm9tICcuLi9pbmRleC9mYWN0b3J5L3N1YmZhY3Rvcmllcy9HYXRla2VlcGVyU2VydmljZUZhY3RvcnknO1xuaW1wb3J0IHsgTWlkZGxld2FyZUZhY3RvcnkgfSBmcm9tICcuLi9pbmRleC9mYWN0b3J5L3N1YmZhY3Rvcmllcy9NaWRkbGV3YXJlRmFjdG9yeSc7XG5pbXBvcnQgeyBNaWRkbGV3YXJlU3RhdHVzU2VydmljZUZhY3RvcnkgfSBmcm9tICcuLi9pbmRleC9mYWN0b3J5L3N1YmZhY3Rvcmllcy9NaWRkbGV3YXJlU3RhdHVzU2VydmljZUZhY3RvcnknO1xuaW1wb3J0IHsgUGFzc3BvcnRTZXJ2aWNlRmFjdG9yeSB9IGZyb20gJy4uL2luZGV4L2ZhY3Rvcnkvc3ViZmFjdG9yaWVzL1Bhc3Nwb3J0U2VydmljZUZhY3RvcnknO1xuaW1wb3J0IHsgUHJlSFRUUFNGYWN0b3J5IH0gZnJvbSAnLi4vaW5kZXgvZmFjdG9yeS9zdWJmYWN0b3JpZXMvUHJlSFRUUFNGYWN0b3J5JztcbmltcG9ydCB7IFJlc291cmNlTWFuYWdlckZhY3RvcnkgfSBmcm9tICcuLi9pbmRleC9mYWN0b3J5L3N1YmZhY3Rvcmllcy9SZXNvdXJjZU1hbmFnZXJGYWN0b3J5JztcbmltcG9ydCB7IFJvdXRlckZhY3RvcnkgfSBmcm9tICcuLi9pbmRleC9mYWN0b3J5L3N1YmZhY3Rvcmllcy9Sb3V0ZXJGYWN0b3J5JztcbmltcG9ydCB7IFVzZXJDb250cm9sbGVyRmFjdG9yeSB9IGZyb20gJy4uL2luZGV4L2ZhY3Rvcnkvc3ViZmFjdG9yaWVzL1VzZXJDb250cm9sbGVyRmFjdG9yeSc7XG5pbXBvcnQgeyBWYXVsdFNlcnZpY2VGYWN0b3J5IH0gZnJvbSAnLi4vaW5kZXgvZmFjdG9yeS9zdWJmYWN0b3JpZXMvVmF1bHRTZXJ2aWNlRmFjdG9yeSc7XG5pbXBvcnQgeyB0bHNDaXBoZXJzIH0gZnJvbSAnLi4vY29uZmlnL3NlY3VyaXR5JztcbmltcG9ydCB7IFNlY3VyZUNvbnRleHRPcHRpb25zIH0gZnJvbSAndGxzJztcbmltcG9ydCB0aW1lb3V0IGZyb20gJ2Nvbm5lY3QtdGltZW91dCc7XG5pbXBvcnQgeyBMb2dnZXJTZXJ2aWNlRmFjdG9yeSB9IGZyb20gJy4uL2luZGV4L2ZhY3Rvcnkvc3ViZmFjdG9yaWVzL0xvZ2dlclNlcnZpY2VGYWN0b3J5JztcbmltcG9ydCB7IEVycm9ySGFuZGxlclNlcnZpY2VGYWN0b3J5IH0gZnJvbSAnLi4vaW5kZXgvZmFjdG9yeS9zdWJmYWN0b3JpZXMvRXJyb3JIYW5kbGVyU2VydmljZUZhY3RvcnknO1xuaW1wb3J0IHsgSGVhbHRoQ2hlY2tTZXJ2aWNlRmFjdG9yeSB9IGZyb20gJy4uL2luZGV4L2ZhY3Rvcnkvc3ViZmFjdG9yaWVzL0hlYWx0aENoZWNrU2VydmljZUZhY3RvcnknO1xuaW1wb3J0IHsgUm9vdE1pZGRsZXdhcmVGYWN0b3J5IH0gZnJvbSAnLi4vaW5kZXgvZmFjdG9yeS9zdWJmYWN0b3JpZXMvUm9vdE1pZGRsZXdhcmVGYWN0b3J5JztcblxuZXhwb3J0IGNsYXNzIEhUVFBTU2VydmVyIGltcGxlbWVudHMgSFRUUFNTZXJ2ZXJJbnRlcmZhY2Uge1xuXHRwdWJsaWMgc3RhdGljIGluc3RhbmNlOiBIVFRQU1NlcnZlciB8IG51bGwgPSBudWxsO1xuXG5cdHByaXZhdGUgYWNjZXNzQ29udHJvbE1pZGRsZXdhcmU6IEFjY2Vzc0NvbnRyb2xNaWRkbGV3YXJlU2VydmljZUludGVyZmFjZTtcblx0cHJpdmF0ZSBhdXRoQ29udHJvbGxlcjogQXV0aENvbnRyb2xsZXJJbnRlcmZhY2U7XG5cdHByaXZhdGUgYmFja3VwQ29kZVNlcnZpY2U6IEJhY2t1cENvZGVTZXJ2aWNlSW50ZXJmYWNlO1xuXHRwcml2YXRlIGJhc2VSb3V0ZXI6IEJhc2VSb3V0ZXJJbnRlcmZhY2U7XG5cdHByaXZhdGUgY2FjaGVTZXJ2aWNlOiBDYWNoZVNlcnZpY2VJbnRlcmZhY2U7XG5cdHByaXZhdGUgY3NyZk1pZGRsZXdhcmU6IENTUkZNaWRkbGV3YXJlU2VydmljZUludGVyZmFjZTtcblx0cHJpdmF0ZSBkYXRhYmFzZUNvbnRyb2xsZXI6IERhdGFiYXNlQ29udHJvbGxlckludGVyZmFjZTtcblx0cHJpdmF0ZSBlbWFpbE1GQVNlcnZpY2U6IEVtYWlsTUZBU2VydmljZUludGVyZmFjZTtcblx0cHJpdmF0ZSBlcnJvckxvZ2dlcjogRXJyb3JMb2dnZXJTZXJ2aWNlSW50ZXJmYWNlO1xuXHRwcml2YXRlIGVycm9ySGFuZGxlcjogRXJyb3JIYW5kbGVyU2VydmljZUludGVyZmFjZTtcblx0cHJpdmF0ZSBlbnZDb25maWc6IEVudkNvbmZpZ1NlcnZpY2VJbnRlcmZhY2U7XG5cdHByaXZhdGUgZmlkbzJTZXJ2aWNlOiBGSURPMlNlcnZpY2VJbnRlcmZhY2U7XG5cdHByaXZhdGUgZ2F0ZWtlZXBlclNlcnZpY2U6IEdhdGVrZWVwZXJTZXJ2aWNlSW50ZXJmYWNlO1xuXHRwcml2YXRlIGhlYWx0aENoZWNrU2VydmljZTogSGVhbHRoQ2hlY2tTZXJ2aWNlSW50ZXJmYWNlO1xuXHRwcml2YXRlIGhlbG1ldE1pZGRsZXdhcmU6IEhlbG1ldE1pZGRsZXdhcmVTZXJ2aWNlSW50ZXJmYWNlO1xuXHRwcml2YXRlIGp3dEF1dGhNaWRkbGV3YXJlU2VydmljZTogSldUQXV0aE1pZGRsZXdhcmVTZXJ2aWNlSW50ZXJmYWNlO1xuXHRwcml2YXRlIGp3dFNlcnZpY2U6IEpXVFNlcnZpY2VJbnRlcmZhY2U7XG5cdHByaXZhdGUgbG9nZ2VyOiBBcHBMb2dnZXJTZXJ2aWNlSW50ZXJmYWNlO1xuXHRwcml2YXRlIG1haWxlclNlcnZpY2U6IE1haWxlclNlcnZpY2VJbnRlcmZhY2U7XG5cdHByaXZhdGUgbWlkZGxld2FyZVN0YXR1c1NlcnZpY2U6IE1pZGRsZXdhcmVTdGF0dXNTZXJ2aWNlSW50ZXJmYWNlO1xuXHRwcml2YXRlIG11bHRlclVwbG9hZFNlcnZpY2U6IE11bHRlclVwbG9hZFNlcnZpY2VJbnRlcmZhY2U7XG5cdHByaXZhdGUgcGFzc3BvcnRBdXRoTWlkZGxld2FyZVNlcnZpY2U6IFBhc3Nwb3J0QXV0aE1pZGRsZXdhcmVTZXJ2aWNlSW50ZXJmYWNlO1xuXHRwcml2YXRlIHBhc3Nwb3J0U2VydmljZTogUGFzc3BvcnRTZXJ2aWNlSW50ZXJmYWNlO1xuXHRwcml2YXRlIHBhc3N3b3JkU2VydmljZTogUGFzc3dvcmRTZXJ2aWNlSW50ZXJmYWNlO1xuXHRwcml2YXRlIHJlc291cmNlTWFuYWdlcjogUmVzb3VyY2VNYW5hZ2VySW50ZXJmYWNlO1xuXHRwcml2YXRlIHJvb3RNaWRkbGV3YXJlU2VydmljZTogUm9vdE1pZGRsZXdhcmVTZXJ2aWNlSW50ZXJmYWNlO1xuXHRwcml2YXRlIHRvdHBTZXJ2aWNlOiBUT1RQU2VydmljZUludGVyZmFjZTtcblx0cHJpdmF0ZSB1c2VyQ29udHJvbGxlcjogVXNlckNvbnRyb2xsZXJJbnRlcmZhY2U7XG5cdHByaXZhdGUgdmF1bHQ6IFZhdWx0U2VydmljZUludGVyZmFjZTtcblx0cHJpdmF0ZSB5dWJpY29PVFBTZXJ2aWNlOiBZdWJpY29PVFBTZXJ2aWNlSW50ZXJmYWNlO1xuXG5cdHByaXZhdGUgc2VydmVyOiBodHRwcy5TZXJ2ZXIgfCBudWxsID0gbnVsbDtcblx0cHJpdmF0ZSBhcHA6IEFwcGxpY2F0aW9uO1xuXHRwcml2YXRlIHNlcXVlbGl6ZTogU2VxdWVsaXplO1xuXHRwcml2YXRlIHNodXR0aW5nRG93biA9IGZhbHNlO1xuXHRwcml2YXRlIGNvbm5lY3Rpb25zOiBTZXQ8bmV0LlNvY2tldD4gPSBuZXcgU2V0KCk7XG5cdHByaXZhdGUgb3B0aW9uczogU2VjdXJlQ29udGV4dE9wdGlvbnMgfCB1bmRlZmluZWQ7XG5cdHByaXZhdGUgcG9ydDogbnVtYmVyO1xuXHRwcml2YXRlIHJlcXVlc3RUaW1lb3V0OiBzdHJpbmc7XG5cdHByaXZhdGUgc2h1dGRvd25UaW1lb3V0OiBudW1iZXI7XG5cblx0cHJpdmF0ZSBjb25zdHJ1Y3Rvcihcblx0XHRhcHA6IEFwcGxpY2F0aW9uLFxuXHRcdHNlcXVlbGl6ZTogU2VxdWVsaXplLFxuXHRcdGxvZ2dlcjogQXBwTG9nZ2VyU2VydmljZUludGVyZmFjZSxcblx0XHRlcnJvckxvZ2dlcjogRXJyb3JMb2dnZXJTZXJ2aWNlSW50ZXJmYWNlLFxuXHRcdGVycm9ySGFuZGxlcjogRXJyb3JIYW5kbGVyU2VydmljZUludGVyZmFjZSxcblx0XHRlbnZDb25maWc6IEVudkNvbmZpZ1NlcnZpY2VJbnRlcmZhY2UsXG5cdFx0Y2FjaGVTZXJ2aWNlOiBDYWNoZVNlcnZpY2VJbnRlcmZhY2UsXG5cdFx0cmVzb3VyY2VNYW5hZ2VyOiBSZXNvdXJjZU1hbmFnZXJJbnRlcmZhY2UsXG5cdFx0aGVhbHRoQ2hlY2tTZXJ2aWNlOiBIZWFsdGhDaGVja1NlcnZpY2VJbnRlcmZhY2UsXG5cdFx0aGVsbWV0TWlkZGxld2FyZTogSGVsbWV0TWlkZGxld2FyZVNlcnZpY2VJbnRlcmZhY2UsXG5cdFx0and0QXV0aE1pZGRsZXdhcmVTZXJ2aWNlOiBKV1RBdXRoTWlkZGxld2FyZVNlcnZpY2VJbnRlcmZhY2UsXG5cdFx0cGFzc3BvcnRBdXRoTWlkZGxld2FyZVNlcnZpY2U6IFBhc3Nwb3J0QXV0aE1pZGRsZXdhcmVTZXJ2aWNlSW50ZXJmYWNlLFxuXHRcdGFjY2Vzc0NvbnRyb2xNaWRkbGV3YXJlOiBBY2Nlc3NDb250cm9sTWlkZGxld2FyZVNlcnZpY2VJbnRlcmZhY2UsXG5cdFx0YXV0aENvbnJvbGxlcjogQXV0aENvbnRyb2xsZXJJbnRlcmZhY2UsXG5cdFx0YmFja3VwQ29kZVNlcnZpY2U6IEJhY2t1cENvZGVTZXJ2aWNlSW50ZXJmYWNlLFxuXHRcdGJhc2VSb3V0ZXI6IEJhc2VSb3V0ZXJJbnRlcmZhY2UsXG5cdFx0Y3NyZk1pZGRsZXdhcmU6IENTUkZNaWRkbGV3YXJlU2VydmljZUludGVyZmFjZSxcblx0XHRkYXRhYmFzZUNvbnRyb2xsZXI6IERhdGFiYXNlQ29udHJvbGxlckludGVyZmFjZSxcblx0XHRlbWFpbE1GQVNlcnZpY2U6IEVtYWlsTUZBU2VydmljZUludGVyZmFjZSxcblx0XHRmaWRvMlNlcnZpY2U6IEZJRE8yU2VydmljZUludGVyZmFjZSxcblx0XHRnYXRla2VlcGVyU2VydmljZTogR2F0ZWtlZXBlclNlcnZpY2VJbnRlcmZhY2UsXG5cdFx0and0U2VydmljZTogSldUU2VydmljZUludGVyZmFjZSxcblx0XHRtYWlsZXJTZXJ2aWNlOiBNYWlsZXJTZXJ2aWNlSW50ZXJmYWNlLFxuXHRcdG1pZGRsZXdhcmVTdGF0dXNTZXJ2aWNlOiBNaWRkbGV3YXJlU3RhdHVzU2VydmljZUludGVyZmFjZSxcblx0XHRtdWx0ZXJVcGxvYWRTZXJ2aWNlOiBNdWx0ZXJVcGxvYWRTZXJ2aWNlSW50ZXJmYWNlLFxuXHRcdHBhc3Nwb3J0U2VydmljZTogUGFzc3BvcnRTZXJ2aWNlSW50ZXJmYWNlLFxuXHRcdHBhc3N3b3JkU2VydmljZTogUGFzc3dvcmRTZXJ2aWNlSW50ZXJmYWNlLFxuXHRcdHJvb3RNaWRkbGV3YXJlU2VydmljZTogUm9vdE1pZGRsZXdhcmVTZXJ2aWNlSW50ZXJmYWNlLFxuXHRcdHRvdHBTZXJ2aWNlOiBUT1RQU2VydmljZUludGVyZmFjZSxcblx0XHR1c2VyQ29udHJvbGxlcjogVXNlckNvbnRyb2xsZXJJbnRlcmZhY2UsXG5cdFx0dmF1bHQ6IFZhdWx0U2VydmljZUludGVyZmFjZSxcblx0XHR5dWJpY29PVFBTZXJ2aWNlOiBZdWJpY29PVFBTZXJ2aWNlSW50ZXJmYWNlXG5cdCkge1xuXHRcdHRoaXMuYXBwID0gYXBwO1xuXHRcdHRoaXMuc2VxdWVsaXplID0gc2VxdWVsaXplO1xuXHRcdHRoaXMubG9nZ2VyID0gbG9nZ2VyO1xuXHRcdHRoaXMuZXJyb3JMb2dnZXIgPSBlcnJvckxvZ2dlcjtcblx0XHR0aGlzLmVycm9ySGFuZGxlciA9IGVycm9ySGFuZGxlcjtcblx0XHR0aGlzLmVudkNvbmZpZyA9IGVudkNvbmZpZztcblx0XHR0aGlzLmNhY2hlU2VydmljZSA9IGNhY2hlU2VydmljZTtcblx0XHR0aGlzLnJlc291cmNlTWFuYWdlciA9IHJlc291cmNlTWFuYWdlcjtcblx0XHR0aGlzLmhlYWx0aENoZWNrU2VydmljZSA9IGhlYWx0aENoZWNrU2VydmljZTtcblx0XHR0aGlzLmhlbG1ldE1pZGRsZXdhcmUgPSBoZWxtZXRNaWRkbGV3YXJlO1xuXHRcdHRoaXMuand0QXV0aE1pZGRsZXdhcmVTZXJ2aWNlID0gand0QXV0aE1pZGRsZXdhcmVTZXJ2aWNlO1xuXHRcdHRoaXMucGFzc3BvcnRBdXRoTWlkZGxld2FyZVNlcnZpY2UgPSBwYXNzcG9ydEF1dGhNaWRkbGV3YXJlU2VydmljZTtcblx0XHR0aGlzLmFjY2Vzc0NvbnRyb2xNaWRkbGV3YXJlID0gYWNjZXNzQ29udHJvbE1pZGRsZXdhcmU7XG5cdFx0dGhpcy5hdXRoQ29udHJvbGxlciA9IGF1dGhDb25yb2xsZXI7XG5cdFx0dGhpcy5iYWNrdXBDb2RlU2VydmljZSA9IGJhY2t1cENvZGVTZXJ2aWNlO1xuXHRcdHRoaXMuYmFzZVJvdXRlciA9IGJhc2VSb3V0ZXI7XG5cdFx0dGhpcy5jc3JmTWlkZGxld2FyZSA9IGNzcmZNaWRkbGV3YXJlO1xuXHRcdHRoaXMuZGF0YWJhc2VDb250cm9sbGVyID0gZGF0YWJhc2VDb250cm9sbGVyO1xuXHRcdHRoaXMuZW1haWxNRkFTZXJ2aWNlID0gZW1haWxNRkFTZXJ2aWNlO1xuXHRcdHRoaXMuZmlkbzJTZXJ2aWNlID0gZmlkbzJTZXJ2aWNlO1xuXHRcdHRoaXMuZ2F0ZWtlZXBlclNlcnZpY2UgPSBnYXRla2VlcGVyU2VydmljZTtcblx0XHR0aGlzLmp3dFNlcnZpY2UgPSBqd3RTZXJ2aWNlO1xuXHRcdHRoaXMubWFpbGVyU2VydmljZSA9IG1haWxlclNlcnZpY2U7XG5cdFx0dGhpcy5taWRkbGV3YXJlU3RhdHVzU2VydmljZSA9IG1pZGRsZXdhcmVTdGF0dXNTZXJ2aWNlO1xuXHRcdHRoaXMubXVsdGVyVXBsb2FkU2VydmljZSA9IG11bHRlclVwbG9hZFNlcnZpY2U7XG5cdFx0dGhpcy5wYXNzcG9ydFNlcnZpY2UgPSBwYXNzcG9ydFNlcnZpY2U7XG5cdFx0dGhpcy5wYXNzd29yZFNlcnZpY2UgPSBwYXNzd29yZFNlcnZpY2U7XG5cdFx0dGhpcy5yb290TWlkZGxld2FyZVNlcnZpY2UgPSByb290TWlkZGxld2FyZVNlcnZpY2U7XG5cdFx0dGhpcy50b3RwU2VydmljZSA9IHRvdHBTZXJ2aWNlO1xuXHRcdHRoaXMudXNlckNvbnRyb2xsZXIgPSB1c2VyQ29udHJvbGxlcjtcblx0XHR0aGlzLnZhdWx0ID0gdmF1bHQ7XG5cdFx0dGhpcy55dWJpY29PVFBTZXJ2aWNlID0geXViaWNvT1RQU2VydmljZTtcblxuXHRcdHRoaXMucG9ydCA9IHRoaXMuZW52Q29uZmlnLmdldEVudlZhcmlhYmxlKCdzZXJ2ZXJQb3J0Jyk7XG5cdFx0dGhpcy5yZXF1ZXN0VGltZW91dCA9XG5cdFx0XHR0aGlzLmVudkNvbmZpZy5nZXRFbnZWYXJpYWJsZSgncmVxdWVzdFRpbWVvdXQnKSB8fCAnMzBzJztcblx0XHR0aGlzLnNodXRkb3duVGltZW91dCA9XG5cdFx0XHR0aGlzLmVudkNvbmZpZy5nZXRFbnZWYXJpYWJsZSgnZ3JhY2VmdWxTaHV0ZG93blRpbWVvdXQnKSB8fCAzMDAwMDtcblxuXHRcdHRoaXMuaW5pdGlhbGl6ZVNlcnZpY2VzKCk7XG5cblx0XHRzZXRJbnRlcnZhbCgoKSA9PiB7XG5cdFx0XHR0aGlzLmhlYWx0aENoZWNrU2VydmljZS5wZXJmb3JtSGVhbHRoQ2hlY2soKTtcblx0XHR9LCAxMDAwMCk7XG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIGluaXRpYWxpemVTZXJ2aWNlcygpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHR0aGlzLmFjY2Vzc0NvbnRyb2xNaWRkbGV3YXJlID1cblx0XHRcdGF3YWl0IEFjY2Vzc0NvbnRyb2xNaWRkbGV3YXJlRmFjdG9yeS5nZXRBY2Nlc3NDb250cm9sTWlkZGxld2FyZVNlcnZpY2UoKTtcblx0XHR0aGlzLmF1dGhDb250cm9sbGVyID0gYXdhaXQgQXV0aENvbnRyb2xsZXJGYWN0b3J5LmdldEF1dGhDb250cm9sbGVyKCk7XG5cdFx0dGhpcy5iYWNrdXBDb2RlU2VydmljZSA9XG5cdFx0XHRhd2FpdCBBdXRoU2VydmljZUZhY3RvcnkuZ2V0QmFja3VwQ29kZVNlcnZpY2UoKTtcblx0XHR0aGlzLmJhc2VSb3V0ZXIgPSBhd2FpdCBSb3V0ZXJGYWN0b3J5LmdldEJhc2VSb3V0ZXIoKTtcblx0XHR0aGlzLmNzcmZNaWRkbGV3YXJlID0gYXdhaXQgTWlkZGxld2FyZUZhY3RvcnkuZ2V0Q1NSRk1pZGRsZXdhcmUoKTtcblx0XHR0aGlzLmRhdGFiYXNlQ29udHJvbGxlciA9XG5cdFx0XHRhd2FpdCBEYXRhYmFzZUNvbnRyb2xsZXJGYWN0b3J5LmdldERhdGFiYXNlQ29udHJvbGxlcigpO1xuXHRcdHRoaXMuZW1haWxNRkFTZXJ2aWNlID0gYXdhaXQgQXV0aFNlcnZpY2VGYWN0b3J5LmdldEVtYWlsTUZBU2VydmljZSgpO1xuXHRcdHRoaXMuZmlkbzJTZXJ2aWNlID0gYXdhaXQgQXV0aFNlcnZpY2VGYWN0b3J5LmdldEZJRE8yU2VydmljZSgpO1xuXHRcdHRoaXMuZ2F0ZWtlZXBlclNlcnZpY2UgPVxuXHRcdFx0YXdhaXQgR2F0ZWtlZXBlclNlcnZpY2VGYWN0b3J5LmdldEdhdGVrZWVwZXJTZXJ2aWNlKCk7XG5cdFx0dGhpcy5taWRkbGV3YXJlU3RhdHVzU2VydmljZSA9XG5cdFx0XHRhd2FpdCBNaWRkbGV3YXJlU3RhdHVzU2VydmljZUZhY3RvcnkuZ2V0TWlkZGxld2FyZVN0YXR1c1NlcnZpY2UoKTtcblx0XHR0aGlzLm11bHRlclVwbG9hZFNlcnZpY2UgPVxuXHRcdFx0YXdhaXQgUHJlSFRUUFNGYWN0b3J5LmdldE11bHRlclVwbG9hZFNlcnZpY2UoKTtcblx0XHR0aGlzLnBhc3Nwb3J0U2VydmljZSA9XG5cdFx0XHRhd2FpdCBQYXNzcG9ydFNlcnZpY2VGYWN0b3J5LmdldFBhc3Nwb3J0U2VydmljZSgpO1xuXHRcdHRoaXMucGFzc3dvcmRTZXJ2aWNlID0gYXdhaXQgQXV0aFNlcnZpY2VGYWN0b3J5LmdldFBhc3N3b3JkU2VydmljZSgpO1xuXHRcdHRoaXMudmF1bHQgPSBhd2FpdCBWYXVsdFNlcnZpY2VGYWN0b3J5LmdldFZhdWx0U2VydmljZSgpO1xuXHRcdHRoaXMueXViaWNvT1RQU2VydmljZSA9IGF3YWl0IEF1dGhTZXJ2aWNlRmFjdG9yeS5nZXRZdWJpY29PVFBTZXJ2aWNlKCk7XG5cdH1cblxuXHRwdWJsaWMgc3RhdGljIGFzeW5jIGdldEluc3RhbmNlKFxuXHRcdGFwcDogQXBwbGljYXRpb24sXG5cdFx0c2VxdWVsaXplOiBTZXF1ZWxpemVcblx0KTogUHJvbWlzZTxIVFRQU1NlcnZlcj4ge1xuXHRcdGlmICghSFRUUFNTZXJ2ZXIuaW5zdGFuY2UpIHtcblx0XHRcdGNvbnN0IGxvZ2dlciA9IGF3YWl0IExvZ2dlclNlcnZpY2VGYWN0b3J5LmdldExvZ2dlclNlcnZpY2UoKTtcblx0XHRcdGNvbnN0IGVycm9yTG9nZ2VyID1cblx0XHRcdFx0YXdhaXQgTG9nZ2VyU2VydmljZUZhY3RvcnkuZ2V0RXJyb3JMb2dnZXJTZXJ2aWNlKCk7XG5cdFx0XHRjb25zdCBlcnJvckhhbmRsZXIgPVxuXHRcdFx0XHRhd2FpdCBFcnJvckhhbmRsZXJTZXJ2aWNlRmFjdG9yeS5nZXRFcnJvckhhbmRsZXJTZXJ2aWNlKCk7XG5cdFx0XHRjb25zdCBlbnZDb25maWcgPVxuXHRcdFx0XHRhd2FpdCBFbnZDb25maWdTZXJ2aWNlRmFjdG9yeS5nZXRFbnZDb25maWdTZXJ2aWNlKCk7XG5cdFx0XHRjb25zdCBjYWNoZVNlcnZpY2UgPVxuXHRcdFx0XHRhd2FpdCBDYWNoZUxheWVyU2VydmljZUZhY3RvcnkuZ2V0Q2FjaGVTZXJ2aWNlKCk7XG5cdFx0XHRjb25zdCByZXNvdXJjZU1hbmFnZXIgPVxuXHRcdFx0XHRhd2FpdCBSZXNvdXJjZU1hbmFnZXJGYWN0b3J5LmdldFJlc291cmNlTWFuYWdlcigpO1xuXHRcdFx0Y29uc3QgaGVhbHRoQ2hlY2tTZXJ2aWNlID1cblx0XHRcdFx0YXdhaXQgSGVhbHRoQ2hlY2tTZXJ2aWNlRmFjdG9yeS5nZXRIZWFsdGhDaGVja1NlcnZpY2UoKTtcblx0XHRcdGNvbnN0IGhlbG1ldE1pZGRsZXdhcmUgPVxuXHRcdFx0XHRhd2FpdCBNaWRkbGV3YXJlRmFjdG9yeS5nZXRIZWxtZXRNaWRkbGV3YXJlKCk7XG5cdFx0XHRjb25zdCBqd3RBdXRoTWlkZGxld2FyZVNlcnZpY2UgPVxuXHRcdFx0XHRhd2FpdCBNaWRkbGV3YXJlRmFjdG9yeS5nZXRKV1RBdXRoTWlkZGxld2FyZSgpO1xuXHRcdFx0Y29uc3QgcGFzc3BvcnRBdXRoTWlkZGxld2FyZVNlcnZpY2UgPVxuXHRcdFx0XHRhd2FpdCBNaWRkbGV3YXJlRmFjdG9yeS5nZXRQYXNzcG9ydEF1dGhNaWRkbGV3YXJlKCk7XG5cdFx0XHRjb25zdCBhY2Nlc3NDb250cm9sTWlkZGxld2FyZSA9XG5cdFx0XHRcdGF3YWl0IEFjY2Vzc0NvbnRyb2xNaWRkbGV3YXJlRmFjdG9yeS5nZXRBY2Nlc3NDb250cm9sTWlkZGxld2FyZVNlcnZpY2UoKTtcblx0XHRcdGNvbnN0IGF1dGhDb25yb2xsZXIgPVxuXHRcdFx0XHRhd2FpdCBBdXRoQ29udHJvbGxlckZhY3RvcnkuZ2V0QXV0aENvbnRyb2xsZXIoKTtcblx0XHRcdGNvbnN0IGJhY2t1cENvZGVTZXJ2aWNlID1cblx0XHRcdFx0YXdhaXQgQXV0aFNlcnZpY2VGYWN0b3J5LmdldEJhY2t1cENvZGVTZXJ2aWNlKCk7XG5cdFx0XHRjb25zdCBiYXNlUm91dGVyID0gYXdhaXQgUm91dGVyRmFjdG9yeS5nZXRCYXNlUm91dGVyKCk7XG5cdFx0XHRjb25zdCBjc3JmTWlkZGxld2FyZSA9IGF3YWl0IE1pZGRsZXdhcmVGYWN0b3J5LmdldENTUkZNaWRkbGV3YXJlKCk7XG5cdFx0XHRjb25zdCBkYXRhYmFzZUNvbnRyb2xsZXIgPVxuXHRcdFx0XHRhd2FpdCBEYXRhYmFzZUNvbnRyb2xsZXJGYWN0b3J5LmdldERhdGFiYXNlQ29udHJvbGxlcigpO1xuXHRcdFx0Y29uc3QgZW1haWxNRkFTZXJ2aWNlID1cblx0XHRcdFx0YXdhaXQgQXV0aFNlcnZpY2VGYWN0b3J5LmdldEVtYWlsTUZBU2VydmljZSgpO1xuXHRcdFx0Y29uc3QgZmlkbzJTZXJ2aWNlID0gYXdhaXQgQXV0aFNlcnZpY2VGYWN0b3J5LmdldEZJRE8yU2VydmljZSgpO1xuXHRcdFx0Y29uc3QgZ2F0ZWtlZXBlclNlcnZpY2UgPVxuXHRcdFx0XHRhd2FpdCBHYXRla2VlcGVyU2VydmljZUZhY3RvcnkuZ2V0R2F0ZWtlZXBlclNlcnZpY2UoKTtcblx0XHRcdGNvbnN0IGp3dFNlcnZpY2UgPSBhd2FpdCBBdXRoU2VydmljZUZhY3RvcnkuZ2V0SldUU2VydmljZSgpO1xuXHRcdFx0Y29uc3QgbWFpbGVyU2VydmljZSA9IGF3YWl0IFByZUhUVFBTRmFjdG9yeS5nZXRNYWlsZXJTZXJ2aWNlKCk7XG5cdFx0XHRjb25zdCBtaWRkbGV3YXJlU3RhdHVzU2VydmljZSA9XG5cdFx0XHRcdGF3YWl0IE1pZGRsZXdhcmVTdGF0dXNTZXJ2aWNlRmFjdG9yeS5nZXRNaWRkbGV3YXJlU3RhdHVzU2VydmljZSgpO1xuXHRcdFx0Y29uc3QgbXVsdGVyVXBsb2FkU2VydmljZSA9XG5cdFx0XHRcdGF3YWl0IFByZUhUVFBTRmFjdG9yeS5nZXRNdWx0ZXJVcGxvYWRTZXJ2aWNlKCk7XG5cdFx0XHRjb25zdCBwYXNzcG9ydFNlcnZpY2UgPVxuXHRcdFx0XHRhd2FpdCBQYXNzcG9ydFNlcnZpY2VGYWN0b3J5LmdldFBhc3Nwb3J0U2VydmljZSgpO1xuXHRcdFx0Y29uc3QgcGFzc3dvcmRTZXJ2aWNlID1cblx0XHRcdFx0YXdhaXQgQXV0aFNlcnZpY2VGYWN0b3J5LmdldFBhc3N3b3JkU2VydmljZSgpO1xuXHRcdFx0Y29uc3Qgcm9vdE1pZGRsZXdhcmVTZXJ2aWNlID1cblx0XHRcdFx0YXdhaXQgUm9vdE1pZGRsZXdhcmVGYWN0b3J5LmdldFJvb3RNaWRkbGV3YXJlKCk7XG5cdFx0XHRjb25zdCB0b3RwU2VydmljZSA9IGF3YWl0IEF1dGhTZXJ2aWNlRmFjdG9yeS5nZXRUT1RQU2VydmljZSgpO1xuXHRcdFx0Y29uc3QgdXNlckNvbnRyb2xsZXIgPVxuXHRcdFx0XHRhd2FpdCBVc2VyQ29udHJvbGxlckZhY3RvcnkuZ2V0VXNlckNvbnRyb2xsZXIoKTtcblx0XHRcdGNvbnN0IHZhdWx0ID0gYXdhaXQgVmF1bHRTZXJ2aWNlRmFjdG9yeS5nZXRWYXVsdFNlcnZpY2UoKTtcblx0XHRcdGNvbnN0IHl1Ymljb09UUFNlcnZpY2UgPVxuXHRcdFx0XHRhd2FpdCBBdXRoU2VydmljZUZhY3RvcnkuZ2V0WXViaWNvT1RQU2VydmljZSgpO1xuXG5cdFx0XHRIVFRQU1NlcnZlci5pbnN0YW5jZSA9IG5ldyBIVFRQU1NlcnZlcihcblx0XHRcdFx0YXBwLFxuXHRcdFx0XHRzZXF1ZWxpemUsXG5cdFx0XHRcdGxvZ2dlcixcblx0XHRcdFx0ZXJyb3JMb2dnZXIsXG5cdFx0XHRcdGVycm9ySGFuZGxlcixcblx0XHRcdFx0ZW52Q29uZmlnLFxuXHRcdFx0XHRjYWNoZVNlcnZpY2UsXG5cdFx0XHRcdHJlc291cmNlTWFuYWdlcixcblx0XHRcdFx0aGVhbHRoQ2hlY2tTZXJ2aWNlLFxuXHRcdFx0XHRoZWxtZXRNaWRkbGV3YXJlLFxuXHRcdFx0XHRqd3RBdXRoTWlkZGxld2FyZVNlcnZpY2UsXG5cdFx0XHRcdHBhc3Nwb3J0QXV0aE1pZGRsZXdhcmVTZXJ2aWNlLFxuXHRcdFx0XHRhY2Nlc3NDb250cm9sTWlkZGxld2FyZSxcblx0XHRcdFx0YXV0aENvbnJvbGxlcixcblx0XHRcdFx0YmFja3VwQ29kZVNlcnZpY2UsXG5cdFx0XHRcdGJhc2VSb3V0ZXIsXG5cdFx0XHRcdGNzcmZNaWRkbGV3YXJlLFxuXHRcdFx0XHRkYXRhYmFzZUNvbnRyb2xsZXIsXG5cdFx0XHRcdGVtYWlsTUZBU2VydmljZSxcblx0XHRcdFx0ZmlkbzJTZXJ2aWNlLFxuXHRcdFx0XHRnYXRla2VlcGVyU2VydmljZSxcblx0XHRcdFx0and0U2VydmljZSxcblx0XHRcdFx0bWFpbGVyU2VydmljZSxcblx0XHRcdFx0bWlkZGxld2FyZVN0YXR1c1NlcnZpY2UsXG5cdFx0XHRcdG11bHRlclVwbG9hZFNlcnZpY2UsXG5cdFx0XHRcdHBhc3Nwb3J0U2VydmljZSxcblx0XHRcdFx0cGFzc3dvcmRTZXJ2aWNlLFxuXHRcdFx0XHRyb290TWlkZGxld2FyZVNlcnZpY2UsXG5cdFx0XHRcdHRvdHBTZXJ2aWNlLFxuXHRcdFx0XHR1c2VyQ29udHJvbGxlcixcblx0XHRcdFx0dmF1bHQsXG5cdFx0XHRcdHl1Ymljb09UUFNlcnZpY2Vcblx0XHRcdCk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIEhUVFBTU2VydmVyLmluc3RhbmNlO1xuXHR9XG5cblx0cHVibGljIGFzeW5jIGluaXRpYWxpemUoKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0dHJ5IHtcblx0XHRcdHRoaXMubG9nZ2VyLmRlYnVnKCdJbml0aWFsaXppbmcgdGhlIHdlYiBzZXJ2ZXIuLi4nKTtcblx0XHRcdHZhbGlkYXRlRGVwZW5kZW5jaWVzKFxuXHRcdFx0XHRbeyBuYW1lOiAnc2VxdWVsaXplJywgaW5zdGFuY2U6IHRoaXMuc2VxdWVsaXplIH1dLFxuXHRcdFx0XHR0aGlzLmxvZ2dlclxuXHRcdFx0KTtcblxuXHRcdFx0dGhpcy5vcHRpb25zID0gYXdhaXQgdGhpcy5kZWNsYXJlSFRUUFNTZXJ2ZXJPcHRpb25zKCk7XG5cblx0XHRcdGF3YWl0IHRoaXMubW91bnRSb3V0ZXJzKCk7XG5cblx0XHRcdHRoaXMuZXJyb3JIYW5kbGVyLnNldFNodXRkb3duSGFuZGxlcigoKSA9PiB0aGlzLnNodXRkb3duU2VydmVyKCkpO1xuXG5cdFx0XHRhd2FpdCB0aGlzLnN0YXJ0U2VydmVyKCk7XG5cdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdHRoaXMuaGFuZGxlSFRUUFNTZXJ2ZXJFcnJvckZhdGFsKFxuXHRcdFx0XHRlcnJvcixcblx0XHRcdFx0J0lOSVRJQUxJWkVfU0VSVkVSJyxcblx0XHRcdFx0e30sXG5cdFx0XHRcdCdFcnJvciBpbml0aWFsaXppbmcgdGhlIHdlYiBzZXJ2ZXInXG5cdFx0XHQpO1xuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgbW91bnRSb3V0ZXJzKCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdGNvbnN0IGJhc2VSb3V0ZXIgPSBhd2FpdCB0aGlzLmJhc2VSb3V0ZXI7XG5cblx0XHR0aGlzLmFwcC51c2UoJy8nLCBiYXNlUm91dGVyLmdldFJvdXRlcigpKTtcblxuXHRcdHRoaXMubG9nZ2VyLmluZm8oJ1JvdXRlcnMgaGF2ZSBiZWVuIG1vdW50ZWQuJyk7XG5cblx0XHR0aGlzLmFwcC51c2UodGltZW91dCh0aGlzLnJlcXVlc3RUaW1lb3V0KSk7XG5cblx0XHR0aGlzLmFwcC51c2UoKHJlcSwgcmVzLCBuZXh0KSA9PiB7XG5cdFx0XHRpZiAocmVxLnRpbWVkb3V0KSB7XG5cdFx0XHRcdHRoaXMubG9nZ2VyLndhcm4oXG5cdFx0XHRcdFx0YFJlcXVlc3QgdGltZWQgb3V0IGZvciBVUkw6ICR7cmVxLm9yaWdpbmFsVXJsfWBcblx0XHRcdFx0KTtcblx0XHRcdFx0cmVzLnN0YXR1cyg1MDMpLmpzb24oeyBtZXNzYWdlOiAnUmVxdWVzdCB0aW1lZCBvdXQnIH0pO1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cdFx0XHRuZXh0KCk7XG5cdFx0fSk7XG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIGRlY2xhcmVIVFRQU1NlcnZlck9wdGlvbnMoKTogUHJvbWlzZTxTZWN1cmVDb250ZXh0T3B0aW9ucz4ge1xuXHRcdHRyeSB7XG5cdFx0XHR2YWxpZGF0ZURlcGVuZGVuY2llcyhcblx0XHRcdFx0W3sgbmFtZTogJ3Rsc0NpcGhlcnMnLCBpbnN0YW5jZTogdGxzQ2lwaGVycyB9XSxcblx0XHRcdFx0dGhpcy5sb2dnZXJcblx0XHRcdCk7XG5cblx0XHRcdGNvbnN0IHRsc0tleVBhdGgxID0gdGhpcy5lbnZDb25maWcuZ2V0RW52VmFyaWFibGUoJ3Rsc0tleVBhdGgxJyk7XG5cdFx0XHRjb25zdCB0bHNDZXJ0UGF0aDEgPSB0aGlzLmVudkNvbmZpZy5nZXRFbnZWYXJpYWJsZSgndGxzQ2VydFBhdGgxJyk7XG5cblx0XHRcdGlmIChcblx0XHRcdFx0dHlwZW9mIHRsc0tleVBhdGgxICE9PSAnc3RyaW5nJyB8fFxuXHRcdFx0XHR0eXBlb2YgdGxzQ2VydFBhdGgxICE9PSAnc3RyaW5nJ1xuXHRcdFx0KSB7XG5cdFx0XHRcdHRocm93IG5ldyBFcnJvcignVExTIGtleSBvciBjZXJ0aWZpY2F0ZSBwYXRoIGlzIG5vdCBhIHN0cmluZycpO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRrZXk6IHRsc0tleVBhdGgxLFxuXHRcdFx0XHRjZXJ0OiB0bHNDZXJ0UGF0aDEsXG5cdFx0XHRcdHNlY3VyZU9wdGlvbnM6XG5cdFx0XHRcdFx0Y3J5cHRvQ29uc3RhbnRzLlNTTF9PUF9OT19UTFN2MSB8XG5cdFx0XHRcdFx0Y3J5cHRvQ29uc3RhbnRzLlNTTF9PUF9OT19UTFN2MV8xLFxuXHRcdFx0XHRjaXBoZXJzOiB0bHNDaXBoZXJzLmpvaW4oJzonKSxcblx0XHRcdFx0aG9ub3JDaXBoZXJPcmRlcjpcblx0XHRcdFx0XHR0aGlzLmVudkNvbmZpZy5nZXRGZWF0dXJlRmxhZ3MoKS5ob25vckNpcGhlck9yZGVyID09PSB0cnVlXG5cdFx0XHR9O1xuXHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHR0aGlzLmVycm9yTG9nZ2VyLmxvZ0Vycm9yKFxuXHRcdFx0XHRgRXJyb3IgZGVjbGFyaW5nIHdlYiBzZXJ2ZXIgb3B0aW9uczogJHtlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IGVycm9yfWBcblx0XHRcdCk7XG5cdFx0XHR0aGlzLmhhbmRsZUhUVFBTU2VydmVyRXJyb3JGYXRhbChcblx0XHRcdFx0ZXJyb3IsXG5cdFx0XHRcdCdERUNMQVJFX1NFUlZFUl9PUFRJT05TJyxcblx0XHRcdFx0e30sXG5cdFx0XHRcdCdFcnJvciBkZWNsYXJpbmcgd2ViIHNlcnZlciBvcHRpb25zJ1xuXHRcdFx0KTtcblx0XHRcdHRocm93IGVycm9yO1xuXHRcdH1cblx0fVxuXG5cdHB1YmxpYyBhc3luYyBzdGFydFNlcnZlcigpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHR0cnkge1xuXHRcdFx0aWYgKCF0aGlzLm9wdGlvbnMpIHtcblx0XHRcdFx0dGhyb3cgbmV3IHRoaXMuZXJyb3JIYW5kbGVyLkVycm9yQ2xhc3Nlcy5Db25maWd1cmF0aW9uRXJyb3JGYXRhbChcblx0XHRcdFx0XHQnU2VydmVyIG9wdGlvbnMgbm90IHNldCEnXG5cdFx0XHRcdCk7XG5cdFx0XHR9XG5cblx0XHRcdHRoaXMuc2VydmVyID0gaHR0cHMuY3JlYXRlU2VydmVyKHRoaXMub3B0aW9ucywgdGhpcy5hcHApO1xuXG5cdFx0XHR0aGlzLnNlcnZlci5vbignY29ubmVjdGlvbicsIChjb25uOiBuZXQuU29ja2V0KSA9PiB7XG5cdFx0XHRcdHRoaXMuY29ubmVjdGlvbnMuYWRkKGNvbm4pO1xuXHRcdFx0XHRjb25uLm9uKCdjbG9zZScsICgpID0+IHtcblx0XHRcdFx0XHR0aGlzLmNvbm5lY3Rpb25zLmRlbGV0ZShjb25uKTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9KTtcblxuXHRcdFx0dGhpcy5zZXJ2ZXIubGlzdGVuKHRoaXMucG9ydCwgKCkgPT4ge1xuXHRcdFx0XHR0aGlzLmxvZ2dlci5pbmZvKGBTZXJ2ZXIgaXMgcnVubmluZyBvbiBwb3J0ICR7dGhpcy5wb3J0fWApO1xuXHRcdFx0fSk7XG5cblx0XHRcdHRoaXMuc2V0dXBHcmFjZWZ1bFNodXRkb3duKCk7XG5cdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdHRoaXMuZXJyb3JMb2dnZXIubG9nV2Fybihcblx0XHRcdFx0YEVycm9yIHN0YXJ0aW5nIHRoZSBzZXJ2ZXI6ICR7ZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBlcnJvcn1gXG5cdFx0XHQpO1xuXHRcdFx0dGhpcy5oYW5kbGVIVFRQU1NlcnZlckVycm9yUmVjb3ZlcmFibGUoXG5cdFx0XHRcdGVycm9yLFxuXHRcdFx0XHQnU1RBUlRfU0VSVkVSJyxcblx0XHRcdFx0e30sXG5cdFx0XHRcdCdFcnJvciBzdGFydGluZyB0aGUgc2VydmVyJ1xuXHRcdFx0KTtcblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIHNldHVwR3JhY2VmdWxTaHV0ZG93bigpOiB2b2lkIHtcblx0XHRjb25zdCBzaHV0ZG93blRpbWVvdXQgPSB0aGlzLnNodXRkb3duVGltZW91dDtcblxuXHRcdGdyYWNlZnVsU2h1dGRvd24odGhpcy5zZXJ2ZXIhLCB7XG5cdFx0XHRzaWduYWxzOiAnU0lHSU5UIFNJR1RFUk0nLFxuXHRcdFx0dGltZW91dDogc2h1dGRvd25UaW1lb3V0LFxuXHRcdFx0b25TaHV0ZG93bjogYXN5bmMgKCkgPT4ge1xuXHRcdFx0XHR0aGlzLmxvZ2dlci5pbmZvKCdTZXJ2ZXIgc2h1dHRpbmcgZG93bi4uLicpO1xuXHRcdFx0XHR0aGlzLnNodXR0aW5nRG93biA9IHRydWU7XG5cblx0XHRcdFx0YXdhaXQgdGhpcy5jbG9zZUNvbm5lY3Rpb25zKCk7XG5cdFx0XHRcdHRoaXMubG9nZ2VyLmluZm8oJ0FsbCBhY3RpdmUgY29ubmVjdGlvbnMgY2xvc2VkLicpO1xuXG5cdFx0XHRcdGF3YWl0IHRoaXMuc2h1dGRvd25TZXJ2ZXIoKTtcblxuXHRcdFx0XHR0aGlzLmxvZ2dlci5pbmZvKFxuXHRcdFx0XHRcdCdBbGwgcmVzb3VyY2VzIGNsZWFuZWQgdXAgYW5kIHNlcnZlciBzaHV0IGRvd24gc3VjY2Vzc2Z1bGx5Lidcblx0XHRcdFx0KTtcblx0XHRcdH0sXG5cdFx0XHRmaW5hbGx5OiBhc3luYyAoKSA9PiB7XG5cdFx0XHRcdHRoaXMubG9nZ2VyLmluZm8oJ0dyYWNlZnVsIHNodXRkb3duIHByb2Nlc3MgY29tcGxldGVkLicpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0dGhpcy5hcHAudXNlKChyZXEsIHJlcywgbmV4dCkgPT4ge1xuXHRcdFx0aWYgKHRoaXMuc2h1dHRpbmdEb3duKSB7XG5cdFx0XHRcdHJlcy5zZXRIZWFkZXIoJ0Nvbm5lY3Rpb24nLCAnY2xvc2UnKTtcblx0XHRcdFx0cmV0dXJuIHJlcy5zdGF0dXMoNTAzKS5zZW5kKCdTZXJ2ZXIgaXMgc2h1dHRpbmcgZG93bi4nKTtcblx0XHRcdH1cblx0XHRcdHJldHVybiBuZXh0KCk7XG5cdFx0fSk7XG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIGNsb3NlQ29ubmVjdGlvbnMoKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0dHJ5IHtcblx0XHRcdGF3YWl0IG5ldyBQcm9taXNlPHZvaWQ+KHJlc29sdmUgPT4ge1xuXHRcdFx0XHRjb25zdCB0aW1lb3V0ID0gc2V0VGltZW91dCgoKSA9PiB7XG5cdFx0XHRcdFx0dGhpcy5sb2dnZXIud2FybignRm9yY2UgY2xvc2luZyByZW1haW5pbmcgY29ubmVjdGlvbnMuLi4nKTtcblx0XHRcdFx0XHR0aGlzLmNvbm5lY3Rpb25zLmZvckVhY2goY29ubiA9PiBjb25uLmRlc3Ryb3koKSk7XG5cdFx0XHRcdFx0cmVzb2x2ZSgpO1xuXHRcdFx0XHR9LCAzMDAwMCk7XG5cblx0XHRcdFx0Y29uc3QgY2hlY2tDb25uZWN0aW9ucyA9IHNldEludGVydmFsKCgpID0+IHtcblx0XHRcdFx0XHRpZiAodGhpcy5jb25uZWN0aW9ucy5zaXplID09PSAwKSB7XG5cdFx0XHRcdFx0XHRjbGVhckludGVydmFsKGNoZWNrQ29ubmVjdGlvbnMpO1xuXHRcdFx0XHRcdFx0Y2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xuXHRcdFx0XHRcdFx0cmVzb2x2ZSgpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSwgMTAwKTtcblx0XHRcdH0pO1xuXHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHR0aGlzLmVycm9yTG9nZ2VyLmxvZ1dhcm4oXG5cdFx0XHRcdCdFcnJvciBjbG9zaW5nIGNvbm5lY3Rpb25zOiAke2Vycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogZXJyb3J9J1xuXHRcdFx0KTtcblx0XHRcdHRoaXMuaGFuZGxlSFRUUFNTZXJ2ZXJFcnJvclJlY292ZXJhYmxlKFxuXHRcdFx0XHRlcnJvcixcblx0XHRcdFx0J0NMT1NFX0NPTk5FQ1RJT05TJyxcblx0XHRcdFx0e30sXG5cdFx0XHRcdCdFcnJvciBjbG9zaW5nIGNvbm5lY3Rpb25zJ1xuXHRcdFx0KTtcblx0XHR9XG5cdH1cblxuXHRwdWJsaWMgYXN5bmMgc2h1dGRvd25TZXJ2ZXIoKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0aWYgKHRoaXMuc2h1dHRpbmdEb3duKSB7XG5cdFx0XHR0aGlzLmxvZ2dlci53YXJuKCdTaHV0ZG93biBhbHJlYWR5IGluIHByb2dyZXNzLicpO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdHRoaXMuc2h1dHRpbmdEb3duID0gdHJ1ZTtcblxuXHRcdHRyeSB7XG5cdFx0XHR0aGlzLmxvZ2dlci5pbmZvKCdJbml0aWF0aW5nIHNlcnZlciBzaHV0ZG93bi4uLicpO1xuXG5cdFx0XHR0aGlzLnNlcnZlcj8uY2xvc2UoKCkgPT4ge1xuXHRcdFx0XHR0aGlzLmxvZ2dlci5pbmZvKCdObyBsb25nZXIgYWNjZXB0aW5nIG5ldyBjb25uZWN0aW9ucy4nKTtcblx0XHRcdH0pO1xuXG5cdFx0XHRhd2FpdCB0aGlzLnNodXREb3duTGF5ZXIyMFNlcnZpY2VzKCk7XG5cdFx0XHRhd2FpdCB0aGlzLnNodXREb3duTGF5ZXIxOVNlcnZpY2VzKCk7XG5cdFx0XHRhd2FpdCB0aGlzLnNodXREb3duTGF5ZXIxN1NlcnZpY2VzKCk7XG5cdFx0XHRhd2FpdCB0aGlzLnNodXREb3duTGF5ZXIxNlNlcnZpY2VzKCk7XG5cdFx0XHRhd2FpdCB0aGlzLnNodXREb3duTGF5ZXIxNVNlcnZpY2VzKCk7XG5cdFx0XHRhd2FpdCB0aGlzLnNodXREb3duTGF5ZXIxNFNlcnZpY2VzKCk7XG5cdFx0XHRhd2FpdCB0aGlzLnNodXREb3duTGF5ZXIxM1NlcnZpY2VzKCk7XG5cdFx0XHRhd2FpdCB0aGlzLnNodXREb3duTGF5ZXIxMlNlcnZpY2VzKCk7XG5cdFx0XHRhd2FpdCB0aGlzLnNodXREb3duTGF5ZXIxMVNlcnZpY2VzKCk7XG5cdFx0XHRhd2FpdCB0aGlzLnNodXREb3duTGF5ZXIxMFNlcnZpY2VzKCk7XG5cdFx0XHRhd2FpdCB0aGlzLnNodXREb3duTGF5ZXI5U2VydmljZXMoKTtcblx0XHRcdGF3YWl0IHRoaXMuc2h1dERvd25MYXllcjhTZXJ2aWNlcygpO1xuXHRcdFx0YXdhaXQgdGhpcy5zaHV0RG93bkxheWVyN1NlcnZpY2VzKCk7XG5cdFx0XHRhd2FpdCB0aGlzLnNodXREb3duTGF5ZXI2U2VydmljZXMoKTtcblx0XHRcdGF3YWl0IHRoaXMuc2h1dERvd25MYXllcjVTZXJ2aWNlcygpO1xuXHRcdFx0YXdhaXQgdGhpcy5zaHV0RG93bkxheWVyNFNlcnZpY2VzKCk7XG5cdFx0XHRhd2FpdCB0aGlzLnNodXREb3duTGF5ZXIzU2VydmljZXMoKTtcblx0XHRcdGF3YWl0IHRoaXMuc2h1dERvd25MYXllcjJTZXJ2aWNlcygpO1xuXHRcdFx0YXdhaXQgdGhpcy5zaHV0RG93bkxheWVyMVNlcnZpY2VzKCk7XG5cblx0XHRcdHRoaXMubG9nZ2VyLmluZm8oJ1NlcnZlciBoYXMgc2h1dCBkb3duIHN1Y2Nlc3NmdWxseS4nKTtcblx0XHR9IGNhdGNoIChlcnJvcikge1xuXHRcdFx0dGhpcy5lcnJvckxvZ2dlci5sb2dFcnJvcihcblx0XHRcdFx0YEVycm9yIG9jY3VycmVkIHdoaWxlIHNodXR0aW5nIGRvd24gdGhlIHNlcnZlcjogJHtlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IGVycm9yfWBcblx0XHRcdCk7XG5cdFx0XHR0aGlzLmhhbmRsZUhUVFBTU2VydmVyRXJyb3JSZWNvdmVyYWJsZShcblx0XHRcdFx0ZXJyb3IsXG5cdFx0XHRcdCdTSFVURE9XTl9TRVJWRVInLFxuXHRcdFx0XHR7fSxcblx0XHRcdFx0J0Vycm9yIHNodXR0aW5nIGRvd24gdGhlIHNlcnZlcidcblx0XHRcdCk7XG5cdFx0fVxuXHR9XG5cblx0cHVibGljIGFzeW5jIGdldEhUVFBTU2VydmVySW5mbygpOiBQcm9taXNlPFJlY29yZDxzdHJpbmcsIHVua25vd24+PiB7XG5cdFx0dHJ5IHtcblx0XHRcdGlmICghdGhpcy5zZXJ2ZXIpIHtcblx0XHRcdFx0dGhyb3cgbmV3IHRoaXMuZXJyb3JIYW5kbGVyLkVycm9yQ2xhc3Nlcy5TZXJ2ZXJOb3RJbml0aWFsaXplZEVycm9yKFxuXHRcdFx0XHRcdCdIVFRQUyBzZXJ2ZXIgaXMgbm90IGluaXRpYWxpemVkLidcblx0XHRcdFx0KTtcblx0XHRcdH1cblxuXHRcdFx0Y29uc3QgdXB0aW1lID0gcHJvY2Vzcy51cHRpbWUoKTtcblx0XHRcdGNvbnN0IG1lbW9yeVVzYWdlID0gcHJvY2Vzcy5tZW1vcnlVc2FnZSgpO1xuXHRcdFx0Y29uc3QgY3B1VXNhZ2UgPSBwcm9jZXNzLmNwdVVzYWdlKCk7XG5cblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdHN0YXR1czogdGhpcy5zZXJ2ZXIubGlzdGVuaW5nID8gJ1J1bm5pbmcnIDogJ1N0b3BwZWQnLFxuXHRcdFx0XHR1cHRpbWVfaW5fc2Vjb25kczogdXB0aW1lLFxuXHRcdFx0XHRtZW1vcnlVc2FnZToge1xuXHRcdFx0XHRcdGhlYXBVc2VkOiBtZW1vcnlVc2FnZS5oZWFwVXNlZCxcblx0XHRcdFx0XHRoZWFwVG90YWw6IG1lbW9yeVVzYWdlLmhlYXBUb3RhbCxcblx0XHRcdFx0XHRyc3M6IG1lbW9yeVVzYWdlLnJzc1xuXHRcdFx0XHR9LFxuXHRcdFx0XHRjcHVVc2FnZToge1xuXHRcdFx0XHRcdHVzZXI6IGNwdVVzYWdlLnVzZXIgLyAxMDAwLFxuXHRcdFx0XHRcdHN5c3RlbTogY3B1VXNhZ2Uuc3lzdGVtIC8gMTAwMFxuXHRcdFx0XHR9LFxuXHRcdFx0XHRjb25uZWN0aW9uczogdGhpcy5jb25uZWN0aW9ucy5zaXplXG5cdFx0XHR9O1xuXHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHR0aGlzLmxvZ2dlci5lcnJvcignRXJyb3IgZ2V0dGluZyBIVFRQUyBzZXJ2ZXIgaW5mbzonLCB7IGVycm9yIH0pO1xuXHRcdFx0dGhyb3cgZXJyb3I7XG5cdFx0fVxuXHR9XG5cblx0cHVibGljIGFzeW5jIGdldEhUVFBTU2VydmVyTWV0cmljcyhcblx0XHRzZXJ2aWNlTmFtZTogc3RyaW5nXG5cdCk6IFByb21pc2U8UmVjb3JkPHN0cmluZywgdW5rbm93bj4+IHtcblx0XHR0cnkge1xuXHRcdFx0aWYgKCF0aGlzLnNlcnZlcikge1xuXHRcdFx0XHR0aHJvdyBuZXcgdGhpcy5lcnJvckhhbmRsZXIuRXJyb3JDbGFzc2VzLlNlcnZlck5vdEluaXRpYWxpemVkRXJyb3IoXG5cdFx0XHRcdFx0J0hUVFBTIHNlcnZlciBpcyBub3QgaW5pdGlhbGl6ZWQuJ1xuXHRcdFx0XHQpO1xuXHRcdFx0fVxuXG5cdFx0XHRjb25zdCBjb25uZWN0aW9uc0NvdW50ID0gdGhpcy5jb25uZWN0aW9ucy5zaXplO1xuXHRcdFx0Y29uc3QgdXB0aW1lID0gcHJvY2Vzcy51cHRpbWUoKTtcblx0XHRcdGNvbnN0IG1lbW9yeVVzYWdlID0gcHJvY2Vzcy5tZW1vcnlVc2FnZSgpO1xuXHRcdFx0Y29uc3QgY3B1VXNhZ2UgPSBwcm9jZXNzLmNwdVVzYWdlKCk7XG5cdFx0XHRjb25zdCBhdmVyYWdlUmVzcG9uc2VUaW1lID1cblx0XHRcdFx0dGhpcy5yb290TWlkZGxld2FyZVNlcnZpY2UuZ2V0QXZlcmFnZVJlc3BvbnNlVGltZSgpO1xuXG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRzZXJ2aWNlTmFtZSxcblx0XHRcdFx0Y29ubmVjdGlvbnNDb3VudCxcblx0XHRcdFx0dXB0aW1lX2luX3NlY29uZHM6IHVwdGltZSxcblx0XHRcdFx0bWVtb3J5VXNhZ2U6IHtcblx0XHRcdFx0XHRoZWFwVXNlZDogbWVtb3J5VXNhZ2UuaGVhcFVzZWQsXG5cdFx0XHRcdFx0aGVhcFRvdGFsOiBtZW1vcnlVc2FnZS5oZWFwVG90YWwsXG5cdFx0XHRcdFx0cnNzOiBtZW1vcnlVc2FnZS5yc3Ncblx0XHRcdFx0fSxcblx0XHRcdFx0Y3B1VXNhZ2U6IHtcblx0XHRcdFx0XHR1c2VyOiBjcHVVc2FnZS51c2VyIC8gMTAwMCxcblx0XHRcdFx0XHRzeXN0ZW06IGNwdVVzYWdlLnN5c3RlbSAvIDEwMDBcblx0XHRcdFx0fSxcblx0XHRcdFx0YXZlcmFnZVJlc3BvbnNlVGltZVxuXHRcdFx0fTtcblx0XHR9IGNhdGNoIChlcnJvcikge1xuXHRcdFx0dGhpcy5sb2dnZXIuZXJyb3IoXG5cdFx0XHRcdGBFcnJvciBnZXR0aW5nIEhUVFBTIHNlcnZlciBtZXRyaWNzIGZvciBzZXJ2aWNlICR7c2VydmljZU5hbWV9OmAsXG5cdFx0XHRcdHsgZXJyb3IgfVxuXHRcdFx0KTtcblx0XHRcdHRocm93IGVycm9yO1xuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgc2h1dERvd25MYXllcjIwU2VydmljZXMoKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0dGhpcy5sb2dnZXIuaW5mbygnU2h1dHRpbmcgZG93biBMYXllciAyMCBzZXJ2aWNlczogSGVhbHRoIENoZWNrLi4uJyk7XG5cdFx0dHJ5IHtcblx0XHRcdHRoaXMuaGVhbHRoQ2hlY2tTZXJ2aWNlLnNodXRkb3duKCk7XG5cdFx0XHR0aGlzLmxvZ2dlci5pbmZvKCdMYXllciAyMCBzZXJ2aWNlcyBoYXZlIGJlZW4gc2h1dCBkb3duLicpO1xuXHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHR0aGlzLmhhbmRsZUhUVFBTU2VydmVyRXJyb3JSZWNvdmVyYWJsZShcblx0XHRcdFx0ZXJyb3IsXG5cdFx0XHRcdCdTSFVURE9XTl9MQVlFUl8yMCcsXG5cdFx0XHRcdHt9LFxuXHRcdFx0XHQnRXJyb3Igc2h1dHRpbmcgZG93biBMYXllciAyMCBzZXJ2aWNlcydcblx0XHRcdCk7XG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyBzaHV0RG93bkxheWVyMTlTZXJ2aWNlcygpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHR0aGlzLmxvZ2dlci5pbmZvKFxuXHRcdFx0J1NodXR0aW5nIGRvd24gTGF5ZXIgMTkgc2VydmljZXM6IFJlc291cmNlIE1hbmFnZXIuLi4nXG5cdFx0KTtcblx0XHR0cnkge1xuXHRcdFx0YXdhaXQgdGhpcy5yZXNvdXJjZU1hbmFnZXIuc2h1dGRvd24oKTtcblx0XHRcdHRoaXMubG9nZ2VyLmluZm8oJ0xheWVyIDE5IHNlcnZpY2VzIGhhdmUgYmVlbiBzaHV0IGRvd24uJyk7XG5cdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdHRoaXMuaGFuZGxlSFRUUFNTZXJ2ZXJFcnJvclJlY292ZXJhYmxlKFxuXHRcdFx0XHRlcnJvcixcblx0XHRcdFx0J1NIVVRET1dOX0xBWUVSXzE5Jyxcblx0XHRcdFx0e30sXG5cdFx0XHRcdCdFcnJvciBzaHV0dGluZyBkb3duIExheWVyIDE5IHNlcnZpY2VzJ1xuXHRcdFx0KTtcblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIHNodXREb3duTGF5ZXIxN1NlcnZpY2VzKCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdHRoaXMubG9nZ2VyLmluZm8oXG5cdFx0XHQnU2h1dHRpbmcgZG93biBMYXllciAxNyBzZXJ2aWNlczogTWFpbGVyIGFuZCBNdWx0ZXIgVXBsb2FkIFNlcnZpY2VzLi4uJ1xuXHRcdCk7XG5cdFx0dHJ5IHtcblx0XHRcdGF3YWl0IFByb21pc2UuYWxsKFtcblx0XHRcdFx0dGhpcy5tYWlsZXJTZXJ2aWNlLnNodXRkb3duKCksXG5cdFx0XHRcdHRoaXMubXVsdGVyVXBsb2FkU2VydmljZS5zaHV0ZG93bigpXG5cdFx0XHRdKTtcblx0XHRcdHRoaXMubG9nZ2VyLmluZm8oJ0xheWVyIDE3IHNlcnZpY2VzIGhhdmUgYmVlbiBzaHV0IGRvd24uJyk7XG5cdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdHRoaXMuaGFuZGxlSFRUUFNTZXJ2ZXJFcnJvclJlY292ZXJhYmxlKFxuXHRcdFx0XHRlcnJvcixcblx0XHRcdFx0J1NIVVRET1dOX0xBWUVSXzE3Jyxcblx0XHRcdFx0e30sXG5cdFx0XHRcdCdFcnJvciBzaHV0dGluZyBkb3duIExheWVyIDE3IHNlcnZpY2VzJ1xuXHRcdFx0KTtcblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIHNodXREb3duTGF5ZXIxNlNlcnZpY2VzKCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdHRoaXMubG9nZ2VyLmluZm8oXG5cdFx0XHQnU2h1dHRpbmcgZG93biBMYXllciAxNiBzZXJ2aWNlczogQ1NSRiwgSGVsbWV0LCBKV1QgQXV0aCwgYW5kIFBhc3Nwb3J0IE1pZGRsZXdhcmVzLi4uJ1xuXHRcdCk7XG5cdFx0dHJ5IHtcblx0XHRcdGF3YWl0IFByb21pc2UuYWxsKFtcblx0XHRcdFx0dGhpcy5jc3JmTWlkZGxld2FyZS5zaHV0ZG93bigpLFxuXHRcdFx0XHR0aGlzLmhlbG1ldE1pZGRsZXdhcmUuc2h1dGRvd24oKSxcblx0XHRcdFx0dGhpcy5qd3RBdXRoTWlkZGxld2FyZVNlcnZpY2Uuc2h1dGRvd24oKSxcblx0XHRcdFx0dGhpcy5wYXNzcG9ydEF1dGhNaWRkbGV3YXJlU2VydmljZS5zaHV0ZG93bigpXG5cdFx0XHRdKTtcblx0XHRcdHRoaXMubG9nZ2VyLmluZm8oJ0xheWVyIDE2IHNlcnZpY2VzIGhhdmUgYmVlbiBzaHV0IGRvd24uJyk7XG5cdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdHRoaXMuaGFuZGxlSFRUUFNTZXJ2ZXJFcnJvclJlY292ZXJhYmxlKFxuXHRcdFx0XHRlcnJvcixcblx0XHRcdFx0J1NIVVRET1dOX0xBWUVSXzE2Jyxcblx0XHRcdFx0e30sXG5cdFx0XHRcdCdFcnJvciBzaHV0dGluZyBkb3duIExheWVyIDE2IHNlcnZpY2VzJ1xuXHRcdFx0KTtcblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIHNodXREb3duTGF5ZXIxNVNlcnZpY2VzKCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdHRoaXMubG9nZ2VyLmluZm8oXG5cdFx0XHQnU2h1dHRpbmcgZG93biBMYXllciAxNSBzZXJ2aWNlczogUGFzc3BvcnQgQXV0aCBTZXJ2aWNlLi4uJ1xuXHRcdCk7XG5cdFx0dHJ5IHtcblx0XHRcdGF3YWl0IHRoaXMucGFzc3BvcnRTZXJ2aWNlLnNodXRkb3duKCk7XG5cdFx0XHR0aGlzLmxvZ2dlci5pbmZvKCdMYXllciAxNSBzZXJ2aWNlcyBoYXZlIGJlZW4gc2h1dCBkb3duLicpO1xuXHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHR0aGlzLmhhbmRsZUhUVFBTU2VydmVyRXJyb3JSZWNvdmVyYWJsZShcblx0XHRcdFx0ZXJyb3IsXG5cdFx0XHRcdCdTSFVURE9XTl9MQVlFUl8xNScsXG5cdFx0XHRcdHt9LFxuXHRcdFx0XHQnRXJyb3Igc2h1dHRpbmcgZG93biBMYXllciAxNSBzZXJ2aWNlcydcblx0XHRcdCk7XG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyBzaHV0RG93bkxheWVyMTRTZXJ2aWNlcygpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHR0aGlzLmxvZ2dlci5pbmZvKFxuXHRcdFx0J1NodXR0aW5nIGRvd24gTGF5ZXIgMTQgc2VydmljZXM6IEJhY2t1cCBDb2RlLCBFbWFpbE1GQSwgRklETzIsIEpXVCwgVE9UUCwgYW5kIFl1YmljbyBPVFAgU2VydmljZXMuLi4nXG5cdFx0KTtcblx0XHR0cnkge1xuXHRcdFx0YXdhaXQgUHJvbWlzZS5hbGwoW1xuXHRcdFx0XHR0aGlzLmJhY2t1cENvZGVTZXJ2aWNlLnNodXRkb3duKCksXG5cdFx0XHRcdHRoaXMuZW1haWxNRkFTZXJ2aWNlLnNodXRkb3duKCksXG5cdFx0XHRcdHRoaXMuZmlkbzJTZXJ2aWNlLnNodXRkb3duKCksXG5cdFx0XHRcdHRoaXMuand0U2VydmljZS5zaHV0ZG93bigpLFxuXHRcdFx0XHR0aGlzLnBhc3Nwb3J0U2VydmljZS5zaHV0ZG93bigpLFxuXHRcdFx0XHR0aGlzLnRvdHBTZXJ2aWNlLnNodXRkb3duKCksXG5cdFx0XHRcdHRoaXMueXViaWNvT1RQU2VydmljZS5zaHV0ZG93bigpXG5cdFx0XHRdKTtcblx0XHRcdHRoaXMubG9nZ2VyLmluZm8oJ0xheWVyIDE0IHNlcnZpY2VzIGhhdmUgYmVlbiBzaHV0IGRvd24uJyk7XG5cdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdHRoaXMuaGFuZGxlSFRUUFNTZXJ2ZXJFcnJvclJlY292ZXJhYmxlKFxuXHRcdFx0XHRlcnJvcixcblx0XHRcdFx0J1NIVVRET1dOX0xBWUVSXzE0Jyxcblx0XHRcdFx0e30sXG5cdFx0XHRcdCdFcnJvciBzaHV0dGluZyBkb3duIExheWVyIDE0IHNlcnZpY2VzJ1xuXHRcdFx0KTtcblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIHNodXREb3duTGF5ZXIxM1NlcnZpY2VzKCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdHRoaXMubG9nZ2VyLmluZm8oJ1NodXR0aW5nIGRvd24gTGF5ZXIgMTMgc2VydmljZXM6IEF1dGggQ29udHJvbGxlci4uLicpO1xuXHRcdHRyeSB7XG5cdFx0XHRhd2FpdCB0aGlzLmF1dGhDb250cm9sbGVyLnNodXRkb3duKCk7XG5cdFx0XHR0aGlzLmxvZ2dlci5pbmZvKCdMYXllciAxMyBzZXJ2aWNlcyBoYXZlIGJlZW4gc2h1dCBkb3duLicpO1xuXHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHR0aGlzLmhhbmRsZUhUVFBTU2VydmVyRXJyb3JSZWNvdmVyYWJsZShcblx0XHRcdFx0ZXJyb3IsXG5cdFx0XHRcdCdTSFVURE9XTl9MQVlFUl8xMycsXG5cdFx0XHRcdHt9LFxuXHRcdFx0XHQnRXJyb3Igc2h1dHRpbmcgZG93biBMYXllciAxMyBzZXJ2aWNlcydcblx0XHRcdCk7XG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyBzaHV0RG93bkxheWVyMTJTZXJ2aWNlcygpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHR0aGlzLmxvZ2dlci5pbmZvKCdTaHV0dGluZyBkb3duIExheWVyIDEyIHNlcnZpY2VzOiBVc2VyIENvbnRyb2xsZXIuLi4nKTtcblx0XHR0cnkge1xuXHRcdFx0YXdhaXQgdGhpcy51c2VyQ29udHJvbGxlci5zaHV0ZG93bigpO1xuXHRcdFx0dGhpcy5sb2dnZXIuaW5mbygnTGF5ZXIgMTIgc2VydmljZXMgaGF2ZSBiZWVuIHNodXQgZG93bi4nKTtcblx0XHR9IGNhdGNoIChlcnJvcikge1xuXHRcdFx0dGhpcy5oYW5kbGVIVFRQU1NlcnZlckVycm9yUmVjb3ZlcmFibGUoXG5cdFx0XHRcdGVycm9yLFxuXHRcdFx0XHQnU0hVVERPV05fTEFZRVJfMTInLFxuXHRcdFx0XHR7fSxcblx0XHRcdFx0J0Vycm9yIHNodXR0aW5nIGRvd24gTGF5ZXIgMTIgc2VydmljZXMnXG5cdFx0XHQpO1xuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgc2h1dERvd25MYXllcjExU2VydmljZXMoKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0dGhpcy5sb2dnZXIuaW5mbyhcblx0XHRcdCdTaHV0dGluZyBkb3duIExheWVyIDExIHNlcnZpY2VzOiBCYXNlIFJvdXRlciBhbmQgcm91dGVyIGV4dGVuc2lvbnMgKEFQSSBSb3V0ZXIsIEhlYWx0aCBSb3V0ZXIsIFN0YXRpYyBSb3V0ZXIsIGV0YykuLi4nXG5cdFx0KTtcblx0XHR0cnkge1xuXHRcdFx0YXdhaXQgdGhpcy5iYXNlUm91dGVyLnNodXRkb3duKCk7XG5cdFx0XHR0aGlzLmxvZ2dlci5pbmZvKCdMYXllciAxMSBzZXJ2aWNlcyBoYXZlIGJlZW4gc2h1dCBkb3duLicpO1xuXHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHR0aGlzLmhhbmRsZUhUVFBTU2VydmVyRXJyb3JSZWNvdmVyYWJsZShcblx0XHRcdFx0ZXJyb3IsXG5cdFx0XHRcdCdTSFVURE9XTl9MQVlFUl8xMScsXG5cdFx0XHRcdHt9LFxuXHRcdFx0XHQnRXJyb3Igc2h1dHRpbmcgZG93biBMYXllciAxMSBzZXJ2aWNlcydcblx0XHRcdCk7XG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyBzaHV0RG93bkxheWVyMTBTZXJ2aWNlcygpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHR0aGlzLmxvZ2dlci5pbmZvKFxuXHRcdFx0J1NodXR0aW5nIGRvd24gTGF5ZXIgMTAgc2VydmljZXM6IEFjY2VzcyBDb250cm9sIE1pZGRsZXdhcmUuLi4nXG5cdFx0KTtcblx0XHR0cnkge1xuXHRcdFx0YXdhaXQgdGhpcy5hY2Nlc3NDb250cm9sTWlkZGxld2FyZS5zaHV0ZG93bigpO1xuXHRcdFx0dGhpcy5sb2dnZXIuaW5mbygnTGF5ZXIgMTAgc2VydmljZXMgaGF2ZSBiZWVuIHNodXQgZG93bi4nKTtcblx0XHR9IGNhdGNoIChlcnJvcikge1xuXHRcdFx0dGhpcy5oYW5kbGVIVFRQU1NlcnZlckVycm9yUmVjb3ZlcmFibGUoXG5cdFx0XHRcdGVycm9yLFxuXHRcdFx0XHQnU0hVVERPV05fTEFZRVJfMTAnLFxuXHRcdFx0XHR7fSxcblx0XHRcdFx0J0Vycm9yIHNodXR0aW5nIGRvd24gTGF5ZXIgMTAgc2VydmljZXMnXG5cdFx0XHQpO1xuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgc2h1dERvd25MYXllcjlTZXJ2aWNlcygpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHR0aGlzLmxvZ2dlci5pbmZvKCdTaHV0dGluZyBkb3duIExheWVyIDkgc2VydmljZXM6IEdhdGVrZWVwZXIuLi4nKTtcblx0XHR0cnkge1xuXHRcdFx0YXdhaXQgdGhpcy5nYXRla2VlcGVyU2VydmljZS5zaHV0ZG93bigpO1xuXHRcdFx0dGhpcy5sb2dnZXIuaW5mbygnTGF5ZXIgOSBzZXJ2aWNlcyBoYXZlIGJlZW4gc2h1dCBkb3duLicpO1xuXHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHR0aGlzLmhhbmRsZUhUVFBTU2VydmVyRXJyb3JSZWNvdmVyYWJsZShcblx0XHRcdFx0ZXJyb3IsXG5cdFx0XHRcdCdTSFVURE9XTl9MQVlFUl85Jyxcblx0XHRcdFx0e30sXG5cdFx0XHRcdCdFcnJvciBzaHV0dGluZyBkb3duIExheWVyIDkgc2VydmljZXMnXG5cdFx0XHQpO1xuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgc2h1dERvd25MYXllcjhTZXJ2aWNlcygpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHR0aGlzLmxvZ2dlci5pbmZvKCdTaHV0dGluZyBkb3duIExheWVyIDggc2VydmljZXM6IENhY2hlIFNlcnZpY2UuLi4nKTtcblx0XHR0cnkge1xuXHRcdFx0YXdhaXQgdGhpcy5jYWNoZVNlcnZpY2Uuc2h1dGRvd24oKTtcblx0XHRcdHRoaXMubG9nZ2VyLmluZm8oJ0xheWVyIDggc2VydmljZXMgaGF2ZSBiZWVuIHNodXQgZG93bi4nKTtcblx0XHR9IGNhdGNoIChlcnJvcikge1xuXHRcdFx0dGhpcy5oYW5kbGVIVFRQU1NlcnZlckVycm9yUmVjb3ZlcmFibGUoXG5cdFx0XHRcdGVycm9yLFxuXHRcdFx0XHQnU0hVVERPV05fTEFZRVJfOCcsXG5cdFx0XHRcdHt9LFxuXHRcdFx0XHQnRXJyb3Igc2h1dHRpbmcgZG93biBMYXllciA4IHNlcnZpY2VzJ1xuXHRcdFx0KTtcblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIHNodXREb3duTGF5ZXI3U2VydmljZXMoKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0dGhpcy5sb2dnZXIuaW5mbyhcblx0XHRcdCdTaHV0dGluZyBkb3duIExheWVyIDcgc2VydmljZXM6IERhdGFiYXNlIENvbnRyb2xsZXIuLi4nXG5cdFx0KTtcblx0XHR0cnkge1xuXHRcdFx0YXdhaXQgdGhpcy5kYXRhYmFzZUNvbnRyb2xsZXIuc2h1dGRvd24oKTtcblx0XHR9IGNhdGNoIChlcnJvcikge1xuXHRcdFx0dGhpcy5oYW5kbGVIVFRQU1NlcnZlckVycm9yUmVjb3ZlcmFibGUoXG5cdFx0XHRcdGVycm9yLFxuXHRcdFx0XHQnU0hVVERPV05fTEFZRVJfNycsXG5cdFx0XHRcdHt9LFxuXHRcdFx0XHQnRXJyb3Igc2h1dHRpbmcgZG93biBMYXllciA3IHNlcnZpY2VzJ1xuXHRcdFx0KTtcblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIHNodXREb3duTGF5ZXI2U2VydmljZXMoKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0dGhpcy5sb2dnZXIuaW5mbygnU2h1dHRpbmcgZG93biBMYXllciA2IHNlcnZpY2VzOiBSb290IE1pZGRsZXdhcmUuLi4nKTtcblx0XHR0cnkge1xuXHRcdFx0YXdhaXQgdGhpcy5kYXRhYmFzZUNvbnRyb2xsZXIuc2h1dGRvd24oKTtcblx0XHRcdHRoaXMubG9nZ2VyLmluZm8oJ0xheWVyIDYgc2VydmljZXMgaGF2ZSBiZWVuIHNodXQgZG93bi4nKTtcblx0XHR9IGNhdGNoIChlcnJvcikge1xuXHRcdFx0dGhpcy5oYW5kbGVIVFRQU1NlcnZlckVycm9yUmVjb3ZlcmFibGUoXG5cdFx0XHRcdGVycm9yLFxuXHRcdFx0XHQnU0hVVERPV05fTEFZRVJfNicsXG5cdFx0XHRcdHt9LFxuXHRcdFx0XHQnRXJyb3Igc2h1dHRpbmcgZG93biBMYXllciA2IHNlcnZpY2VzJ1xuXHRcdFx0KTtcblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIHNodXREb3duTGF5ZXI1U2VydmljZXMoKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0dGhpcy5sb2dnZXIuaW5mbyhcblx0XHRcdCdTaHV0dGluZyBkb3duIExheWVyIDUgc2VydmljZXM6IE1pZGRsZXdhcmUgU3RhdHVzIFNlcnZpY2UuLi4nXG5cdFx0KTtcblx0XHR0cnkge1xuXHRcdFx0YXdhaXQgdGhpcy5taWRkbGV3YXJlU3RhdHVzU2VydmljZS5zaHV0ZG93bigpO1xuXHRcdFx0dGhpcy5sb2dnZXIuaW5mbygnTGF5ZXIgNSBzZXJ2aWNlcyBoYXZlIGJlZW4gc2h1dCBkb3duLicpO1xuXHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHR0aGlzLmhhbmRsZUhUVFBTU2VydmVyRXJyb3JSZWNvdmVyYWJsZShcblx0XHRcdFx0ZXJyb3IsXG5cdFx0XHRcdCdTSFVURE9XTl9MQVlFUl81Jyxcblx0XHRcdFx0e30sXG5cdFx0XHRcdCdFcnJvciBzaHV0dGluZyBkb3duIExheWVyIDUgc2VydmljZXMnXG5cdFx0XHQpO1xuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgc2h1dERvd25MYXllcjRTZXJ2aWNlcygpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHR0aGlzLmxvZ2dlci5pbmZvKCdTaHV0dGluZyBkb3duIExheWVyIDQgc2VydmljZXM6IFZhdWx0Li4uJyk7XG5cdFx0dHJ5IHtcblx0XHRcdGF3YWl0IHRoaXMudmF1bHQuc2h1dGRvd24oKTtcblx0XHRcdHRoaXMubG9nZ2VyLmluZm8oJ0xheWVyIDQgc2VydmljZXMgaGF2ZSBiZWVuIHNodXQgZG93bi4nKTtcblx0XHR9IGNhdGNoIChlcnJvcikge1xuXHRcdFx0dGhpcy5oYW5kbGVIVFRQU1NlcnZlckVycm9yUmVjb3ZlcmFibGUoXG5cdFx0XHRcdGVycm9yLFxuXHRcdFx0XHQnU0hVVERPV05fTEFZRVJfNCcsXG5cdFx0XHRcdHt9LFxuXHRcdFx0XHQnRXJyb3Igc2h1dHRpbmcgZG93biBMYXllciA0IHNlcnZpY2VzJ1xuXHRcdFx0KTtcblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIHNodXREb3duTGF5ZXIzU2VydmljZXMoKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0dGhpcy5sb2dnZXIuaW5mbygnU2h1dHRpbmcgZG93biBMYXllciAzIHNlcnZpY2VzOiBFbnZDb25maWcuLi4nKTtcblx0XHR0cnkge1xuXHRcdFx0YXdhaXQgdGhpcy5lbnZDb25maWcuc2h1dGRvd24oKTtcblx0XHRcdHRoaXMubG9nZ2VyLmluZm8oJ0xheWVyIDMgc2VydmljZXMgaGF2ZSBiZWVuIHNodXQgZG93bi4nKTtcblx0XHR9IGNhdGNoIChlcnJvcikge1xuXHRcdFx0dGhpcy5oYW5kbGVIVFRQU1NlcnZlckVycm9yUmVjb3ZlcmFibGUoXG5cdFx0XHRcdGVycm9yLFxuXHRcdFx0XHQnU0hVVERPV05fTEFZRVJfMycsXG5cdFx0XHRcdHt9LFxuXHRcdFx0XHQnRXJyb3Igc2h1dHRpbmcgZG93biBMYXllciAzIHNlcnZpY2VzJ1xuXHRcdFx0KTtcblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIHNodXREb3duTGF5ZXIyU2VydmljZXMoKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0dGhpcy5sb2dnZXIuaW5mbygnU2h1dHRpbmcgZG93biBMYXllciAyIHNlcnZpY2VzOiBFcnJvciBIYW5kbGVyLi4uJyk7XG5cdFx0dHJ5IHtcblx0XHRcdGF3YWl0IHRoaXMuZXJyb3JIYW5kbGVyLnNodXRkb3duKCk7XG5cdFx0XHR0aGlzLmxvZ2dlci5pbmZvKCdMYXllciAyIHNlcnZpY2VzIGhhdmUgYmVlbiBzaHV0IGRvd24uJyk7XG5cdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdHRoaXMuaGFuZGxlSFRUUFNTZXJ2ZXJFcnJvclJlY292ZXJhYmxlKFxuXHRcdFx0XHRlcnJvcixcblx0XHRcdFx0J1NIVVRET1dOX0xBWUVSXzInLFxuXHRcdFx0XHR7fSxcblx0XHRcdFx0J0Vycm9yIHNodXR0aW5nIGRvd24gTGF5ZXIgMiBzZXJ2aWNlcydcblx0XHRcdCk7XG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyBzaHV0RG93bkxheWVyMVNlcnZpY2VzKCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdHRoaXMubG9nZ2VyLmluZm8oXG5cdFx0XHQnU2h1dHRpbmcgZG93biBMYXllciAxIHNlcnZpY2VzOiBMb2dnZXIgYW5kIEVycm9yIExvZ2dlci4uLidcblx0XHQpO1xuXHRcdHRyeSB7XG5cdFx0XHRhd2FpdCBQcm9taXNlLmFsbChbXG5cdFx0XHRcdHRoaXMuZXJyb3JMb2dnZXIuc2h1dGRvd24oKSxcblx0XHRcdFx0dGhpcy5sb2dnZXIuc2h1dGRvd24oKVxuXHRcdFx0XSk7XG5cdFx0XHR0aGlzLmxvZ2dlci5pbmZvKCdMYXllciAxIHNlcnZpY2VzIGhhdmUgYmVlbiBzaHV0IGRvd24uJyk7XG5cdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdHRoaXMuaGFuZGxlSFRUUFNTZXJ2ZXJFcnJvclJlY292ZXJhYmxlKFxuXHRcdFx0XHRlcnJvcixcblx0XHRcdFx0J1NIVVRET1dOX0xBWUVSXzEnLFxuXHRcdFx0XHR7fSxcblx0XHRcdFx0J0Vycm9yIHNodXR0aW5nIGRvd24gTGF5ZXIgMSBzZXJ2aWNlcydcblx0XHRcdCk7XG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSBoYW5kbGVIVFRQU1NlcnZlckVycm9yUmVjb3ZlcmFibGUoXG5cdFx0ZXJyb3I6IHVua25vd24sXG5cdFx0ZXJyb3JIZWFkZXI6IHN0cmluZyxcblx0XHRlcnJvckRldGFpbHM6IG9iamVjdCxcblx0XHRjdXN0b21NZXNzYWdlOiBzdHJpbmdcblx0KTogdm9pZCB7XG5cdFx0Y29uc3QgZXJyb3JNZXNzYWdlID0gYCR7Y3VzdG9tTWVzc2FnZX06ICR7ZXJyb3J9XFxuJHtlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3Iuc3RhY2sgOiAnJ31gO1xuXHRcdHRoaXMuZXJyb3JMb2dnZXIubG9nRXJyb3IoZXJyb3JNZXNzYWdlKTtcblx0XHRjb25zdCByZWRpc0Vycm9yID1cblx0XHRcdG5ldyB0aGlzLmVycm9ySGFuZGxlci5FcnJvckNsYXNzZXMuSFRUUFNDbGllbnRFcnJvckZhdGFsKFxuXHRcdFx0XHRlcnJvckhlYWRlcixcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGRldGFpbHM6IGVycm9yRGV0YWlscyxcblx0XHRcdFx0XHRleHBvc2VUb0NsaWVudDogZmFsc2Vcblx0XHRcdFx0fVxuXHRcdFx0KTtcblx0XHR0aGlzLmVycm9ySGFuZGxlci5oYW5kbGVFcnJvcih7XG5cdFx0XHRlcnJvcjogcmVkaXNFcnJvclxuXHRcdH0pO1xuXHRcdHByb2Nlc3MuZXhpdCgxKTtcblx0fVxuXG5cdHByaXZhdGUgaGFuZGxlSFRUUFNTZXJ2ZXJFcnJvckZhdGFsKFxuXHRcdGVycm9yOiB1bmtub3duLFxuXHRcdGVycm9ySGVhZGVyOiBzdHJpbmcsXG5cdFx0ZXJyb3JEZXRhaWxzOiBvYmplY3QsXG5cdFx0Y3VzdG9tTWVzc2FnZTogc3RyaW5nXG5cdCk6IHZvaWQge1xuXHRcdGNvbnN0IGVycm9yTWVzc2FnZSA9IGAke2N1c3RvbU1lc3NhZ2V9OiAke2Vycm9yfVxcbiR7ZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLnN0YWNrIDogJyd9YDtcblx0XHR0aGlzLmVycm9yTG9nZ2VyLmxvZ0Vycm9yKGVycm9yTWVzc2FnZSk7XG5cdFx0Y29uc3QgcmVkaXNFcnJvciA9XG5cdFx0XHRuZXcgdGhpcy5lcnJvckhhbmRsZXIuRXJyb3JDbGFzc2VzLkhUVFBTQ2xpZW50RXJyb3JGYXRhbChcblx0XHRcdFx0ZXJyb3JIZWFkZXIsXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRkZXRhaWxzOiBlcnJvckRldGFpbHMsXG5cdFx0XHRcdFx0ZXhwb3NlVG9DbGllbnQ6IGZhbHNlXG5cdFx0XHRcdH1cblx0XHRcdCk7XG5cdFx0dGhpcy5lcnJvckhhbmRsZXIuaGFuZGxlRXJyb3Ioe1xuXHRcdFx0ZXJyb3I6IHJlZGlzRXJyb3Jcblx0XHR9KTtcblx0XHRwcm9jZXNzLmV4aXQoMSk7XG5cdH1cbn1cbiJdfQ==
