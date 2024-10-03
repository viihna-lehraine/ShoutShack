import gracefulShutdown from 'http-graceful-shutdown';
import https from 'https';
import net from 'net';
import { Sequelize } from 'sequelize';
import { Application, NextFunction, Request, Response } from 'express';
import { constants as cryptoConstants } from 'crypto';
import { validateDependencies } from '../utils/helpers';
import { HTTPSServerInterface } from '../index/interfaces/services';
import { ServiceFactory } from '../index/factory';
import { tlsCiphers } from '../config/security';
import { SecureContextOptions } from 'tls';
import timeout from 'connect-timeout';

export class HTTPSServer implements HTTPSServerInterface {
	public static instance: HTTPSServer | null = null;

	private accessControlMiddleware =
		ServiceFactory.getAccessControlMiddlewareService();
	private authController = ServiceFactory.getAuthController();
	private backupCodeService = ServiceFactory.getBackupCodeService();
	private baseRouter = ServiceFactory.getBaseRouter();
	private cacheService = ServiceFactory.getCacheService();
	private csrfMiddleware = ServiceFactory.getCSRFMiddlewareService();
	private databaseController = ServiceFactory.getDatabaseController();
	private emailMFAService = ServiceFactory.getEmailMFAService();
	private errorLogger = ServiceFactory.getErrorLoggerService();
	private errorHandler = ServiceFactory.getErrorHandlerService();
	private envConfig = ServiceFactory.getEnvConfigService();
	private fido2Service = ServiceFactory.getFIDO2Service();
	private gatekeeperService = ServiceFactory.getGatekeeperService();
	private healthCheckService = ServiceFactory.getHealthCheckService();
	private helmetMiddleware = ServiceFactory.getHelmetMiddlewareService();
	private jwtAuthMiddlewareService =
		ServiceFactory.getJWTAuthMiddlewareService();
	private jwtService = ServiceFactory.getJWTService();
	private logger = ServiceFactory.getLoggerService();
	private mailerService = ServiceFactory.getMailerService();
	private middlewareStatusService =
		ServiceFactory.getMiddlewareStatusService();
	private multerUploadService = ServiceFactory.getMulterUploadService();
	private passportAuthMiddlewareService =
		ServiceFactory.getPassportAuthMiddlewareService();
	private passportService = ServiceFactory.getPassportService();
	private passwordService = ServiceFactory.getPasswordService();
	private redisService = ServiceFactory.getRedisService();
	private resourceManager = ServiceFactory.getResourceManager();
	private totpService = ServiceFactory.getTOTPService();
	private userController = ServiceFactory.getUserController();
	private vault = ServiceFactory.getVaultService();
	private yubicoOTPService = ServiceFactory.getYubicoOTPService();

	private server: https.Server | null = null;
	private app: Application;
	private sequelize: Sequelize;
	private shuttingDown = false;
	private connections: Set<net.Socket> = new Set();
	private options: SecureContextOptions | undefined;
	private port: number;
	private requestTimeout: string;
	private shutdownTimeout: number;

	private constructor(app: Application, sequelize: Sequelize) {
		this.app = app;
		this.sequelize = sequelize;
		this.port = this.envConfig.getEnvVariable('serverPort');
		this.requestTimeout =
			this.envConfig.getEnvVariable('requestTimeout') || '30s';
		this.shutdownTimeout =
			this.envConfig.getEnvVariable('gracefulShutdownTimeout') || 30000;
	}

