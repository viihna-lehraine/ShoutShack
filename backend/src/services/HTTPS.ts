import gracefulShutdown from 'http-graceful-shutdown';
import https from 'https';
import net from 'net';
import { Sequelize } from 'sequelize';
import { Application } from 'express';
import { constants as cryptoConstants } from 'crypto';
import { validateDependencies } from '../utils/helpers';
import {
	AccessControlMiddlewareServiceInterface,
	AppLoggerServiceInterface,
	AuthControllerInterface,
	BackupCodeServiceInterface,
	BaseRouterInterface,
	CacheServiceInterface,
	CSRFMiddlewareServiceInterface,
	DatabaseControllerInterface,
	EmailMFAServiceInterface,
	ErrorHandlerServiceInterface,
	ErrorLoggerServiceInterface,
	EnvConfigServiceInterface,
	FIDO2ServiceInterface,
	GatekeeperServiceInterface,
	HealthCheckServiceInterface,
	HelmetMiddlwareServiceInterface,
	HTTPSServerInterface,
	JWTAuthMiddlewareServiceInterface,
	JWTServiceInterface,
	MailerServiceInterface,
	MiddlewareStatusServiceInterface,
	MulterUploadServiceInterface,
	PassportAuthMiddlewareServiceInterface,
	PassportServiceInterface,
	PasswordServiceInterface,
	RedisServiceInterface,
	ResourceManagerInterface,
	RootMiddlewareServiceInterface,
	TOTPServiceInterface,
	UserControllerInterface,
	VaultServiceInterface,
	YubicoOTPServiceInterface
} from '../index/interfaces/services';
import { ServiceFactory } from '../index/factory';
import { tlsCiphers } from '../config/security';
import { SecureContextOptions } from 'tls';
import timeout from 'connect-timeout';

export class HTTPSServer implements HTTPSServerInterface {
	public static instance: HTTPSServer | null = null;

	private accessControlMiddleware: AccessControlMiddlewareServiceInterface;
	private authController: AuthControllerInterface;
	private backupCodeService: BackupCodeServiceInterface;
	private baseRouter: BaseRouterInterface;
	private cacheService: CacheServiceInterface;
	private csrfMiddleware: CSRFMiddlewareServiceInterface;
	private databaseController: DatabaseControllerInterface;
	private emailMFAService: EmailMFAServiceInterface;
	private errorLogger: ErrorLoggerServiceInterface;
	private errorHandler: ErrorHandlerServiceInterface;
	private envConfig: EnvConfigServiceInterface;
	private fido2Service: FIDO2ServiceInterface;
	private gatekeeperService: GatekeeperServiceInterface;
	private healthCheckService: HealthCheckServiceInterface;
	private helmetMiddleware: HelmetMiddlwareServiceInterface;
	private jwtAuthMiddlewareService: JWTAuthMiddlewareServiceInterface;
	private jwtService: JWTServiceInterface;
	private logger: AppLoggerServiceInterface;
	private mailerService: MailerServiceInterface;
	private middlewareStatusService: MiddlewareStatusServiceInterface;
	private multerUploadService: MulterUploadServiceInterface;
	private passportAuthMiddlewareService: PassportAuthMiddlewareServiceInterface;
	private passportService: PassportServiceInterface;
	private passwordService: PasswordServiceInterface;
	private redisService: RedisServiceInterface;
	private resourceManager: ResourceManagerInterface;
	private rootMiddlewareService: RootMiddlewareServiceInterface;
	private totpService: TOTPServiceInterface;
	private userController: UserControllerInterface;
	private vault: VaultServiceInterface;
	private yubicoOTPService: YubicoOTPServiceInterface;

	private server: https.Server | null = null;
	private app: Application;
	private sequelize: Sequelize;
	private shuttingDown = false;
	private connections: Set<net.Socket> = new Set();
	private options: SecureContextOptions | undefined;
	private port: number;
	private requestTimeout: string;
	private shutdownTimeout: number;

