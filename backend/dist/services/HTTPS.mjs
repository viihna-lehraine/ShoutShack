import gracefulShutdown from 'http-graceful-shutdown';
import https from 'https';
import { constants as cryptoConstants } from 'crypto';
import { validateDependencies } from '../utils/helpers.mjs';
import { ServiceFactory } from '../index/factory.mjs';
import { tlsCiphers } from '../config/security.mjs';
import timeout from 'connect-timeout';
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
			await ServiceFactory.getAccessControlMiddlewareService();
		this.authController = await ServiceFactory.getAuthController();
		this.backupCodeService = await ServiceFactory.getBackupCodeService();
		this.baseRouter = await ServiceFactory.getBaseRouter();
		this.csrfMiddleware = await ServiceFactory.getCSRFMiddlewareService();
		this.databaseController = await ServiceFactory.getDatabaseController();
		this.emailMFAService = await ServiceFactory.getEmailMFAService();
		this.fido2Service = await ServiceFactory.getFIDO2Service();
		this.gatekeeperService = await ServiceFactory.getGatekeeperService();
		this.middlewareStatusService =
			await ServiceFactory.getMiddlewareStatusService();
		this.multerUploadService =
			await ServiceFactory.getMulterUploadService();
		this.passportService = await ServiceFactory.getPassportService();
		this.passwordService = await ServiceFactory.getPasswordService();
		this.vault = await ServiceFactory.getVaultService();
		this.yubicoOTPService = await ServiceFactory.getYubicoOTPService();
	}
	static async getInstance(app, sequelize) {
		if (!HTTPSServer.instance) {
			const logger = await ServiceFactory.getLoggerService();
			const errorLogger = await ServiceFactory.getErrorLoggerService();
			const errorHandler = await ServiceFactory.getErrorHandlerService();
			const envConfig = await ServiceFactory.getEnvConfigService();
			const cacheService = await ServiceFactory.getCacheService();
			const redisService = await ServiceFactory.getRedisService();
			const resourceManager = await ServiceFactory.getResourceManager();
			const healthCheckService =
				await ServiceFactory.getHealthCheckService();
			const helmetMiddleware =
				await ServiceFactory.getHelmetMiddlewareService();
			const jwtAuthMiddlewareService =
				await ServiceFactory.getJWTAuthMiddlewareService();
			const passportAuthMiddlewareService =
				await ServiceFactory.getPassportAuthMiddlewareService();
			const accessControlMiddleware =
				await ServiceFactory.getAccessControlMiddlewareService();
			const authConroller = await ServiceFactory.getAuthController();
			const backupCodeService =
				await ServiceFactory.getBackupCodeService();
			const baseRouter = await ServiceFactory.getBaseRouter();
			const csrfMiddleware =
				await ServiceFactory.getCSRFMiddlewareService();
			const databaseController =
				await ServiceFactory.getDatabaseController();
			const emailMFAService = await ServiceFactory.getEmailMFAService();
			const fido2Service = await ServiceFactory.getFIDO2Service();
			const gatekeeperService =
				await ServiceFactory.getGatekeeperService();
			const jwtService = await ServiceFactory.getJWTService();
			const mailerService = await ServiceFactory.getMailerService();
			const middlewareStatusService =
				await ServiceFactory.getMiddlewareStatusService();
			const multerUploadService =
				await ServiceFactory.getMulterUploadService();
			const passportService = await ServiceFactory.getPassportService();
			const passwordService = await ServiceFactory.getPasswordService();
			const rootMiddlewareService =
				await ServiceFactory.getRootMiddlewareService();
			const totpService = await ServiceFactory.getTOTPService();
			const userController = await ServiceFactory.getUserController();
			const vault = await ServiceFactory.getVaultService();
			const yubicoOTPService = await ServiceFactory.getYubicoOTPService();
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
			await this.shutDownLayer19Services();
			await this.shutDownLayer18Services();
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
	async shutDownLayer19Services() {
		this.logger.info('Shutting down Layer 19 services: Health Check...');
		try {
			this.healthCheckService.shutdown();
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
	async shutDownLayer18Services() {
		this.logger.info(
			'Shutting down Layer 18 services: Resource Manager...'
		);
		try {
			await this.resourceManager.shutdown();
			this.logger.info('Layer 18 services have been shut down.');
		} catch (error) {
			this.handleHTTPSServerErrorRecoverable(
				error,
				'SHUTDOWN_LAYER_18',
				{},
				'Error shutting down Layer 18 services'
			);
		}
	}
	async shutDownLayer16Services() {
		this.logger.info(
			'Shutting down Layer 16 services: Mailer and Multer Upload Services...'
		);
		try {
			await Promise.all([
				this.mailerService.shutdown(),
				this.multerUploadService.shutdown()
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
			'Shutting down Layer 15 services: CSRF, Helmet, JWT Auth, and Passport Middlewares...'
		);
		try {
			await Promise.all([
				this.csrfMiddleware.shutdown(),
				this.helmetMiddleware.shutdown(),
				this.jwtAuthMiddlewareService.shutdown(),
				this.passportAuthMiddlewareService.shutdown()
			]);
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
			'Shutting down Layer 14 services: Backup Code, EmailMFA, FIDO2, JWT, Passport, TOTP, and Yubico OTP Services...'
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSFRUUFMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvc2VydmljZXMvSFRUUFMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxnQkFBZ0IsTUFBTSx3QkFBd0IsQ0FBQztBQUN0RCxPQUFPLEtBQUssTUFBTSxPQUFPLENBQUM7QUFJMUIsT0FBTyxFQUFFLFNBQVMsSUFBSSxlQUFlLEVBQUUsTUFBTSxRQUFRLENBQUM7QUFDdEQsT0FBTyxFQUFFLG9CQUFvQixFQUFFLE1BQU0sa0JBQWtCLENBQUM7QUFtQ3hELE9BQU8sRUFBRSxjQUFjLEVBQUUsTUFBTSxrQkFBa0IsQ0FBQztBQUNsRCxPQUFPLEVBQUUsVUFBVSxFQUFFLE1BQU0sb0JBQW9CLENBQUM7QUFFaEQsT0FBTyxPQUFPLE1BQU0saUJBQWlCLENBQUM7QUFFdEMsTUFBTSxPQUFPLFdBQVc7SUFDaEIsTUFBTSxDQUFDLFFBQVEsR0FBdUIsSUFBSSxDQUFDO0lBRTFDLHVCQUF1QixDQUEwQztJQUNqRSxjQUFjLENBQTBCO0lBQ3hDLGlCQUFpQixDQUE2QjtJQUM5QyxVQUFVLENBQXNCO0lBQ2hDLFlBQVksQ0FBd0I7SUFDcEMsY0FBYyxDQUFpQztJQUMvQyxrQkFBa0IsQ0FBOEI7SUFDaEQsZUFBZSxDQUEyQjtJQUMxQyxXQUFXLENBQThCO0lBQ3pDLFlBQVksQ0FBK0I7SUFDM0MsU0FBUyxDQUE0QjtJQUNyQyxZQUFZLENBQXdCO0lBQ3BDLGlCQUFpQixDQUE2QjtJQUM5QyxrQkFBa0IsQ0FBOEI7SUFDaEQsZ0JBQWdCLENBQW1DO0lBQ25ELHdCQUF3QixDQUFvQztJQUM1RCxVQUFVLENBQXNCO0lBQ2hDLE1BQU0sQ0FBNEI7SUFDbEMsYUFBYSxDQUF5QjtJQUN0Qyx1QkFBdUIsQ0FBbUM7SUFDMUQsbUJBQW1CLENBQStCO0lBQ2xELDZCQUE2QixDQUF5QztJQUN0RSxlQUFlLENBQTJCO0lBQzFDLGVBQWUsQ0FBMkI7SUFDMUMsWUFBWSxDQUF3QjtJQUNw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bC1zaHV0ZG93bic7XG5pbXBvcnQgaHR0cHMgZnJvbSAnaHR0cHMnO1xuaW1wb3J0IG5ldCBmcm9tICduZXQnO1xuaW1wb3J0IHsgU2VxdWVsaXplIH0gZnJvbSAnc2VxdWVsaXplJztcbmltcG9ydCB7IEFwcGxpY2F0aW9uIH0gZnJvbSAnZXhwcmVzcyc7XG5pbXBvcnQgeyBjb25zdGFudHMgYXMgY3J5cHRvQ29uc3RhbnRzIH0gZnJvbSAnY3J5cHRvJztcbmltcG9ydCB7IHZhbGlkYXRlRGVwZW5kZW5jaWVzIH0gZnJvbSAnLi4vdXRpbHMvaGVscGVycyc7XG5pbXBvcnQge1xuXHRBY2Nlc3NDb250cm9sTWlkZGxld2FyZVNlcnZpY2VJbnRlcmZhY2UsXG5cdEFwcExvZ2dlclNlcnZpY2VJbnRlcmZhY2UsXG5cdEF1dGhDb250cm9sbGVySW50ZXJmYWNlLFxuXHRCYWNrdXBDb2RlU2VydmljZUludGVyZmFjZSxcblx0QmFzZVJvdXRlckludGVyZmFjZSxcblx0Q2FjaGVTZXJ2aWNlSW50ZXJmYWNlLFxuXHRDU1JGTWlkZGxld2FyZVNlcnZpY2VJbnRlcmZhY2UsXG5cdERhdGFiYXNlQ29udHJvbGxlckludGVyZmFjZSxcblx0RW1haWxNRkFTZXJ2aWNlSW50ZXJmYWNlLFxuXHRFcnJvckhhbmRsZXJTZXJ2aWNlSW50ZXJmYWNlLFxuXHRFcnJvckxvZ2dlclNlcnZpY2VJbnRlcmZhY2UsXG5cdEVudkNvbmZpZ1NlcnZpY2VJbnRlcmZhY2UsXG5cdEZJRE8yU2VydmljZUludGVyZmFjZSxcblx0R2F0ZWtlZXBlclNlcnZpY2VJbnRlcmZhY2UsXG5cdEhlYWx0aENoZWNrU2VydmljZUludGVyZmFjZSxcblx0SGVsbWV0TWlkZGxld2FyZVNlcnZpY2VJbnRlcmZhY2UsXG5cdEhUVFBTU2VydmVySW50ZXJmYWNlLFxuXHRKV1RBdXRoTWlkZGxld2FyZVNlcnZpY2VJbnRlcmZhY2UsXG5cdEpXVFNlcnZpY2VJbnRlcmZhY2UsXG5cdE1haWxlclNlcnZpY2VJbnRlcmZhY2UsXG5cdE1pZGRsZXdhcmVTdGF0dXNTZXJ2aWNlSW50ZXJmYWNlLFxuXHRNdWx0ZXJVcGxvYWRTZXJ2aWNlSW50ZXJmYWNlLFxuXHRQYXNzcG9ydEF1dGhNaWRkbGV3YXJlU2VydmljZUludGVyZmFjZSxcblx0UGFzc3BvcnRTZXJ2aWNlSW50ZXJmYWNlLFxuXHRQYXNzd29yZFNlcnZpY2VJbnRlcmZhY2UsXG5cdFJlZGlzU2VydmljZUludGVyZmFjZSxcblx0UmVzb3VyY2VNYW5hZ2VySW50ZXJmYWNlLFxuXHRSb290TWlkZGxld2FyZVNlcnZpY2VJbnRlcmZhY2UsXG5cdFRPVFBTZXJ2aWNlSW50ZXJmYWNlLFxuXHRVc2VyQ29udHJvbGxlckludGVyZmFjZSxcblx0VmF1bHRTZXJ2aWNlSW50ZXJmYWNlLFxuXHRZdWJpY29PVFBTZXJ2aWNlSW50ZXJmYWNlXG59IGZyb20gJy4uL2luZGV4L2ludGVyZmFjZXMvc2VydmljZXMnO1xuaW1wb3J0IHsgU2VydmljZUZhY3RvcnkgfSBmcm9tICcuLi9pbmRleC9mYWN0b3J5JztcbmltcG9ydCB7IHRsc0NpcGhlcnMgfSBmcm9tICcuLi9jb25maWcvc2VjdXJpdHknO1xuaW1wb3J0IHsgU2VjdXJlQ29udGV4dE9wdGlvbnMgfSBmcm9tICd0bHMnO1xuaW1wb3J0IHRpbWVvdXQgZnJvbSAnY29ubmVjdC10aW1lb3V0JztcblxuZXhwb3J0IGNsYXNzIEhUVFBTU2VydmVyIGltcGxlbWVudHMgSFRUUFNTZXJ2ZXJJbnRlcmZhY2Uge1xuXHRwdWJsaWMgc3RhdGljIGluc3RhbmNlOiBIVFRQU1NlcnZlciB8IG51bGwgPSBudWxsO1xuXG5cdHByaXZhdGUgYWNjZXNzQ29udHJvbE1pZGRsZXdhcmU6IEFjY2Vzc0NvbnRyb2xNaWRkbGV3YXJlU2VydmljZUludGVyZmFjZTtcblx0cHJpdmF0ZSBhdXRoQ29udHJvbGxlcjogQXV0aENvbnRyb2xsZXJJbnRlcmZhY2U7XG5cdHByaXZhdGUgYmFja3VwQ29kZVNlcnZpY2U6IEJhY2t1cENvZGVTZXJ2aWNlSW50ZXJmYWNlO1xuXHRwcml2YXRlIGJhc2VSb3V0ZXI6IEJhc2VSb3V0ZXJJbnRlcmZhY2U7XG5cdHByaXZhdGUgY2FjaGVTZXJ2aWNlOiBDYWNoZVNlcnZpY2VJbnRlcmZhY2U7XG5cdHByaXZhdGUgY3NyZk1pZGRsZXdhcmU6IENTUkZNaWRkbGV3YXJlU2VydmljZUludGVyZmFjZTtcblx0cHJpdmF0ZSBkYXRhYmFzZUNvbnRyb2xsZXI6IERhdGFiYXNlQ29udHJvbGxlckludGVyZmFjZTtcblx0cHJpdmF0ZSBlbWFpbE1GQVNlcnZpY2U6IEVtYWlsTUZBU2VydmljZUludGVyZmFjZTtcblx0cHJpdmF0ZSBlcnJvckxvZ2dlcjogRXJyb3JMb2dnZXJTZXJ2aWNlSW50ZXJmYWNlO1xuXHRwcml2YXRlIGVycm9ySGFuZGxlcjogRXJyb3JIYW5kbGVyU2VydmljZUludGVyZmFjZTtcblx0cHJpdmF0ZSBlbnZDb25maWc6IEVudkNvbmZpZ1NlcnZpY2VJbnRlcmZhY2U7XG5cdHByaXZhdGUgZmlkbzJTZXJ2aWNlOiBGSURPMlNlcnZpY2VJbnRlcmZhY2U7XG5cdHByaXZhdGUgZ2F0ZWtlZXBlclNlcnZpY2U6IEdhdGVrZWVwZXJTZXJ2aWNlSW50ZXJmYWNlO1xuXHRwcml2YXRlIGhlYWx0aENoZWNrU2VydmljZTogSGVhbHRoQ2hlY2tTZXJ2aWNlSW50ZXJmYWNlO1xuXHRwcml2YXRlIGhlbG1ldE1pZGRsZXdhcmU6IEhlbG1ldE1pZGRsZXdhcmVTZXJ2aWNlSW50ZXJmYWNlO1xuXHRwcml2YXRlIGp3dEF1dGhNaWRkbGV3YXJlU2VydmljZTogSldUQXV0aE1pZGRsZXdhcmVTZXJ2aWNlSW50ZXJmYWNlO1xuXHRwcml2YXRlIGp3dFNlcnZpY2U6IEpXVFNlcnZpY2VJbnRlcmZhY2U7XG5cdHByaXZhdGUgbG9nZ2VyOiBBcHBMb2dnZXJTZXJ2aWNlSW50ZXJmYWNlO1xuXHRwcml2YXRlIG1haWxlclNlcnZpY2U6IE1haWxlclNlcnZpY2VJbnRlcmZhY2U7XG5cdHByaXZhdGUgbWlkZGxld2FyZVN0YXR1c1NlcnZpY2U6IE1pZGRsZXdhcmVTdGF0dXNTZXJ2aWNlSW50ZXJmYWNlO1xuXHRwcml2YXRlIG11bHRlclVwbG9hZFNlcnZpY2U6IE11bHRlclVwbG9hZFNlcnZpY2VJbnRlcmZhY2U7XG5cdHByaXZhdGUgcGFzc3BvcnRBdXRoTWlkZGxld2FyZVNlcnZpY2U6IFBhc3Nwb3J0QXV0aE1pZGRsZXdhcmVTZXJ2aWNlSW50ZXJmYWNlO1xuXHRwcml2YXRlIHBhc3Nwb3J0U2VydmljZTogUGFzc3BvcnRTZXJ2aWNlSW50ZXJmYWNlO1xuXHRwcml2YXRlIHBhc3N3b3JkU2VydmljZTogUGFzc3dvcmRTZXJ2aWNlSW50ZXJmYWNlO1xuXHRwcml2YXRlIHJlZGlzU2VydmljZTogUmVkaXNTZXJ2aWNlSW50ZXJmYWNlO1xuXHRwcml2YXRlIHJlc291cmNlTWFuYWdlcjogUmVzb3VyY2VNYW5hZ2VySW50ZXJmYWNlO1xuXHRwcml2YXRlIHJvb3RNaWRkbGV3YXJlU2VydmljZTogUm9vdE1pZGRsZXdhcmVTZXJ2aWNlSW50ZXJmYWNlO1xuXHRwcml2YXRlIHRvdHBTZXJ2aWNlOiBUT1RQU2VydmljZUludGVyZmFjZTtcblx0cHJpdmF0ZSB1c2VyQ29udHJvbGxlcjogVXNlckNvbnRyb2xsZXJJbnRlcmZhY2U7XG5cdHByaXZhdGUgdmF1bHQ6IFZhdWx0U2VydmljZUludGVyZmFjZTtcblx0cHJpdmF0ZSB5dWJpY29PVFBTZXJ2aWNlOiBZdWJpY29PVFBTZXJ2aWNlSW50ZXJmYWNlO1xuXG5cdHByaXZhdGUgc2VydmVyOiBodHRwcy5TZXJ2ZXIgfCBudWxsID0gbnVsbDtcblx0cHJpdmF0ZSBhcHA6IEFwcGxpY2F0aW9uO1xuXHRwcml2YXRlIHNlcXVlbGl6ZTogU2VxdWVsaXplO1xuXHRwcml2YXRlIHNodXR0aW5nRG93biA9IGZhbHNlO1xuXHRwcml2YXRlIGNvbm5lY3Rpb25zOiBTZXQ8bmV0LlNvY2tldD4gPSBuZXcgU2V0KCk7XG5cdHByaXZhdGUgb3B0aW9uczogU2VjdXJlQ29udGV4dE9wdGlvbnMgfCB1bmRlZmluZWQ7XG5cdHByaXZhdGUgcG9ydDogbnVtYmVyO1xuXHRwcml2YXRlIHJlcXVlc3RUaW1lb3V0OiBzdHJpbmc7XG5cdHByaXZhdGUgc2h1dGRvd25UaW1lb3V0OiBudW1iZXI7XG5cblx0cHJpdmF0ZSBjb25zdHJ1Y3Rvcihcblx0XHRhcHA6IEFwcGxpY2F0aW9uLFxuXHRcdHNlcXVlbGl6ZTogU2VxdWVsaXplLFxuXHRcdGxvZ2dlcjogQXBwTG9nZ2VyU2VydmljZUludGVyZmFjZSxcblx0XHRlcnJvckxvZ2dlcjogRXJyb3JMb2dnZXJTZXJ2aWNlSW50ZXJmYWNlLFxuXHRcdGVycm9ySGFuZGxlcjogRXJyb3JIYW5kbGVyU2VydmljZUludGVyZmFjZSxcblx0XHRlbnZDb25maWc6IEVudkNvbmZpZ1NlcnZpY2VJbnRlcmZhY2UsXG5cdFx0Y2FjaGVTZXJ2aWNlOiBDYWNoZVNlcnZpY2VJbnRlcmZhY2UsXG5cdFx0cmVkaXNTZXJ2aWNlOiBSZWRpc1NlcnZpY2VJbnRlcmZhY2UsXG5cdFx0cmVzb3VyY2VNYW5hZ2VyOiBSZXNvdXJjZU1hbmFnZXJJbnRlcmZhY2UsXG5cdFx0aGVhbHRoQ2hlY2tTZXJ2aWNlOiBIZWFsdGhDaGVja1NlcnZpY2VJbnRlcmZhY2UsXG5cdFx0aGVsbWV0TWlkZGxld2FyZTogSGVsbWV0TWlkZGxld2FyZVNlcnZpY2VJbnRlcmZhY2UsXG5cdFx0and0QXV0aE1pZGRsZXdhcmVTZXJ2aWNlOiBKV1RBdXRoTWlkZGxld2FyZVNlcnZpY2VJbnRlcmZhY2UsXG5cdFx0cGFzc3BvcnRBdXRoTWlkZGxld2FyZVNlcnZpY2U6IFBhc3Nwb3J0QXV0aE1pZGRsZXdhcmVTZXJ2aWNlSW50ZXJmYWNlLFxuXHRcdGFjY2Vzc0NvbnRyb2xNaWRkbGV3YXJlOiBBY2Nlc3NDb250cm9sTWlkZGxld2FyZVNlcnZpY2VJbnRlcmZhY2UsXG5cdFx0YXV0aENvbnJvbGxlcjogQXV0aENvbnRyb2xsZXJJbnRlcmZhY2UsXG5cdFx0YmFja3VwQ29kZVNlcnZpY2U6IEJhY2t1cENvZGVTZXJ2aWNlSW50ZXJmYWNlLFxuXHRcdGJhc2VSb3V0ZXI6IEJhc2VSb3V0ZXJJbnRlcmZhY2UsXG5cdFx0Y3NyZk1pZGRsZXdhcmU6IENTUkZNaWRkbGV3YXJlU2VydmljZUludGVyZmFjZSxcblx0XHRkYXRhYmFzZUNvbnRyb2xsZXI6IERhdGFiYXNlQ29udHJvbGxlckludGVyZmFjZSxcblx0XHRlbWFpbE1GQVNlcnZpY2U6IEVtYWlsTUZBU2VydmljZUludGVyZmFjZSxcblx0XHRmaWRvMlNlcnZpY2U6IEZJRE8yU2VydmljZUludGVyZmFjZSxcblx0XHRnYXRla2VlcGVyU2VydmljZTogR2F0ZWtlZXBlclNlcnZpY2VJbnRlcmZhY2UsXG5cdFx0and0U2VydmljZTogSldUU2VydmljZUludGVyZmFjZSxcblx0XHRtYWlsZXJTZXJ2aWNlOiBNYWlsZXJTZXJ2aWNlSW50ZXJmYWNlLFxuXHRcdG1pZGRsZXdhcmVTdGF0dXNTZXJ2aWNlOiBNaWRkbGV3YXJlU3RhdHVzU2VydmljZUludGVyZmFjZSxcblx0XHRtdWx0ZXJVcGxvYWRTZXJ2aWNlOiBNdWx0ZXJVcGxvYWRTZXJ2aWNlSW50ZXJmYWNlLFxuXHRcdHBhc3Nwb3J0U2VydmljZTogUGFzc3BvcnRTZXJ2aWNlSW50ZXJmYWNlLFxuXHRcdHBhc3N3b3JkU2VydmljZTogUGFzc3dvcmRTZXJ2aWNlSW50ZXJmYWNlLFxuXHRcdHJvb3RNaWRkbGV3YXJlU2VydmljZTogUm9vdE1pZGRsZXdhcmVTZXJ2aWNlSW50ZXJmYWNlLFxuXHRcdHRvdHBTZXJ2aWNlOiBUT1RQU2VydmljZUludGVyZmFjZSxcblx0XHR1c2VyQ29udHJvbGxlcjogVXNlckNvbnRyb2xsZXJJbnRlcmZhY2UsXG5cdFx0dmF1bHQ6IFZhdWx0U2VydmljZUludGVyZmFjZSxcblx0XHR5dWJpY29PVFBTZXJ2aWNlOiBZdWJpY29PVFBTZXJ2aWNlSW50ZXJmYWNlXG5cdCkge1xuXHRcdHRoaXMuYXBwID0gYXBwO1xuXHRcdHRoaXMuc2VxdWVsaXplID0gc2VxdWVsaXplO1xuXHRcdHRoaXMubG9nZ2VyID0gbG9nZ2VyO1xuXHRcdHRoaXMuZXJyb3JMb2dnZXIgPSBlcnJvckxvZ2dlcjtcblx0XHR0aGlzLmVycm9ySGFuZGxlciA9IGVycm9ySGFuZGxlcjtcblx0XHR0aGlzLmVudkNvbmZpZyA9IGVudkNvbmZpZztcblx0XHR0aGlzLmNhY2hlU2VydmljZSA9IGNhY2hlU2VydmljZTtcblx0XHR0aGlzLnJlZGlzU2VydmljZSA9IHJlZGlzU2VydmljZTtcblx0XHR0aGlzLnJlc291cmNlTWFuYWdlciA9IHJlc291cmNlTWFuYWdlcjtcblx0XHR0aGlzLmhlYWx0aENoZWNrU2VydmljZSA9IGhlYWx0aENoZWNrU2VydmljZTtcblx0XHR0aGlzLmhlbG1ldE1pZGRsZXdhcmUgPSBoZWxtZXRNaWRkbGV3YXJlO1xuXHRcdHRoaXMuand0QXV0aE1pZGRsZXdhcmVTZXJ2aWNlID0gand0QXV0aE1pZGRsZXdhcmVTZXJ2aWNlO1xuXHRcdHRoaXMucGFzc3BvcnRBdXRoTWlkZGxld2FyZVNlcnZpY2UgPSBwYXNzcG9ydEF1dGhNaWRkbGV3YXJlU2VydmljZTtcblx0XHR0aGlzLmFjY2Vzc0NvbnRyb2xNaWRkbGV3YXJlID0gYWNjZXNzQ29udHJvbE1pZGRsZXdhcmU7XG5cdFx0dGhpcy5hdXRoQ29udHJvbGxlciA9IGF1dGhDb25yb2xsZXI7XG5cdFx0dGhpcy5iYWNrdXBDb2RlU2VydmljZSA9IGJhY2t1cENvZGVTZXJ2aWNlO1xuXHRcdHRoaXMuYmFzZVJvdXRlciA9IGJhc2VSb3V0ZXI7XG5cdFx0dGhpcy5jc3JmTWlkZGxld2FyZSA9IGNzcmZNaWRkbGV3YXJlO1xuXHRcdHRoaXMuZGF0YWJhc2VDb250cm9sbGVyID0gZGF0YWJhc2VDb250cm9sbGVyO1xuXHRcdHRoaXMuZW1haWxNRkFTZXJ2aWNlID0gZW1haWxNRkFTZXJ2aWNlO1xuXHRcdHRoaXMuZmlkbzJTZXJ2aWNlID0gZmlkbzJTZXJ2aWNlO1xuXHRcdHRoaXMuZ2F0ZWtlZXBlclNlcnZpY2UgPSBnYXRla2VlcGVyU2VydmljZTtcblx0XHR0aGlzLmp3dFNlcnZpY2UgPSBqd3RTZXJ2aWNlO1xuXHRcdHRoaXMubWFpbGVyU2VydmljZSA9IG1haWxlclNlcnZpY2U7XG5cdFx0dGhpcy5taWRkbGV3YXJlU3RhdHVzU2VydmljZSA9IG1pZGRsZXdhcmVTdGF0dXNTZXJ2aWNlO1xuXHRcdHRoaXMubXVsdGVyVXBsb2FkU2VydmljZSA9IG11bHRlclVwbG9hZFNlcnZpY2U7XG5cdFx0dGhpcy5wYXNzcG9ydFNlcnZpY2UgPSBwYXNzcG9ydFNlcnZpY2U7XG5cdFx0dGhpcy5wYXNzd29yZFNlcnZpY2UgPSBwYXNzd29yZFNlcnZpY2U7XG5cdFx0dGhpcy5yb290TWlkZGxld2FyZVNlcnZpY2UgPSByb290TWlkZGxld2FyZVNlcnZpY2U7XG5cdFx0dGhpcy50b3RwU2VydmljZSA9IHRvdHBTZXJ2aWNlO1xuXHRcdHRoaXMudXNlckNvbnRyb2xsZXIgPSB1c2VyQ29udHJvbGxlcjtcblx0XHR0aGlzLnZhdWx0ID0gdmF1bHQ7XG5cdFx0dGhpcy55dWJpY29PVFBTZXJ2aWNlID0geXViaWNvT1RQU2VydmljZTtcblxuXHRcdHRoaXMucG9ydCA9IHRoaXMuZW52Q29uZmlnLmdldEVudlZhcmlhYmxlKCdzZXJ2ZXJQb3J0Jyk7XG5cdFx0dGhpcy5yZXF1ZXN0VGltZW91dCA9XG5cdFx0XHR0aGlzLmVudkNvbmZpZy5nZXRFbnZWYXJpYWJsZSgncmVxdWVzdFRpbWVvdXQnKSB8fCAnMzBzJztcblx0XHR0aGlzLnNodXRkb3duVGltZW91dCA9XG5cdFx0XHR0aGlzLmVudkNvbmZpZy5nZXRFbnZWYXJpYWJsZSgnZ3JhY2VmdWxTaHV0ZG93blRpbWVvdXQnKSB8fCAzMDAwMDtcblxuXHRcdHRoaXMuaW5pdGlhbGl6ZVNlcnZpY2VzKCk7XG5cblx0XHRzZXRJbnRlcnZhbCgoKSA9PiB7XG5cdFx0XHR0aGlzLmhlYWx0aENoZWNrU2VydmljZS5wZXJmb3JtSGVhbHRoQ2hlY2soKTtcblx0XHR9LCAxMDAwMCk7XG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIGluaXRpYWxpemVTZXJ2aWNlcygpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHR0aGlzLmFjY2Vzc0NvbnRyb2xNaWRkbGV3YXJlID1cblx0XHRcdGF3YWl0IFNlcnZpY2VGYWN0b3J5LmdldEFjY2Vzc0NvbnRyb2xNaWRkbGV3YXJlU2VydmljZSgpO1xuXHRcdHRoaXMuYXV0aENvbnRyb2xsZXIgPSBhd2FpdCBTZXJ2aWNlRmFjdG9yeS5nZXRBdXRoQ29udHJvbGxlcigpO1xuXHRcdHRoaXMuYmFja3VwQ29kZVNlcnZpY2UgPSBhd2FpdCBTZXJ2aWNlRmFjdG9yeS5nZXRCYWNrdXBDb2RlU2VydmljZSgpO1xuXHRcdHRoaXMuYmFzZVJvdXRlciA9IGF3YWl0IFNlcnZpY2VGYWN0b3J5LmdldEJhc2VSb3V0ZXIoKTtcblx0XHR0aGlzLmNzcmZNaWRkbGV3YXJlID0gYXdhaXQgU2VydmljZUZhY3RvcnkuZ2V0Q1NSRk1pZGRsZXdhcmVTZXJ2aWNlKCk7XG5cdFx0dGhpcy5kYXRhYmFzZUNvbnRyb2xsZXIgPSBhd2FpdCBTZXJ2aWNlRmFjdG9yeS5nZXREYXRhYmFzZUNvbnRyb2xsZXIoKTtcblx0XHR0aGlzLmVtYWlsTUZBU2VydmljZSA9IGF3YWl0IFNlcnZpY2VGYWN0b3J5LmdldEVtYWlsTUZBU2VydmljZSgpO1xuXHRcdHRoaXMuZmlkbzJTZXJ2aWNlID0gYXdhaXQgU2VydmljZUZhY3RvcnkuZ2V0RklETzJTZXJ2aWNlKCk7XG5cdFx0dGhpcy5nYXRla2VlcGVyU2VydmljZSA9IGF3YWl0IFNlcnZpY2VGYWN0b3J5LmdldEdhdGVrZWVwZXJTZXJ2aWNlKCk7XG5cdFx0dGhpcy5taWRkbGV3YXJlU3RhdHVzU2VydmljZSA9XG5cdFx0XHRhd2FpdCBTZXJ2aWNlRmFjdG9yeS5nZXRNaWRkbGV3YXJlU3RhdHVzU2VydmljZSgpO1xuXHRcdHRoaXMubXVsdGVyVXBsb2FkU2VydmljZSA9XG5cdFx0XHRhd2FpdCBTZXJ2aWNlRmFjdG9yeS5nZXRNdWx0ZXJVcGxvYWRTZXJ2aWNlKCk7XG5cdFx0dGhpcy5wYXNzcG9ydFNlcnZpY2UgPSBhd2FpdCBTZXJ2aWNlRmFjdG9yeS5nZXRQYXNzcG9ydFNlcnZpY2UoKTtcblx0XHR0aGlzLnBhc3N3b3JkU2VydmljZSA9IGF3YWl0IFNlcnZpY2VGYWN0b3J5LmdldFBhc3N3b3JkU2VydmljZSgpO1xuXHRcdHRoaXMudmF1bHQgPSBhd2FpdCBTZXJ2aWNlRmFjdG9yeS5nZXRWYXVsdFNlcnZpY2UoKTtcblx0XHR0aGlzLnl1Ymljb09UUFNlcnZpY2UgPSBhd2FpdCBTZXJ2aWNlRmFjdG9yeS5nZXRZdWJpY29PVFBTZXJ2aWNlKCk7XG5cdH1cblxuXHRwdWJsaWMgc3RhdGljIGFzeW5jIGdldEluc3RhbmNlKFxuXHRcdGFwcDogQXBwbGljYXRpb24sXG5cdFx0c2VxdWVsaXplOiBTZXF1ZWxpemVcblx0KTogUHJvbWlzZTxIVFRQU1NlcnZlcj4ge1xuXHRcdGlmICghSFRUUFNTZXJ2ZXIuaW5zdGFuY2UpIHtcblx0XHRcdGNvbnN0IGxvZ2dlciA9IGF3YWl0IFNlcnZpY2VGYWN0b3J5LmdldExvZ2dlclNlcnZpY2UoKTtcblx0XHRcdGNvbnN0IGVycm9yTG9nZ2VyID0gYXdhaXQgU2VydmljZUZhY3RvcnkuZ2V0RXJyb3JMb2dnZXJTZXJ2aWNlKCk7XG5cdFx0XHRjb25zdCBlcnJvckhhbmRsZXIgPSBhd2FpdCBTZXJ2aWNlRmFjdG9yeS5nZXRFcnJvckhhbmRsZXJTZXJ2aWNlKCk7XG5cdFx0XHRjb25zdCBlbnZDb25maWcgPSBhd2FpdCBTZXJ2aWNlRmFjdG9yeS5nZXRFbnZDb25maWdTZXJ2aWNlKCk7XG5cdFx0XHRjb25zdCBjYWNoZVNlcnZpY2UgPSBhd2FpdCBTZXJ2aWNlRmFjdG9yeS5nZXRDYWNoZVNlcnZpY2UoKTtcblx0XHRcdGNvbnN0IHJlZGlzU2VydmljZSA9IGF3YWl0IFNlcnZpY2VGYWN0b3J5LmdldFJlZGlzU2VydmljZSgpO1xuXHRcdFx0Y29uc3QgcmVzb3VyY2VNYW5hZ2VyID0gYXdhaXQgU2VydmljZUZhY3RvcnkuZ2V0UmVzb3VyY2VNYW5hZ2VyKCk7XG5cdFx0XHRjb25zdCBoZWFsdGhDaGVja1NlcnZpY2UgPVxuXHRcdFx0XHRhd2FpdCBTZXJ2aWNlRmFjdG9yeS5nZXRIZWFsdGhDaGVja1NlcnZpY2UoKTtcblx0XHRcdGNvbnN0IGhlbG1ldE1pZGRsZXdhcmUgPVxuXHRcdFx0XHRhd2FpdCBTZXJ2aWNlRmFjdG9yeS5nZXRIZWxtZXRNaWRkbGV3YXJlU2VydmljZSgpO1xuXHRcdFx0Y29uc3Qgand0QXV0aE1pZGRsZXdhcmVTZXJ2aWNlID1cblx0XHRcdFx0YXdhaXQgU2VydmljZUZhY3RvcnkuZ2V0SldUQXV0aE1pZGRsZXdhcmVTZXJ2aWNlKCk7XG5cdFx0XHRjb25zdCBwYXNzcG9ydEF1dGhNaWRkbGV3YXJlU2VydmljZSA9XG5cdFx0XHRcdGF3YWl0IFNlcnZpY2VGYWN0b3J5LmdldFBhc3Nwb3J0QXV0aE1pZGRsZXdhcmVTZXJ2aWNlKCk7XG5cdFx0XHRjb25zdCBhY2Nlc3NDb250cm9sTWlkZGxld2FyZSA9XG5cdFx0XHRcdGF3YWl0IFNlcnZpY2VGYWN0b3J5LmdldEFjY2Vzc0NvbnRyb2xNaWRkbGV3YXJlU2VydmljZSgpO1xuXHRcdFx0Y29uc3QgYXV0aENvbnJvbGxlciA9IGF3YWl0IFNlcnZpY2VGYWN0b3J5LmdldEF1dGhDb250cm9sbGVyKCk7XG5cdFx0XHRjb25zdCBiYWNrdXBDb2RlU2VydmljZSA9XG5cdFx0XHRcdGF3YWl0IFNlcnZpY2VGYWN0b3J5LmdldEJhY2t1cENvZGVTZXJ2aWNlKCk7XG5cdFx0XHRjb25zdCBiYXNlUm91dGVyID0gYXdhaXQgU2VydmljZUZhY3RvcnkuZ2V0QmFzZVJvdXRlcigpO1xuXHRcdFx0Y29uc3QgY3NyZk1pZGRsZXdhcmUgPVxuXHRcdFx0XHRhd2FpdCBTZXJ2aWNlRmFjdG9yeS5nZXRDU1JGTWlkZGxld2FyZVNlcnZpY2UoKTtcblx0XHRcdGNvbnN0IGRhdGFiYXNlQ29udHJvbGxlciA9XG5cdFx0XHRcdGF3YWl0IFNlcnZpY2VGYWN0b3J5LmdldERhdGFiYXNlQ29udHJvbGxlcigpO1xuXHRcdFx0Y29uc3QgZW1haWxNRkFTZXJ2aWNlID0gYXdhaXQgU2VydmljZUZhY3RvcnkuZ2V0RW1haWxNRkFTZXJ2aWNlKCk7XG5cdFx0XHRjb25zdCBmaWRvMlNlcnZpY2UgPSBhd2FpdCBTZXJ2aWNlRmFjdG9yeS5nZXRGSURPMlNlcnZpY2UoKTtcblx0XHRcdGNvbnN0IGdhdGVrZWVwZXJTZXJ2aWNlID1cblx0XHRcdFx0YXdhaXQgU2VydmljZUZhY3RvcnkuZ2V0R2F0ZWtlZXBlclNlcnZpY2UoKTtcblx0XHRcdGNvbnN0IGp3dFNlcnZpY2UgPSBhd2FpdCBTZXJ2aWNlRmFjdG9yeS5nZXRKV1RTZXJ2aWNlKCk7XG5cdFx0XHRjb25zdCBtYWlsZXJTZXJ2aWNlID0gYXdhaXQgU2VydmljZUZhY3RvcnkuZ2V0TWFpbGVyU2VydmljZSgpO1xuXHRcdFx0Y29uc3QgbWlkZGxld2FyZVN0YXR1c1NlcnZpY2UgPVxuXHRcdFx0XHRhd2FpdCBTZXJ2aWNlRmFjdG9yeS5nZXRNaWRkbGV3YXJlU3RhdHVzU2VydmljZSgpO1xuXHRcdFx0Y29uc3QgbXVsdGVyVXBsb2FkU2VydmljZSA9XG5cdFx0XHRcdGF3YWl0IFNlcnZpY2VGYWN0b3J5LmdldE11bHRlclVwbG9hZFNlcnZpY2UoKTtcblx0XHRcdGNvbnN0IHBhc3Nwb3J0U2VydmljZSA9IGF3YWl0IFNlcnZpY2VGYWN0b3J5LmdldFBhc3Nwb3J0U2VydmljZSgpO1xuXHRcdFx0Y29uc3QgcGFzc3dvcmRTZXJ2aWNlID0gYXdhaXQgU2VydmljZUZhY3RvcnkuZ2V0UGFzc3dvcmRTZXJ2aWNlKCk7XG5cdFx0XHRjb25zdCByb290TWlkZGxld2FyZVNlcnZpY2UgPVxuXHRcdFx0XHRhd2FpdCBTZXJ2aWNlRmFjdG9yeS5nZXRSb290TWlkZGxld2FyZVNlcnZpY2UoKTtcblx0XHRcdGNvbnN0IHRvdHBTZXJ2aWNlID0gYXdhaXQgU2VydmljZUZhY3RvcnkuZ2V0VE9UUFNlcnZpY2UoKTtcblx0XHRcdGNvbnN0IHVzZXJDb250cm9sbGVyID0gYXdhaXQgU2VydmljZUZhY3RvcnkuZ2V0VXNlckNvbnRyb2xsZXIoKTtcblx0XHRcdGNvbnN0IHZhdWx0ID0gYXdhaXQgU2VydmljZUZhY3RvcnkuZ2V0VmF1bHRTZXJ2aWNlKCk7XG5cdFx0XHRjb25zdCB5dWJpY29PVFBTZXJ2aWNlID0gYXdhaXQgU2VydmljZUZhY3RvcnkuZ2V0WXViaWNvT1RQU2VydmljZSgpO1xuXG5cdFx0XHRIVFRQU1NlcnZlci5pbnN0YW5jZSA9IG5ldyBIVFRQU1NlcnZlcihcblx0XHRcdFx0YXBwLFxuXHRcdFx0XHRzZXF1ZWxpemUsXG5cdFx0XHRcdGxvZ2dlcixcblx0XHRcdFx0ZXJyb3JMb2dnZXIsXG5cdFx0XHRcdGVycm9ySGFuZGxlcixcblx0XHRcdFx0ZW52Q29uZmlnLFxuXHRcdFx0XHRjYWNoZVNlcnZpY2UsXG5cdFx0XHRcdHJlZGlzU2VydmljZSxcblx0XHRcdFx0cmVzb3VyY2VNYW5hZ2VyLFxuXHRcdFx0XHRoZWFsdGhDaGVja1NlcnZpY2UsXG5cdFx0XHRcdGhlbG1ldE1pZGRsZXdhcmUsXG5cdFx0XHRcdGp3dEF1dGhNaWRkbGV3YXJlU2VydmljZSxcblx0XHRcdFx0cGFzc3BvcnRBdXRoTWlkZGxld2FyZVNlcnZpY2UsXG5cdFx0XHRcdGFjY2Vzc0NvbnRyb2xNaWRkbGV3YXJlLFxuXHRcdFx0XHRhdXRoQ29ucm9sbGVyLFxuXHRcdFx0XHRiYWNrdXBDb2RlU2VydmljZSxcblx0XHRcdFx0YmFzZVJvdXRlcixcblx0XHRcdFx0Y3NyZk1pZGRsZXdhcmUsXG5cdFx0XHRcdGRhdGFiYXNlQ29udHJvbGxlcixcblx0XHRcdFx0ZW1haWxNRkFTZXJ2aWNlLFxuXHRcdFx0XHRmaWRvMlNlcnZpY2UsXG5cdFx0XHRcdGdhdGVrZWVwZXJTZXJ2aWNlLFxuXHRcdFx0XHRqd3RTZXJ2aWNlLFxuXHRcdFx0XHRtYWlsZXJTZXJ2aWNlLFxuXHRcdFx0XHRtaWRkbGV3YXJlU3RhdHVzU2VydmljZSxcblx0XHRcdFx0bXVsdGVyVXBsb2FkU2VydmljZSxcblx0XHRcdFx0cGFzc3BvcnRTZXJ2aWNlLFxuXHRcdFx0XHRwYXNzd29yZFNlcnZpY2UsXG5cdFx0XHRcdHJvb3RNaWRkbGV3YXJlU2VydmljZSxcblx0XHRcdFx0dG90cFNlcnZpY2UsXG5cdFx0XHRcdHVzZXJDb250cm9sbGVyLFxuXHRcdFx0XHR2YXVsdCxcblx0XHRcdFx0eXViaWNvT1RQU2VydmljZVxuXHRcdFx0KTtcblx0XHR9XG5cblx0XHRyZXR1cm4gSFRUUFNTZXJ2ZXIuaW5zdGFuY2U7XG5cdH1cblxuXHRwdWJsaWMgYXN5bmMgaW5pdGlhbGl6ZSgpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHR0cnkge1xuXHRcdFx0dGhpcy5sb2dnZXIuZGVidWcoJ0luaXRpYWxpemluZyB0aGUgd2ViIHNlcnZlci4uLicpO1xuXHRcdFx0dmFsaWRhdGVEZXBlbmRlbmNpZXMoXG5cdFx0XHRcdFt7IG5hbWU6ICdzZXF1ZWxpemUnLCBpbnN0YW5jZTogdGhpcy5zZXF1ZWxpemUgfV0sXG5cdFx0XHRcdHRoaXMubG9nZ2VyXG5cdFx0XHQpO1xuXG5cdFx0XHR0aGlzLm9wdGlvbnMgPSBhd2FpdCB0aGlzLmRlY2xhcmVIVFRQU1NlcnZlck9wdGlvbnMoKTtcblxuXHRcdFx0YXdhaXQgdGhpcy5tb3VudFJvdXRlcnMoKTtcblxuXHRcdFx0dGhpcy5lcnJvckhhbmRsZXIuc2V0U2h1dGRvd25IYW5kbGVyKCgpID0+IHRoaXMuc2h1dGRvd25TZXJ2ZXIoKSk7XG5cblx0XHRcdGF3YWl0IHRoaXMuc3RhcnRTZXJ2ZXIoKTtcblx0XHR9IGNhdGNoIChlcnJvcikge1xuXHRcdFx0dGhpcy5oYW5kbGVIVFRQU1NlcnZlckVycm9yRmF0YWwoXG5cdFx0XHRcdGVycm9yLFxuXHRcdFx0XHQnSU5JVElBTElaRV9TRVJWRVInLFxuXHRcdFx0XHR7fSxcblx0XHRcdFx0J0Vycm9yIGluaXRpYWxpemluZyB0aGUgd2ViIHNlcnZlcidcblx0XHRcdCk7XG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyBtb3VudFJvdXRlcnMoKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0Y29uc3QgYmFzZVJvdXRlciA9IGF3YWl0IHRoaXMuYmFzZVJvdXRlcjtcblxuXHRcdHRoaXMuYXBwLnVzZSgnLycsIGJhc2VSb3V0ZXIuZ2V0Um91dGVyKCkpO1xuXG5cdFx0dGhpcy5sb2dnZXIuaW5mbygnUm91dGVycyBoYXZlIGJlZW4gbW91bnRlZC4nKTtcblxuXHRcdHRoaXMuYXBwLnVzZSh0aW1lb3V0KHRoaXMucmVxdWVzdFRpbWVvdXQpKTtcblxuXHRcdHRoaXMuYXBwLnVzZSgocmVxLCByZXMsIG5leHQpID0+IHtcblx0XHRcdGlmIChyZXEudGltZWRvdXQpIHtcblx0XHRcdFx0dGhpcy5sb2dnZXIud2Fybihcblx0XHRcdFx0XHRgUmVxdWVzdCB0aW1lZCBvdXQgZm9yIFVSTDogJHtyZXEub3JpZ2luYWxVcmx9YFxuXHRcdFx0XHQpO1xuXHRcdFx0XHRyZXMuc3RhdHVzKDUwMykuanNvbih7IG1lc3NhZ2U6ICdSZXF1ZXN0IHRpbWVkIG91dCcgfSk7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblx0XHRcdG5leHQoKTtcblx0XHR9KTtcblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgZGVjbGFyZUhUVFBTU2VydmVyT3B0aW9ucygpOiBQcm9taXNlPFNlY3VyZUNvbnRleHRPcHRpb25zPiB7XG5cdFx0dHJ5IHtcblx0XHRcdHZhbGlkYXRlRGVwZW5kZW5jaWVzKFxuXHRcdFx0XHRbeyBuYW1lOiAndGxzQ2lwaGVycycsIGluc3RhbmNlOiB0bHNDaXBoZXJzIH1dLFxuXHRcdFx0XHR0aGlzLmxvZ2dlclxuXHRcdFx0KTtcblxuXHRcdFx0Y29uc3QgdGxzS2V5UGF0aDEgPSB0aGlzLmVudkNvbmZpZy5nZXRFbnZWYXJpYWJsZSgndGxzS2V5UGF0aDEnKTtcblx0XHRcdGNvbnN0IHRsc0NlcnRQYXRoMSA9IHRoaXMuZW52Q29uZmlnLmdldEVudlZhcmlhYmxlKCd0bHNDZXJ0UGF0aDEnKTtcblxuXHRcdFx0aWYgKFxuXHRcdFx0XHR0eXBlb2YgdGxzS2V5UGF0aDEgIT09ICdzdHJpbmcnIHx8XG5cdFx0XHRcdHR5cGVvZiB0bHNDZXJ0UGF0aDEgIT09ICdzdHJpbmcnXG5cdFx0XHQpIHtcblx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKCdUTFMga2V5IG9yIGNlcnRpZmljYXRlIHBhdGggaXMgbm90IGEgc3RyaW5nJyk7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdGtleTogdGxzS2V5UGF0aDEsXG5cdFx0XHRcdGNlcnQ6IHRsc0NlcnRQYXRoMSxcblx0XHRcdFx0c2VjdXJlT3B0aW9uczpcblx0XHRcdFx0XHRjcnlwdG9Db25zdGFudHMuU1NMX09QX05PX1RMU3YxIHxcblx0XHRcdFx0XHRjcnlwdG9Db25zdGFudHMuU1NMX09QX05PX1RMU3YxXzEsXG5cdFx0XHRcdGNpcGhlcnM6IHRsc0NpcGhlcnMuam9pbignOicpLFxuXHRcdFx0XHRob25vckNpcGhlck9yZGVyOlxuXHRcdFx0XHRcdHRoaXMuZW52Q29uZmlnLmdldEZlYXR1cmVGbGFncygpLmhvbm9yQ2lwaGVyT3JkZXIgPT09IHRydWVcblx0XHRcdH07XG5cdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdHRoaXMuZXJyb3JMb2dnZXIubG9nRXJyb3IoXG5cdFx0XHRcdGBFcnJvciBkZWNsYXJpbmcgd2ViIHNlcnZlciBvcHRpb25zOiAke2Vycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogZXJyb3J9YFxuXHRcdFx0KTtcblx0XHRcdHRoaXMuaGFuZGxlSFRUUFNTZXJ2ZXJFcnJvckZhdGFsKFxuXHRcdFx0XHRlcnJvcixcblx0XHRcdFx0J0RFQ0xBUkVfU0VSVkVSX09QVElPTlMnLFxuXHRcdFx0XHR7fSxcblx0XHRcdFx0J0Vycm9yIGRlY2xhcmluZyB3ZWIgc2VydmVyIG9wdGlvbnMnXG5cdFx0XHQpO1xuXHRcdFx0dGhyb3cgZXJyb3I7XG5cdFx0fVxuXHR9XG5cblx0cHVibGljIGFzeW5jIHN0YXJ0U2VydmVyKCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdHRyeSB7XG5cdFx0XHRpZiAoIXRoaXMub3B0aW9ucykge1xuXHRcdFx0XHR0aHJvdyBuZXcgdGhpcy5lcnJvckhhbmRsZXIuRXJyb3JDbGFzc2VzLkNvbmZpZ3VyYXRpb25FcnJvckZhdGFsKFxuXHRcdFx0XHRcdCdTZXJ2ZXIgb3B0aW9ucyBub3Qgc2V0ISdcblx0XHRcdFx0KTtcblx0XHRcdH1cblxuXHRcdFx0dGhpcy5zZXJ2ZXIgPSBodHRwcy5jcmVhdGVTZXJ2ZXIodGhpcy5vcHRpb25zLCB0aGlzLmFwcCk7XG5cblx0XHRcdHRoaXMuc2VydmVyLm9uKCdjb25uZWN0aW9uJywgKGNvbm46IG5ldC5Tb2NrZXQpID0+IHtcblx0XHRcdFx0dGhpcy5jb25uZWN0aW9ucy5hZGQoY29ubik7XG5cdFx0XHRcdGNvbm4ub24oJ2Nsb3NlJywgKCkgPT4ge1xuXHRcdFx0XHRcdHRoaXMuY29ubmVjdGlvbnMuZGVsZXRlKGNvbm4pO1xuXHRcdFx0XHR9KTtcblx0XHRcdH0pO1xuXG5cdFx0XHR0aGlzLnNlcnZlci5saXN0ZW4odGhpcy5wb3J0LCAoKSA9PiB7XG5cdFx0XHRcdHRoaXMubG9nZ2VyLmluZm8oYFNlcnZlciBpcyBydW5uaW5nIG9uIHBvcnQgJHt0aGlzLnBvcnR9YCk7XG5cdFx0XHR9KTtcblxuXHRcdFx0dGhpcy5zZXR1cEdyYWNlZnVsU2h1dGRvd24oKTtcblx0XHR9IGNhdGNoIChlcnJvcikge1xuXHRcdFx0dGhpcy5lcnJvckxvZ2dlci5sb2dXYXJuKFxuXHRcdFx0XHRgRXJyb3Igc3RhcnRpbmcgdGhlIHNlcnZlcjogJHtlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IGVycm9yfWBcblx0XHRcdCk7XG5cdFx0XHR0aGlzLmhhbmRsZUhUVFBTU2VydmVyRXJyb3JSZWNvdmVyYWJsZShcblx0XHRcdFx0ZXJyb3IsXG5cdFx0XHRcdCdTVEFSVF9TRVJWRVInLFxuXHRcdFx0XHR7fSxcblx0XHRcdFx0J0Vycm9yIHN0YXJ0aW5nIHRoZSBzZXJ2ZXInXG5cdFx0XHQpO1xuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgc2V0dXBHcmFjZWZ1bFNodXRkb3duKCk6IHZvaWQge1xuXHRcdGNvbnN0IHNodXRkb3duVGltZW91dCA9IHRoaXMuc2h1dGRvd25UaW1lb3V0O1xuXG5cdFx0Z3JhY2VmdWxTaHV0ZG93bih0aGlzLnNlcnZlciEsIHtcblx0XHRcdHNpZ25hbHM6ICdTSUdJTlQgU0lHVEVSTScsXG5cdFx0XHR0aW1lb3V0OiBzaHV0ZG93blRpbWVvdXQsXG5cdFx0XHRvblNodXRkb3duOiBhc3luYyAoKSA9PiB7XG5cdFx0XHRcdHRoaXMubG9nZ2VyLmluZm8oJ1NlcnZlciBzaHV0dGluZyBkb3duLi4uJyk7XG5cdFx0XHRcdHRoaXMuc2h1dHRpbmdEb3duID0gdHJ1ZTtcblxuXHRcdFx0XHRhd2FpdCB0aGlzLmNsb3NlQ29ubmVjdGlvbnMoKTtcblx0XHRcdFx0dGhpcy5sb2dnZXIuaW5mbygnQWxsIGFjdGl2ZSBjb25uZWN0aW9ucyBjbG9zZWQuJyk7XG5cblx0XHRcdFx0YXdhaXQgdGhpcy5zaHV0ZG93blNlcnZlcigpO1xuXG5cdFx0XHRcdHRoaXMubG9nZ2VyLmluZm8oXG5cdFx0XHRcdFx0J0FsbCByZXNvdXJjZXMgY2xlYW5lZCB1cCBhbmQgc2VydmVyIHNodXQgZG93biBzdWNjZXNzZnVsbHkuJ1xuXHRcdFx0XHQpO1xuXHRcdFx0fSxcblx0XHRcdGZpbmFsbHk6IGFzeW5jICgpID0+IHtcblx0XHRcdFx0dGhpcy5sb2dnZXIuaW5mbygnR3JhY2VmdWwgc2h1dGRvd24gcHJvY2VzcyBjb21wbGV0ZWQuJyk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHR0aGlzLmFwcC51c2UoKHJlcSwgcmVzLCBuZXh0KSA9PiB7XG5cdFx0XHRpZiAodGhpcy5zaHV0dGluZ0Rvd24pIHtcblx0XHRcdFx0cmVzLnNldEhlYWRlcignQ29ubmVjdGlvbicsICdjbG9zZScpO1xuXHRcdFx0XHRyZXR1cm4gcmVzLnN0YXR1cyg1MDMpLnNlbmQoJ1NlcnZlciBpcyBzaHV0dGluZyBkb3duLicpO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIG5leHQoKTtcblx0XHR9KTtcblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgY2xvc2VDb25uZWN0aW9ucygpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHR0cnkge1xuXHRcdFx0YXdhaXQgbmV3IFByb21pc2U8dm9pZD4ocmVzb2x2ZSA9PiB7XG5cdFx0XHRcdGNvbnN0IHRpbWVvdXQgPSBzZXRUaW1lb3V0KCgpID0+IHtcblx0XHRcdFx0XHR0aGlzLmxvZ2dlci53YXJuKCdGb3JjZSBjbG9zaW5nIHJlbWFpbmluZyBjb25uZWN0aW9ucy4uLicpO1xuXHRcdFx0XHRcdHRoaXMuY29ubmVjdGlvbnMuZm9yRWFjaChjb25uID0+IGNvbm4uZGVzdHJveSgpKTtcblx0XHRcdFx0XHRyZXNvbHZlKCk7XG5cdFx0XHRcdH0sIDMwMDAwKTtcblxuXHRcdFx0XHRjb25zdCBjaGVja0Nvbm5lY3Rpb25zID0gc2V0SW50ZXJ2YWwoKCkgPT4ge1xuXHRcdFx0XHRcdGlmICh0aGlzLmNvbm5lY3Rpb25zLnNpemUgPT09IDApIHtcblx0XHRcdFx0XHRcdGNsZWFySW50ZXJ2YWwoY2hlY2tDb25uZWN0aW9ucyk7XG5cdFx0XHRcdFx0XHRjbGVhclRpbWVvdXQodGltZW91dCk7XG5cdFx0XHRcdFx0XHRyZXNvbHZlKCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9LCAxMDApO1xuXHRcdFx0fSk7XG5cdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdHRoaXMuZXJyb3JMb2dnZXIubG9nV2Fybihcblx0XHRcdFx0J0Vycm9yIGNsb3NpbmcgY29ubmVjdGlvbnM6ICR7ZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBlcnJvcn0nXG5cdFx0XHQpO1xuXHRcdFx0dGhpcy5oYW5kbGVIVFRQU1NlcnZlckVycm9yUmVjb3ZlcmFibGUoXG5cdFx0XHRcdGVycm9yLFxuXHRcdFx0XHQnQ0xPU0VfQ09OTkVDVElPTlMnLFxuXHRcdFx0XHR7fSxcblx0XHRcdFx0J0Vycm9yIGNsb3NpbmcgY29ubmVjdGlvbnMnXG5cdFx0XHQpO1xuXHRcdH1cblx0fVxuXG5cdHB1YmxpYyBhc3luYyBzaHV0ZG93blNlcnZlcigpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHRpZiAodGhpcy5zaHV0dGluZ0Rvd24pIHtcblx0XHRcdHRoaXMubG9nZ2VyLndhcm4oJ1NodXRkb3duIGFscmVhZHkgaW4gcHJvZ3Jlc3MuJyk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0dGhpcy5zaHV0dGluZ0Rvd24gPSB0cnVlO1xuXG5cdFx0dHJ5IHtcblx0XHRcdHRoaXMubG9nZ2VyLmluZm8oJ0luaXRpYXRpbmcgc2VydmVyIHNodXRkb3duLi4uJyk7XG5cblx0XHRcdHRoaXMuc2VydmVyPy5jbG9zZSgoKSA9PiB7XG5cdFx0XHRcdHRoaXMubG9nZ2VyLmluZm8oJ05vIGxvbmdlciBhY2NlcHRpbmcgbmV3IGNvbm5lY3Rpb25zLicpO1xuXHRcdFx0fSk7XG5cblx0XHRcdGF3YWl0IHRoaXMuc2h1dERvd25MYXllcjE5U2VydmljZXMoKTtcblx0XHRcdGF3YWl0IHRoaXMuc2h1dERvd25MYXllcjE4U2VydmljZXMoKTtcblx0XHRcdGF3YWl0IHRoaXMuc2h1dERvd25MYXllcjE2U2VydmljZXMoKTtcblx0XHRcdGF3YWl0IHRoaXMuc2h1dERvd25MYXllcjE1U2VydmljZXMoKTtcblx0XHRcdGF3YWl0IHRoaXMuc2h1dERvd25MYXllcjE0U2VydmljZXMoKTtcblx0XHRcdGF3YWl0IHRoaXMuc2h1dERvd25MYXllcjEzU2VydmljZXMoKTtcblx0XHRcdGF3YWl0IHRoaXMuc2h1dERvd25MYXllcjEyU2VydmljZXMoKTtcblx0XHRcdGF3YWl0IHRoaXMuc2h1dERvd25MYXllcjExU2VydmljZXMoKTtcblx0XHRcdGF3YWl0IHRoaXMuc2h1dERvd25MYXllcjEwU2VydmljZXMoKTtcblx0XHRcdGF3YWl0IHRoaXMuc2h1dERvd25MYXllcjlTZXJ2aWNlcygpO1xuXHRcdFx0YXdhaXQgdGhpcy5zaHV0RG93bkxheWVyOFNlcnZpY2VzKCk7XG5cdFx0XHRhd2FpdCB0aGlzLnNodXREb3duTGF5ZXI3U2VydmljZXMoKTtcblx0XHRcdGF3YWl0IHRoaXMuc2h1dERvd25MYXllcjZTZXJ2aWNlcygpO1xuXHRcdFx0YXdhaXQgdGhpcy5zaHV0RG93bkxheWVyNVNlcnZpY2VzKCk7XG5cdFx0XHRhd2FpdCB0aGlzLnNodXREb3duTGF5ZXI0U2VydmljZXMoKTtcblx0XHRcdGF3YWl0IHRoaXMuc2h1dERvd25MYXllcjNTZXJ2aWNlcygpO1xuXHRcdFx0YXdhaXQgdGhpcy5zaHV0RG93bkxheWVyMlNlcnZpY2VzKCk7XG5cdFx0XHRhd2FpdCB0aGlzLnNodXREb3duTGF5ZXIxU2VydmljZXMoKTtcblxuXHRcdFx0dGhpcy5sb2dnZXIuaW5mbygnU2VydmVyIGhhcyBzaHV0IGRvd24gc3VjY2Vzc2Z1bGx5LicpO1xuXHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHR0aGlzLmVycm9yTG9nZ2VyLmxvZ0Vycm9yKFxuXHRcdFx0XHRgRXJyb3Igb2NjdXJyZWQgd2hpbGUgc2h1dHRpbmcgZG93biB0aGUgc2VydmVyOiAke2Vycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogZXJyb3J9YFxuXHRcdFx0KTtcblx0XHRcdHRoaXMuaGFuZGxlSFRUUFNTZXJ2ZXJFcnJvclJlY292ZXJhYmxlKFxuXHRcdFx0XHRlcnJvcixcblx0XHRcdFx0J1NIVVRET1dOX1NFUlZFUicsXG5cdFx0XHRcdHt9LFxuXHRcdFx0XHQnRXJyb3Igc2h1dHRpbmcgZG93biB0aGUgc2VydmVyJ1xuXHRcdFx0KTtcblx0XHR9XG5cdH1cblxuXHRwdWJsaWMgYXN5bmMgZ2V0SFRUUFNTZXJ2ZXJJbmZvKCk6IFByb21pc2U8UmVjb3JkPHN0cmluZywgdW5rbm93bj4+IHtcblx0XHR0cnkge1xuXHRcdFx0aWYgKCF0aGlzLnNlcnZlcikge1xuXHRcdFx0XHR0aHJvdyBuZXcgdGhpcy5lcnJvckhhbmRsZXIuRXJyb3JDbGFzc2VzLlNlcnZlck5vdEluaXRpYWxpemVkRXJyb3IoXG5cdFx0XHRcdFx0J0hUVFBTIHNlcnZlciBpcyBub3QgaW5pdGlhbGl6ZWQuJ1xuXHRcdFx0XHQpO1xuXHRcdFx0fVxuXG5cdFx0XHRjb25zdCB1cHRpbWUgPSBwcm9jZXNzLnVwdGltZSgpO1xuXHRcdFx0Y29uc3QgbWVtb3J5VXNhZ2UgPSBwcm9jZXNzLm1lbW9yeVVzYWdlKCk7XG5cdFx0XHRjb25zdCBjcHVVc2FnZSA9IHByb2Nlc3MuY3B1VXNhZ2UoKTtcblxuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0c3RhdHVzOiB0aGlzLnNlcnZlci5saXN0ZW5pbmcgPyAnUnVubmluZycgOiAnU3RvcHBlZCcsXG5cdFx0XHRcdHVwdGltZV9pbl9zZWNvbmRzOiB1cHRpbWUsXG5cdFx0XHRcdG1lbW9yeVVzYWdlOiB7XG5cdFx0XHRcdFx0aGVhcFVzZWQ6IG1lbW9yeVVzYWdlLmhlYXBVc2VkLFxuXHRcdFx0XHRcdGhlYXBUb3RhbDogbWVtb3J5VXNhZ2UuaGVhcFRvdGFsLFxuXHRcdFx0XHRcdHJzczogbWVtb3J5VXNhZ2UucnNzXG5cdFx0XHRcdH0sXG5cdFx0XHRcdGNwdVVzYWdlOiB7XG5cdFx0XHRcdFx0dXNlcjogY3B1VXNhZ2UudXNlciAvIDEwMDAsXG5cdFx0XHRcdFx0c3lzdGVtOiBjcHVVc2FnZS5zeXN0ZW0gLyAxMDAwXG5cdFx0XHRcdH0sXG5cdFx0XHRcdGNvbm5lY3Rpb25zOiB0aGlzLmNvbm5lY3Rpb25zLnNpemVcblx0XHRcdH07XG5cdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdHRoaXMubG9nZ2VyLmVycm9yKCdFcnJvciBnZXR0aW5nIEhUVFBTIHNlcnZlciBpbmZvOicsIHsgZXJyb3IgfSk7XG5cdFx0XHR0aHJvdyBlcnJvcjtcblx0XHR9XG5cdH1cblxuXHRwdWJsaWMgYXN5bmMgZ2V0SFRUUFNTZXJ2ZXJNZXRyaWNzKFxuXHRcdHNlcnZpY2VOYW1lOiBzdHJpbmdcblx0KTogUHJvbWlzZTxSZWNvcmQ8c3RyaW5nLCB1bmtub3duPj4ge1xuXHRcdHRyeSB7XG5cdFx0XHRpZiAoIXRoaXMuc2VydmVyKSB7XG5cdFx0XHRcdHRocm93IG5ldyB0aGlzLmVycm9ySGFuZGxlci5FcnJvckNsYXNzZXMuU2VydmVyTm90SW5pdGlhbGl6ZWRFcnJvcihcblx0XHRcdFx0XHQnSFRUUFMgc2VydmVyIGlzIG5vdCBpbml0aWFsaXplZC4nXG5cdFx0XHRcdCk7XG5cdFx0XHR9XG5cblx0XHRcdGNvbnN0IGNvbm5lY3Rpb25zQ291bnQgPSB0aGlzLmNvbm5lY3Rpb25zLnNpemU7XG5cdFx0XHRjb25zdCB1cHRpbWUgPSBwcm9jZXNzLnVwdGltZSgpO1xuXHRcdFx0Y29uc3QgbWVtb3J5VXNhZ2UgPSBwcm9jZXNzLm1lbW9yeVVzYWdlKCk7XG5cdFx0XHRjb25zdCBjcHVVc2FnZSA9IHByb2Nlc3MuY3B1VXNhZ2UoKTtcblx0XHRcdGNvbnN0IGF2ZXJhZ2VSZXNwb25zZVRpbWUgPVxuXHRcdFx0XHR0aGlzLnJvb3RNaWRkbGV3YXJlU2VydmljZS5nZXRBdmVyYWdlUmVzcG9uc2VUaW1lKCk7XG5cblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdHNlcnZpY2VOYW1lLFxuXHRcdFx0XHRjb25uZWN0aW9uc0NvdW50LFxuXHRcdFx0XHR1cHRpbWVfaW5fc2Vjb25kczogdXB0aW1lLFxuXHRcdFx0XHRtZW1vcnlVc2FnZToge1xuXHRcdFx0XHRcdGhlYXBVc2VkOiBtZW1vcnlVc2FnZS5oZWFwVXNlZCxcblx0XHRcdFx0XHRoZWFwVG90YWw6IG1lbW9yeVVzYWdlLmhlYXBUb3RhbCxcblx0XHRcdFx0XHRyc3M6IG1lbW9yeVVzYWdlLnJzc1xuXHRcdFx0XHR9LFxuXHRcdFx0XHRjcHVVc2FnZToge1xuXHRcdFx0XHRcdHVzZXI6IGNwdVVzYWdlLnVzZXIgLyAxMDAwLFxuXHRcdFx0XHRcdHN5c3RlbTogY3B1VXNhZ2Uuc3lzdGVtIC8gMTAwMFxuXHRcdFx0XHR9LFxuXHRcdFx0XHRhdmVyYWdlUmVzcG9uc2VUaW1lXG5cdFx0XHR9O1xuXHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHR0aGlzLmxvZ2dlci5lcnJvcihcblx0XHRcdFx0YEVycm9yIGdldHRpbmcgSFRUUFMgc2VydmVyIG1ldHJpY3MgZm9yIHNlcnZpY2UgJHtzZXJ2aWNlTmFtZX06YCxcblx0XHRcdFx0eyBlcnJvciB9XG5cdFx0XHQpO1xuXHRcdFx0dGhyb3cgZXJyb3I7XG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyBzaHV0RG93bkxheWVyMTlTZXJ2aWNlcygpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHR0aGlzLmxvZ2dlci5pbmZvKCdTaHV0dGluZyBkb3duIExheWVyIDE5IHNlcnZpY2VzOiBIZWFsdGggQ2hlY2suLi4nKTtcblx0XHR0cnkge1xuXHRcdFx0dGhpcy5oZWFsdGhDaGVja1NlcnZpY2Uuc2h1dGRvd24oKTtcblx0XHRcdHRoaXMubG9nZ2VyLmluZm8oJ0xheWVyIDE5IHNlcnZpY2VzIGhhdmUgYmVlbiBzaHV0IGRvd24uJyk7XG5cdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdHRoaXMuaGFuZGxlSFRUUFNTZXJ2ZXJFcnJvclJlY292ZXJhYmxlKFxuXHRcdFx0XHRlcnJvcixcblx0XHRcdFx0J1NIVVRET1dOX0xBWUVSXzE5Jyxcblx0XHRcdFx0e30sXG5cdFx0XHRcdCdFcnJvciBzaHV0dGluZyBkb3duIExheWVyIDE5IHNlcnZpY2VzJ1xuXHRcdFx0KTtcblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIHNodXREb3duTGF5ZXIxOFNlcnZpY2VzKCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdHRoaXMubG9nZ2VyLmluZm8oXG5cdFx0XHQnU2h1dHRpbmcgZG93biBMYXllciAxOCBzZXJ2aWNlczogUmVzb3VyY2UgTWFuYWdlci4uLidcblx0XHQpO1xuXHRcdHRyeSB7XG5cdFx0XHRhd2FpdCB0aGlzLnJlc291cmNlTWFuYWdlci5zaHV0ZG93bigpO1xuXHRcdFx0dGhpcy5sb2dnZXIuaW5mbygnTGF5ZXIgMTggc2VydmljZXMgaGF2ZSBiZWVuIHNodXQgZG93bi4nKTtcblx0XHR9IGNhdGNoIChlcnJvcikge1xuXHRcdFx0dGhpcy5oYW5kbGVIVFRQU1NlcnZlckVycm9yUmVjb3ZlcmFibGUoXG5cdFx0XHRcdGVycm9yLFxuXHRcdFx0XHQnU0hVVERPV05fTEFZRVJfMTgnLFxuXHRcdFx0XHR7fSxcblx0XHRcdFx0J0Vycm9yIHNodXR0aW5nIGRvd24gTGF5ZXIgMTggc2VydmljZXMnXG5cdFx0XHQpO1xuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgc2h1dERvd25MYXllcjE2U2VydmljZXMoKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0dGhpcy5sb2dnZXIuaW5mbyhcblx0XHRcdCdTaHV0dGluZyBkb3duIExheWVyIDE2IHNlcnZpY2VzOiBNYWlsZXIgYW5kIE11bHRlciBVcGxvYWQgU2VydmljZXMuLi4nXG5cdFx0KTtcblx0XHR0cnkge1xuXHRcdFx0YXdhaXQgUHJvbWlzZS5hbGwoW1xuXHRcdFx0XHR0aGlzLm1haWxlclNlcnZpY2Uuc2h1dGRvd24oKSxcblx0XHRcdFx0dGhpcy5tdWx0ZXJVcGxvYWRTZXJ2aWNlLnNodXRkb3duKClcblx0XHRcdF0pO1xuXHRcdFx0dGhpcy5sb2dnZXIuaW5mbygnTGF5ZXIgMTYgc2VydmljZXMgaGF2ZSBiZWVuIHNodXQgZG93bi4nKTtcblx0XHR9IGNhdGNoIChlcnJvcikge1xuXHRcdFx0dGhpcy5oYW5kbGVIVFRQU1NlcnZlckVycm9yUmVjb3ZlcmFibGUoXG5cdFx0XHRcdGVycm9yLFxuXHRcdFx0XHQnU0hVVERPV05fTEFZRVJfMTYnLFxuXHRcdFx0XHR7fSxcblx0XHRcdFx0J0Vycm9yIHNodXR0aW5nIGRvd24gTGF5ZXIgMTYgc2VydmljZXMnXG5cdFx0XHQpO1xuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgc2h1dERvd25MYXllcjE1U2VydmljZXMoKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0dGhpcy5sb2dnZXIuaW5mbyhcblx0XHRcdCdTaHV0dGluZyBkb3duIExheWVyIDE1IHNlcnZpY2VzOiBDU1JGLCBIZWxtZXQsIEpXVCBBdXRoLCBhbmQgUGFzc3BvcnQgTWlkZGxld2FyZXMuLi4nXG5cdFx0KTtcblx0XHR0cnkge1xuXHRcdFx0YXdhaXQgUHJvbWlzZS5hbGwoW1xuXHRcdFx0XHR0aGlzLmNzcmZNaWRkbGV3YXJlLnNodXRkb3duKCksXG5cdFx0XHRcdHRoaXMuaGVsbWV0TWlkZGxld2FyZS5zaHV0ZG93bigpLFxuXHRcdFx0XHR0aGlzLmp3dEF1dGhNaWRkbGV3YXJlU2VydmljZS5zaHV0ZG93bigpLFxuXHRcdFx0XHR0aGlzLnBhc3Nwb3J0QXV0aE1pZGRsZXdhcmVTZXJ2aWNlLnNodXRkb3duKClcblx0XHRcdF0pO1xuXHRcdFx0dGhpcy5sb2dnZXIuaW5mbygnTGF5ZXIgMTUgc2VydmljZXMgaGF2ZSBiZWVuIHNodXQgZG93bi4nKTtcblx0XHR9IGNhdGNoIChlcnJvcikge1xuXHRcdFx0dGhpcy5oYW5kbGVIVFRQU1NlcnZlckVycm9yUmVjb3ZlcmFibGUoXG5cdFx0XHRcdGVycm9yLFxuXHRcdFx0XHQnU0hVVERPV05fTEFZRVJfMTUnLFxuXHRcdFx0XHR7fSxcblx0XHRcdFx0J0Vycm9yIHNodXR0aW5nIGRvd24gTGF5ZXIgMTUgc2VydmljZXMnXG5cdFx0XHQpO1xuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgc2h1dERvd25MYXllcjE0U2VydmljZXMoKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0dGhpcy5sb2dnZXIuaW5mbyhcblx0XHRcdCdTaHV0dGluZyBkb3duIExheWVyIDE0IHNlcnZpY2VzOiBCYWNrdXAgQ29kZSwgRW1haWxNRkEsIEZJRE8yLCBKV1QsIFBhc3Nwb3J0LCBUT1RQLCBhbmQgWXViaWNvIE9UUCBTZXJ2aWNlcy4uLidcblx0XHQpO1xuXHRcdHRyeSB7XG5cdFx0XHRhd2FpdCBQcm9taXNlLmFsbChbXG5cdFx0XHRcdHRoaXMuYmFja3VwQ29kZVNlcnZpY2Uuc2h1dGRvd24oKSxcblx0XHRcdFx0dGhpcy5lbWFpbE1GQVNlcnZpY2Uuc2h1dGRvd24oKSxcblx0XHRcdFx0dGhpcy5maWRvMlNlcnZpY2Uuc2h1dGRvd24oKSxcblx0XHRcdFx0dGhpcy5qd3RTZXJ2aWNlLnNodXRkb3duKCksXG5cdFx0XHRcdHRoaXMucGFzc3BvcnRTZXJ2aWNlLnNodXRkb3duKCksXG5cdFx0XHRcdHRoaXMudG90cFNlcnZpY2Uuc2h1dGRvd24oKSxcblx0XHRcdFx0dGhpcy55dWJpY29PVFBTZXJ2aWNlLnNodXRkb3duKClcblx0XHRcdF0pO1xuXHRcdFx0dGhpcy5sb2dnZXIuaW5mbygnTGF5ZXIgMTQgc2VydmljZXMgaGF2ZSBiZWVuIHNodXQgZG93bi4nKTtcblx0XHR9IGNhdGNoIChlcnJvcikge1xuXHRcdFx0dGhpcy5oYW5kbGVIVFRQU1NlcnZlckVycm9yUmVjb3ZlcmFibGUoXG5cdFx0XHRcdGVycm9yLFxuXHRcdFx0XHQnU0hVVERPV05fTEFZRVJfMTQnLFxuXHRcdFx0XHR7fSxcblx0XHRcdFx0J0Vycm9yIHNodXR0aW5nIGRvd24gTGF5ZXIgMTQgc2VydmljZXMnXG5cdFx0XHQpO1xuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgc2h1dERvd25MYXllcjEzU2VydmljZXMoKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0dGhpcy5sb2dnZXIuaW5mbygnU2h1dHRpbmcgZG93biBMYXllciAxMyBzZXJ2aWNlczogQXV0aCBDb250cm9sbGVyLi4uJyk7XG5cdFx0dHJ5IHtcblx0XHRcdGF3YWl0IHRoaXMuYXV0aENvbnRyb2xsZXIuc2h1dGRvd24oKTtcblx0XHRcdHRoaXMubG9nZ2VyLmluZm8oJ0xheWVyIDEzIHNlcnZpY2VzIGhhdmUgYmVlbiBzaHV0IGRvd24uJyk7XG5cdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdHRoaXMuaGFuZGxlSFRUUFNTZXJ2ZXJFcnJvclJlY292ZXJhYmxlKFxuXHRcdFx0XHRlcnJvcixcblx0XHRcdFx0J1NIVVRET1dOX0xBWUVSXzEzJyxcblx0XHRcdFx0e30sXG5cdFx0XHRcdCdFcnJvciBzaHV0dGluZyBkb3duIExheWVyIDEzIHNlcnZpY2VzJ1xuXHRcdFx0KTtcblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIHNodXREb3duTGF5ZXIxMlNlcnZpY2VzKCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdHRoaXMubG9nZ2VyLmluZm8oJ1NodXR0aW5nIGRvd24gTGF5ZXIgMTIgc2VydmljZXM6IFVzZXIgQ29udHJvbGxlci4uLicpO1xuXHRcdHRyeSB7XG5cdFx0XHRhd2FpdCB0aGlzLnVzZXJDb250cm9sbGVyLnNodXRkb3duKCk7XG5cdFx0XHR0aGlzLmxvZ2dlci5pbmZvKCdMYXllciAxMiBzZXJ2aWNlcyBoYXZlIGJlZW4gc2h1dCBkb3duLicpO1xuXHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHR0aGlzLmhhbmRsZUhUVFBTU2VydmVyRXJyb3JSZWNvdmVyYWJsZShcblx0XHRcdFx0ZXJyb3IsXG5cdFx0XHRcdCdTSFVURE9XTl9MQVlFUl8xMicsXG5cdFx0XHRcdHt9LFxuXHRcdFx0XHQnRXJyb3Igc2h1dHRpbmcgZG93biBMYXllciAxMiBzZXJ2aWNlcydcblx0XHRcdCk7XG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyBzaHV0RG93bkxheWVyMTFTZXJ2aWNlcygpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHR0aGlzLmxvZ2dlci5pbmZvKFxuXHRcdFx0J1NodXR0aW5nIGRvd24gTGF5ZXIgMTEgc2VydmljZXM6IEJhc2UgUm91dGVyIGFuZCByb3V0ZXIgZXh0ZW5zaW9ucyAoQVBJIFJvdXRlciwgSGVhbHRoIFJvdXRlciwgU3RhdGljIFJvdXRlciwgZXRjKS4uLidcblx0XHQpO1xuXHRcdHRyeSB7XG5cdFx0XHRhd2FpdCB0aGlzLmJhc2VSb3V0ZXIuc2h1dGRvd24oKTtcblx0XHRcdHRoaXMubG9nZ2VyLmluZm8oJ0xheWVyIDExIHNlcnZpY2VzIGhhdmUgYmVlbiBzaHV0IGRvd24uJyk7XG5cdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdHRoaXMuaGFuZGxlSFRUUFNTZXJ2ZXJFcnJvclJlY292ZXJhYmxlKFxuXHRcdFx0XHRlcnJvcixcblx0XHRcdFx0J1NIVVRET1dOX0xBWUVSXzExJyxcblx0XHRcdFx0e30sXG5cdFx0XHRcdCdFcnJvciBzaHV0dGluZyBkb3duIExheWVyIDExIHNlcnZpY2VzJ1xuXHRcdFx0KTtcblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIHNodXREb3duTGF5ZXIxMFNlcnZpY2VzKCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdHRoaXMubG9nZ2VyLmluZm8oXG5cdFx0XHQnU2h1dHRpbmcgZG93biBMYXllciAxMCBzZXJ2aWNlczogQWNjZXNzIENvbnRyb2wgTWlkZGxld2FyZS4uLidcblx0XHQpO1xuXHRcdHRyeSB7XG5cdFx0XHRhd2FpdCB0aGlzLmFjY2Vzc0NvbnRyb2xNaWRkbGV3YXJlLnNodXRkb3duKCk7XG5cdFx0XHR0aGlzLmxvZ2dlci5pbmZvKCdMYXllciAxMCBzZXJ2aWNlcyBoYXZlIGJlZW4gc2h1dCBkb3duLicpO1xuXHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHR0aGlzLmhhbmRsZUhUVFBTU2VydmVyRXJyb3JSZWNvdmVyYWJsZShcblx0XHRcdFx0ZXJyb3IsXG5cdFx0XHRcdCdTSFVURE9XTl9MQVlFUl8xMCcsXG5cdFx0XHRcdHt9LFxuXHRcdFx0XHQnRXJyb3Igc2h1dHRpbmcgZG93biBMYXllciAxMCBzZXJ2aWNlcydcblx0XHRcdCk7XG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyBzaHV0RG93bkxheWVyOVNlcnZpY2VzKCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdHRoaXMubG9nZ2VyLmluZm8oJ1NodXR0aW5nIGRvd24gTGF5ZXIgOSBzZXJ2aWNlczogR2F0ZWtlZXBlci4uLicpO1xuXHRcdHRyeSB7XG5cdFx0XHRhd2FpdCB0aGlzLmdhdGVrZWVwZXJTZXJ2aWNlLnNodXRkb3duKCk7XG5cdFx0XHR0aGlzLmxvZ2dlci5pbmZvKCdMYXllciA5IHNlcnZpY2VzIGhhdmUgYmVlbiBzaHV0IGRvd24uJyk7XG5cdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdHRoaXMuaGFuZGxlSFRUUFNTZXJ2ZXJFcnJvclJlY292ZXJhYmxlKFxuXHRcdFx0XHRlcnJvcixcblx0XHRcdFx0J1NIVVRET1dOX0xBWUVSXzknLFxuXHRcdFx0XHR7fSxcblx0XHRcdFx0J0Vycm9yIHNodXR0aW5nIGRvd24gTGF5ZXIgOSBzZXJ2aWNlcydcblx0XHRcdCk7XG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyBzaHV0RG93bkxheWVyOFNlcnZpY2VzKCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdHRoaXMubG9nZ2VyLmluZm8oJ1NodXR0aW5nIGRvd24gTGF5ZXIgOCBzZXJ2aWNlczogQ2FjaGUgYW5kIFJlZGlzLi4uJyk7XG5cdFx0dHJ5IHtcblx0XHRcdGF3YWl0IFByb21pc2UuYWxsKFtcblx0XHRcdFx0dGhpcy5jYWNoZVNlcnZpY2Uuc2h1dGRvd24oKSxcblx0XHRcdFx0dGhpcy5yZWRpc1NlcnZpY2Uuc2h1dGRvd24oKVxuXHRcdFx0XSk7XG5cdFx0XHR0aGlzLmxvZ2dlci5pbmZvKCdMYXllciA4IHNlcnZpY2VzIGhhdmUgYmVlbiBzaHV0IGRvd24uJyk7XG5cdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdHRoaXMuaGFuZGxlSFRUUFNTZXJ2ZXJFcnJvclJlY292ZXJhYmxlKFxuXHRcdFx0XHRlcnJvcixcblx0XHRcdFx0J1NIVVRET1dOX0xBWUVSXzgnLFxuXHRcdFx0XHR7fSxcblx0XHRcdFx0J0Vycm9yIHNodXR0aW5nIGRvd24gTGF5ZXIgOCBzZXJ2aWNlcydcblx0XHRcdCk7XG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyBzaHV0RG93bkxheWVyN1NlcnZpY2VzKCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdHRoaXMubG9nZ2VyLmluZm8oXG5cdFx0XHQnU2h1dHRpbmcgZG93biBMYXllciA3IHNlcnZpY2VzOiBEYXRhYmFzZSBDb250cm9sbGVyLi4uJ1xuXHRcdCk7XG5cdFx0dHJ5IHtcblx0XHRcdGF3YWl0IHRoaXMuZGF0YWJhc2VDb250cm9sbGVyLnNodXRkb3duKCk7XG5cdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdHRoaXMuaGFuZGxlSFRUUFNTZXJ2ZXJFcnJvclJlY292ZXJhYmxlKFxuXHRcdFx0XHRlcnJvcixcblx0XHRcdFx0J1NIVVRET1dOX0xBWUVSXzcnLFxuXHRcdFx0XHR7fSxcblx0XHRcdFx0J0Vycm9yIHNodXR0aW5nIGRvd24gTGF5ZXIgNyBzZXJ2aWNlcydcblx0XHRcdCk7XG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyBzaHV0RG93bkxheWVyNlNlcnZpY2VzKCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdHRoaXMubG9nZ2VyLmluZm8oJ1NodXR0aW5nIGRvd24gTGF5ZXIgNiBzZXJ2aWNlczogUm9vdCBNaWRkbGV3YXJlLi4uJyk7XG5cdFx0dHJ5IHtcblx0XHRcdGF3YWl0IHRoaXMuZGF0YWJhc2VDb250cm9sbGVyLnNodXRkb3duKCk7XG5cdFx0XHR0aGlzLmxvZ2dlci5pbmZvKCdMYXllciA2IHNlcnZpY2VzIGhhdmUgYmVlbiBzaHV0IGRvd24uJyk7XG5cdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdHRoaXMuaGFuZGxlSFRUUFNTZXJ2ZXJFcnJvclJlY292ZXJhYmxlKFxuXHRcdFx0XHRlcnJvcixcblx0XHRcdFx0J1NIVVRET1dOX0xBWUVSXzYnLFxuXHRcdFx0XHR7fSxcblx0XHRcdFx0J0Vycm9yIHNodXR0aW5nIGRvd24gTGF5ZXIgNiBzZXJ2aWNlcydcblx0XHRcdCk7XG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyBzaHV0RG93bkxheWVyNVNlcnZpY2VzKCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdHRoaXMubG9nZ2VyLmluZm8oXG5cdFx0XHQnU2h1dHRpbmcgZG93biBMYXllciA1IHNlcnZpY2VzOiBNaWRkbGV3YXJlIFN0YXR1cyBTZXJ2aWNlLi4uJ1xuXHRcdCk7XG5cdFx0dHJ5IHtcblx0XHRcdGF3YWl0IHRoaXMubWlkZGxld2FyZVN0YXR1c1NlcnZpY2Uuc2h1dGRvd24oKTtcblx0XHRcdHRoaXMubG9nZ2VyLmluZm8oJ0xheWVyIDUgc2VydmljZXMgaGF2ZSBiZWVuIHNodXQgZG93bi4nKTtcblx0XHR9IGNhdGNoIChlcnJvcikge1xuXHRcdFx0dGhpcy5oYW5kbGVIVFRQU1NlcnZlckVycm9yUmVjb3ZlcmFibGUoXG5cdFx0XHRcdGVycm9yLFxuXHRcdFx0XHQnU0hVVERPV05fTEFZRVJfNScsXG5cdFx0XHRcdHt9LFxuXHRcdFx0XHQnRXJyb3Igc2h1dHRpbmcgZG93biBMYXllciA1IHNlcnZpY2VzJ1xuXHRcdFx0KTtcblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIHNodXREb3duTGF5ZXI0U2VydmljZXMoKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0dGhpcy5sb2dnZXIuaW5mbygnU2h1dHRpbmcgZG93biBMYXllciA0IHNlcnZpY2VzOiBWYXVsdC4uLicpO1xuXHRcdHRyeSB7XG5cdFx0XHRhd2FpdCB0aGlzLnZhdWx0LnNodXRkb3duKCk7XG5cdFx0XHR0aGlzLmxvZ2dlci5pbmZvKCdMYXllciA0IHNlcnZpY2VzIGhhdmUgYmVlbiBzaHV0IGRvd24uJyk7XG5cdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdHRoaXMuaGFuZGxlSFRUUFNTZXJ2ZXJFcnJvclJlY292ZXJhYmxlKFxuXHRcdFx0XHRlcnJvcixcblx0XHRcdFx0J1NIVVRET1dOX0xBWUVSXzQnLFxuXHRcdFx0XHR7fSxcblx0XHRcdFx0J0Vycm9yIHNodXR0aW5nIGRvd24gTGF5ZXIgNCBzZXJ2aWNlcydcblx0XHRcdCk7XG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyBzaHV0RG93bkxheWVyM1NlcnZpY2VzKCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdHRoaXMubG9nZ2VyLmluZm8oJ1NodXR0aW5nIGRvd24gTGF5ZXIgMyBzZXJ2aWNlczogRW52Q29uZmlnLi4uJyk7XG5cdFx0dHJ5IHtcblx0XHRcdGF3YWl0IHRoaXMuZW52Q29uZmlnLnNodXRkb3duKCk7XG5cdFx0XHR0aGlzLmxvZ2dlci5pbmZvKCdMYXllciAzIHNlcnZpY2VzIGhhdmUgYmVlbiBzaHV0IGRvd24uJyk7XG5cdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdHRoaXMuaGFuZGxlSFRUUFNTZXJ2ZXJFcnJvclJlY292ZXJhYmxlKFxuXHRcdFx0XHRlcnJvcixcblx0XHRcdFx0J1NIVVRET1dOX0xBWUVSXzMnLFxuXHRcdFx0XHR7fSxcblx0XHRcdFx0J0Vycm9yIHNodXR0aW5nIGRvd24gTGF5ZXIgMyBzZXJ2aWNlcydcblx0XHRcdCk7XG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyBzaHV0RG93bkxheWVyMlNlcnZpY2VzKCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdHRoaXMubG9nZ2VyLmluZm8oJ1NodXR0aW5nIGRvd24gTGF5ZXIgMiBzZXJ2aWNlczogRXJyb3IgSGFuZGxlci4uLicpO1xuXHRcdHRyeSB7XG5cdFx0XHRhd2FpdCB0aGlzLmVycm9ySGFuZGxlci5zaHV0ZG93bigpO1xuXHRcdFx0dGhpcy5sb2dnZXIuaW5mbygnTGF5ZXIgMiBzZXJ2aWNlcyBoYXZlIGJlZW4gc2h1dCBkb3duLicpO1xuXHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHR0aGlzLmhhbmRsZUhUVFBTU2VydmVyRXJyb3JSZWNvdmVyYWJsZShcblx0XHRcdFx0ZXJyb3IsXG5cdFx0XHRcdCdTSFVURE9XTl9MQVlFUl8yJyxcblx0XHRcdFx0e30sXG5cdFx0XHRcdCdFcnJvciBzaHV0dGluZyBkb3duIExheWVyIDIgc2VydmljZXMnXG5cdFx0XHQpO1xuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgc2h1dERvd25MYXllcjFTZXJ2aWNlcygpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHR0aGlzLmxvZ2dlci5pbmZvKFxuXHRcdFx0J1NodXR0aW5nIGRvd24gTGF5ZXIgMSBzZXJ2aWNlczogTG9nZ2VyIGFuZCBFcnJvciBMb2dnZXIuLi4nXG5cdFx0KTtcblx0XHR0cnkge1xuXHRcdFx0YXdhaXQgUHJvbWlzZS5hbGwoW1xuXHRcdFx0XHR0aGlzLmVycm9yTG9nZ2VyLnNodXRkb3duKCksXG5cdFx0XHRcdHRoaXMubG9nZ2VyLnNodXRkb3duKClcblx0XHRcdF0pO1xuXHRcdFx0dGhpcy5sb2dnZXIuaW5mbygnTGF5ZXIgMSBzZXJ2aWNlcyBoYXZlIGJlZW4gc2h1dCBkb3duLicpO1xuXHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHR0aGlzLmhhbmRsZUhUVFBTU2VydmVyRXJyb3JSZWNvdmVyYWJsZShcblx0XHRcdFx0ZXJyb3IsXG5cdFx0XHRcdCdTSFVURE9XTl9MQVlFUl8xJyxcblx0XHRcdFx0e30sXG5cdFx0XHRcdCdFcnJvciBzaHV0dGluZyBkb3duIExheWVyIDEgc2VydmljZXMnXG5cdFx0XHQpO1xuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgaGFuZGxlSFRUUFNTZXJ2ZXJFcnJvclJlY292ZXJhYmxlKFxuXHRcdGVycm9yOiB1bmtub3duLFxuXHRcdGVycm9ySGVhZGVyOiBzdHJpbmcsXG5cdFx0ZXJyb3JEZXRhaWxzOiBvYmplY3QsXG5cdFx0Y3VzdG9tTWVzc2FnZTogc3RyaW5nXG5cdCk6IHZvaWQge1xuXHRcdGNvbnN0IGVycm9yTWVzc2FnZSA9IGAke2N1c3RvbU1lc3NhZ2V9OiAke2Vycm9yfVxcbiR7ZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLnN0YWNrIDogJyd9YDtcblx0XHR0aGlzLmVycm9yTG9nZ2VyLmxvZ0Vycm9yKGVycm9yTWVzc2FnZSk7XG5cdFx0Y29uc3QgcmVkaXNFcnJvciA9XG5cdFx0XHRuZXcgdGhpcy5lcnJvckhhbmRsZXIuRXJyb3JDbGFzc2VzLkhUVFBTQ2xpZW50RXJyb3JGYXRhbChcblx0XHRcdFx0ZXJyb3JIZWFkZXIsXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRkZXRhaWxzOiBlcnJvckRldGFpbHMsXG5cdFx0XHRcdFx0ZXhwb3NlVG9DbGllbnQ6IGZhbHNlXG5cdFx0XHRcdH1cblx0XHRcdCk7XG5cdFx0dGhpcy5lcnJvckhhbmRsZXIuaGFuZGxlRXJyb3Ioe1xuXHRcdFx0ZXJyb3I6IHJlZGlzRXJyb3Jcblx0XHR9KTtcblx0XHRwcm9jZXNzLmV4aXQoMSk7XG5cdH1cblxuXHRwcml2YXRlIGhhbmRsZUhUVFBTU2VydmVyRXJyb3JGYXRhbChcblx0XHRlcnJvcjogdW5rbm93bixcblx0XHRlcnJvckhlYWRlcjogc3RyaW5nLFxuXHRcdGVycm9yRGV0YWlsczogb2JqZWN0LFxuXHRcdGN1c3RvbU1lc3NhZ2U6IHN0cmluZ1xuXHQpOiB2b2lkIHtcblx0XHRjb25zdCBlcnJvck1lc3NhZ2UgPSBgJHtjdXN0b21NZXNzYWdlfTogJHtlcnJvcn1cXG4ke2Vycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5zdGFjayA6ICcnfWA7XG5cdFx0dGhpcy5lcnJvckxvZ2dlci5sb2dFcnJvcihlcnJvck1lc3NhZ2UpO1xuXHRcdGNvbnN0IHJlZGlzRXJyb3IgPVxuXHRcdFx0bmV3IHRoaXMuZXJyb3JIYW5kbGVyLkVycm9yQ2xhc3Nlcy5IVFRQU0NsaWVudEVycm9yRmF0YWwoXG5cdFx0XHRcdGVycm9ySGVhZGVyLFxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0ZGV0YWlsczogZXJyb3JEZXRhaWxzLFxuXHRcdFx0XHRcdGV4cG9zZVRvQ2xpZW50OiBmYWxzZVxuXHRcdFx0XHR9XG5cdFx0XHQpO1xuXHRcdHRoaXMuZXJyb3JIYW5kbGVyLmhhbmRsZUVycm9yKHtcblx0XHRcdGVycm9yOiByZWRpc0Vycm9yXG5cdFx0fSk7XG5cdFx0cHJvY2Vzcy5leGl0KDEpO1xuXHR9XG59XG4iXX0=