	public static getInstance(
		app: Application,
		sequelize: Sequelize
	): HTTPSServer {
		if (!HTTPSServer.instance) {
			HTTPSServer.instance = new HTTPSServer(app, sequelize);
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

	public async handleRequest(
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<void> {
		const cacheKey = `api:${req.url}`;
		const serviceName = 'HTTPS_SERVER';

		try {
			const cachedResponse = await this.cacheService.get<string>(
				cacheKey,
				serviceName
			);

			if (cachedResponse) {
				res.send(JSON.parse(cachedResponse));
				return;
			}

			const response = await this.fetchResponse(req, res, next);

			await this.cacheService.set(
				cacheKey,
				JSON.stringify(response),
				'3600'
			);

			res.send(response);
			next();
		} catch (error) {
			this.errorLogger.logError(
				`Error handling handling HTTPS Server request`
			);
			this.handleHTTPSServerErrorRecoverable(
				error,
				'HANDLE_REQUEST',
				{ url: req.url },
				'Error handling HTTPS Server request'
			);
		}
	}

	private async fetchResponse(
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<void> {
		try {
			this.logger.info(`Handling request: ${req.method} ${req.url}`);

			const baseRouter = await this.baseRouter;

			baseRouter.getRouter()(req, res, next);
		} catch (error) {
			this.handleHTTPSServerErrorRecoverable(
				error,
				'FETCH_RESPONSE',
				{ url: req.url },
				'Error fetching response'
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

				await this.cleanupResources();

				this.logger.info('All resources cleaned up successfully.');
			},
			finally: async () => {
				this.logger.info(
					'All connections closed. Shutting down the server...'
				);
				await this.closeConnections();
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

	private async cleanupResources(): Promise<void> {
		try {
			await this.sequelize.close();
			this.logger.info('Database connection closed.');
		} catch (error) {
			this.errorLogger.logWarn('Error closing database connection.');
			this.handleHTTPSServerErrorRecoverable(
				error,
				'CLOSE_DB_CONNECTION',
				{},
				'Error closing database connection'
			);
		}

		if (this.envConfig.getFeatureFlags().enableRedis) {
			try {
				const redisClient = await this.redisService.getRedisClient();
				if (redisClient) {
					await redisClient.quit();
					this.logger.info('Redis connection closed.');
				}
			} catch (error) {
				this.errorLogger.logWarn('Error closing Redis connection.');
				this.handleHTTPSServerErrorRecoverable(
					error,
					'CLOSE_REDIS_CONNECTION',
					{},
					'Error closing Redis connection'
				);
			}
		}

		try {
			await this.redisService.flushRedisMemoryCache();
			this.logger.info('Redis memory cache flushed.');
		} catch (error) {
			this.errorLogger.logWarn('Error flushing Redis memory cache.');
			this.handleHTTPSServerErrorRecoverable(
				error,
				'FLUSH_REDIS_CACHE',
				{},
				'Error flushing Redis memory cache'
			);
		}
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

	private async shutDownLayer17Services(): Promise<void> {
		this.logger.info(
			'Shutting down Layer 17 services: Mailer and MulterUpload...'
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

	private async shutDownLayer16Services(): Promise<void> {
		this.logger.info(
			'Shutting down Layer 16 services: Middleware Status...'
		);
		try {
			await this.middlewareStatusService.shutdown();
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
			'Shutting down Layer 15 services: CSRF Middleware, Helmet Middleware, JWT Auth Middleware, and Passport Auth Middleware...'
		);
		try {
			await this.csrfMiddleware.shutdown();
			await this.helmetMiddleware.shutdown();
			await this.jwtAuthMiddlewareService.shutdown();
			await this.passportAuthMiddlewareService.shutdown();
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
		this.logger.info(
			'Shutting down Layer 14 services: Backup Code, Email MFA, FIDO2, JWT, Passport, Password, TOTP, and Yubico OTP...'
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

	private async shutDownLayer12Services(): Promise<void> {
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

	private async shutDownLayer11Services(): Promise<void> {
		try {
			this.logger.info('Shutting down Layer 11 services: Base Router...');

			const baseRouter = await this.baseRouter;

			await baseRouter.shutdown();
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
		this.logger.info(
			'Shutting down Layer 10 services: Resource Manager...'
		);
		try {
			await this.resourceManager.shutdown();
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
		this.logger.info('Shutting down Layer 9 services: Health Check...');
		try {
			await this.healthCheckService.shutdown();
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
		this.logger.info(
			'Shutting down Layer 8 services: Access Control Middleware...'
		);
		try {
			await this.accessControlMiddleware.shutdown();
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
		this.logger.info('Shutting down Layer 7 services: Gatekeeper...');
		try {
			await this.gatekeeperService.shutdown();
			this.logger.info('Layer 7 services have been shut down.');
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
		this.logger.info('Shutting down Layer 6 services: Cache and Redis...');
		try {
			await this.redisService.shutdown();
			await Promise.all([
				this.cacheService.shutdown(),
				this.redisService.shutdown()
			]);
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
		this.logger.info(
			'Shutting down Layer 5 services: Database Controller...'
		);
		try {
			await this.databaseController.shutdown();
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