	private constructor(
		app: Application,
		sequelize: Sequelize,
		logger: AppLoggerServiceInterface,
		errorLogger: ErrorLoggerServiceInterface,
		errorHandler: ErrorHandlerServiceInterface,
		envConfig: EnvConfigServiceInterface,
		cacheService: CacheServiceInterface,
		redisService: RedisServiceInterface,
		resourceManager: ResourceManagerInterface,
		healthCheckService: HealthCheckServiceInterface,
		helmetMiddleware: HelmetMiddlwareServiceInterface,
		jwtAuthMiddlewareService: JWTAuthMiddlewareServiceInterface,
		passportAuthMiddlewareService: PassportAuthMiddlewareServiceInterface,
		accessControlMiddleware: AccessControlMiddlewareServiceInterface,
		authConroller: AuthControllerInterface,
		backupCodeService: BackupCodeServiceInterface,
		baseRouter: BaseRouterInterface,
		csrfMiddleware: CSRFMiddlewareServiceInterface,
		databaseController: DatabaseControllerInterface,
		emailMFAService: EmailMFAServiceInterface,
		fido2Service: FIDO2ServiceInterface,
		gatekeeperService: GatekeeperServiceInterface,
		jwtService: JWTServiceInterface,
		mailerService: MailerServiceInterface,
		middlewareStatusService: MiddlewareStatusServiceInterface,
		multerUploadService: MulterUploadServiceInterface,
		passportService: PassportServiceInterface,
		passwordService: PasswordServiceInterface,
		rootMiddlewareService: RootMiddlewareServiceInterface,
		totpService: TOTPServiceInterface,
		userController: UserControllerInterface,
		vault: VaultServiceInterface,
		yubicoOTPService: YubicoOTPServiceInterface
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

	private async initializeServices(): Promise<void> {
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

	public static async getInstance(
		app: Application,
		sequelize: Sequelize
	): Promise<HTTPSServer> {
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

	public async initialize(): Promise<void> {
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

	private async mountRouters(): Promise<void> {
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

	private async declareHTTPSServerOptions(): Promise<SecureContextOptions> {
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

	public async startServer(): Promise<void> {
		try {
			if (!this.options) {
				throw new this.errorHandler.ErrorClasses.ConfigurationErrorFatal(
					'Server options not set!'
				);
			}

			this.server = https.createServer(this.options, this.app);

			this.server.on('connection', (conn: net.Socket) => {
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

	private setupGracefulShutdown(): void {
		const shutdownTimeout = this.shutdownTimeout;

		gracefulShutdown(this.server!, {
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

	private async closeConnections(): Promise<void> {
		try {
			await new Promise<void>(resolve => {
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

	public async shutdownServer(): Promise<void> {
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

			await this.shutDownLayer18Services();
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

	public async getHTTPSServerInfo(): Promise<Record<string, unknown>> {
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

	public async getHTTPSServerMetrics(
		serviceName: string
	): Promise<Record<string, unknown>> {
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

	private async shutDownLayer18Services(): Promise<void> {
		this.logger.info(
			'Shutting down Layer 18 services: Mailer and MulterUpload...'
		);
		try {
			await Promise.all([
				this.mailerService.shutdown(),
				this.multerUploadService.shutdown()
			]);
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

	private async shutDownLayer17Services(): Promise<void> {
		this.logger.info(
			'Shutting down Layer 17 services: Middleware Status...'
		);
		try {
			await this.middlewareStatusService.shutdown();
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

	private async shutDownLayer16Services(): Promise<void> {
		this.logger.info(
			'Shutting down Layer 16 services: CSRF Middleware, Helmet Middleware, JWT Auth Middleware, and Passport Auth Middleware...'
		);
		try {
			await this.csrfMiddleware.shutdown();
			await this.helmetMiddleware.shutdown();
			await this.jwtAuthMiddlewareService.shutdown();
			await this.passportAuthMiddlewareService.shutdown();
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

	private async shutDownLayer15Services(): Promise<void> {
		this.logger.info(
			'Shutting down Layer 15 services: Backup Code, Email MFA, FIDO2, JWT, Passport, Password, TOTP, and Yubico OTP...'
		);
		try {
			await Promise.all([
				this.backupCodeService.shutdown(),
				this.emailMFAService.shutdown(),
				this.fido2Service.shutdown(),
				this.jwtService.shutdown(),
				this.passportService.shutdown(),
				this.passwordService.shutdown(),
				this.totpService.shutdown(),
				this.yubicoOTPService.shutdown()
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

	private async shutDownLayer14Services(): Promise<void> {
		this.logger.info('Shutting down Layer 14 services: Auth Controller...');
		try {
			await this.authController.shutdown();
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

	private async shutDownLayer13Services(): Promise<void> {
		this.logger.info('Shutting down Layer 13 services: User Controller...');
		try {
			await this.userController.shutdown();
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

	private async shutDownLayer12Services(): Promise<void> {
		try {
			this.logger.info('Shutting down Layer 12 services: Base Router...');

			const baseRouter = await this.baseRouter;

			await baseRouter.shutdown();
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

	private async shutDownLayer11Services(): Promise<void> {
		this.logger.info(
			'Shutting down Layer 11 services: Resource Manager...'
		);
		try {
			await this.resourceManager.shutdown();
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

	private async shutDownLayer10Services(): Promise<void> {
		this.logger.info('Shutting down Layer 10 services: Health Check...');
		try {
			await this.healthCheckService.shutdown();
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

	private async shutDownLayer9Services(): Promise<void> {
		this.logger.info(
			'Shutting down Layer 9 services: Access Control Middleware...'
		);
		try {
			await this.accessControlMiddleware.shutdown();
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

	private async shutDownLayer8Services(): Promise<void> {
		this.logger.info('Shutting down Layer 8 services: Gatekeeper...');
		try {
			await this.gatekeeperService.shutdown();
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

	private async shutDownLayer7Services(): Promise<void> {
		this.logger.info('Shutting down Layer 7 services: Cache and Redis...');
		try {
			await this.redisService.shutdown();
			await Promise.all([
				this.cacheService.shutdown(),
				this.redisService.shutdown()
			]);
		} catch (error) {
			this.handleHTTPSServerErrorRecoverable(
				error,
				'SHUTDOWN_LAYER_7',
				{},
				'Error shutting down Layer 7 services'
			);
		}
	}

	private async shutDownLayer6Services(): Promise<void> {
		this.logger.info(
			'Shutting down Layer 6 services: Database Controller...'
		);
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

	private async shutDownLayer5Services(): Promise<void> {
		this.logger.info('Shutting down Layer 4 services: Root Middleware...');
		try {
			await this.rootMiddlewareService.shutdown();
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

	private async shutDownLayer4Services(): Promise<void> {
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

	private async shutDownLayer3Services(): Promise<void> {
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

	private async shutDownLayer2Services(): Promise<void> {
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

	private async shutDownLayer1Services(): Promise<void> {
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

	private handleHTTPSServerErrorRecoverable(
		error: unknown,
		errorHeader: string,
		errorDetails: object,
		customMessage: string
	): void {
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

	private handleHTTPSServerErrorFatal(
		error: unknown,
		errorHeader: string,
		errorDetails: object,
		customMessage: string
	): void {
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