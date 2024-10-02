import gracefulShutdown from 'http-graceful-shutdown';
import https from 'https';
import net from 'net';
import { Sequelize } from 'sequelize';
import { Application, NextFunction, Request, Response } from 'express';
import { constants as cryptoConstants } from 'crypto';
import { validateDependencies } from '../utils/helpers';
import { HTTPSServerInterface } from '../index/interfaces';
import { ServiceFactory } from '../index/factory';
import { tlsCiphers } from '../config/security';
import { SecureContextOptions } from 'tls';

export class HTTPSServer implements HTTPSServerInterface {
	public static instance: HTTPSServer | null = null;

	private logger = ServiceFactory.getLoggerService();
	private errorLogger = ServiceFactory.getErrorLoggerService();
	private errorHandler = ServiceFactory.getErrorHandlerService();
	private envConfig = ServiceFactory.getEnvConfigService();
	private cacheService = ServiceFactory.getCacheService();
	private redisService = ServiceFactory.getRedisService();
	private apiRouter = ServiceFactory.getAPIRouter();
	private healthRouter = ServiceFactory.getHealthRouter();
	private staticRouter = ServiceFactory.getStaticRouter();
	private testRouter = ServiceFactory.getTestRouter();

	private server: https.Server | null = null;
	private app: Application;
	private sequelize: Sequelize;
	private shuttingDown = false;
	private connections: Set<net.Socket> = new Set();
	private options: SecureContextOptions | undefined;
	private port: number;
	private timeout: number;

	private constructor(app: Application, sequelize: Sequelize) {
		this.app = app;
		this.sequelize = sequelize;
		this.port = this.envConfig.getEnvVariable('serverPort');
		this.timeout =
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

			this.mountRouters();

			this.errorHandler.setShutdownHandler(() => this.shutdownServer());

			await this.startServer();
		} catch (error) {
			this.errorLogger.logError(
				`Error initializing the web server: ${error instanceof Error ? error.message : error}`
			);
			this.handleHTTPSServerErrorFatal(
				error,
				'INITIALIZE_SERVER',
				{},
				'Error initializing the web server'
			);
		}
	}

	private mountRouters(): void {
		this.app.use('/api', this.handleAPIRequest.bind(this));
		this.app.use('/health', this.handleHealthRequest.bind(this));
		this.app.use('/static', this.handleStaticRequest.bind(this));
		this.app.use('/test', this.handleTestRequest.bind(this));

		this.logger.info('Routers have been mounted.');
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
		const timeout = this.timeout;

		gracefulShutdown(this.server!, {
			signals: 'SIGINT SIGTERM',
			timeout,
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

	public async shutdownServer(): Promise<void> {
		if (this.shuttingDown) {
			this.logger.warn('Shutdown already in progress.');
			return;
		}

		this.shuttingDown = true;

		try {
			this.logger.info('Initiating server shutdown...');
			await this.cleanupResources();
			await this.closeConnections();
			this.logger.info('Server has shut down successfully.');
		} catch (error) {
			this.errorLogger.logError(
				'Error occurred while shutting down the server: ${error instanceof Error ? error.message : error}'
			);
			this.handleHTTPSServerErrorRecoverable(
				error,
				'SHUTDOWN_SERVER',
				{},
				'Error shutting down the server'
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

	public async handleRequest(req: Request, res: Response): Promise<void> {
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

			const response = await this.fetchResponse(req);

			await this.cacheService.set(
				cacheKey,
				JSON.stringify(response),
				'3600'
			);

			res.send(response);
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

	private async fetchResponse(req: Request): Promise<unknown> {
		try {
			if (req.url.startsWith('/api')) {
				return await this.handleApiRequest(req);
			} else if (req.url.startsWith('/static')) {
				return await this.handleStaticRequest(req);
			} else {
				return await this.handleUnknownRequest(req);
			}
		} catch (error) {
			this.errorLogger.logError(
				`Error fetching response: ${error instanceof Error ? error.message : error}`
			);
			this.handleHTTPSServerErrorRecoverable(
				error,
				'FETCH_RESPONSE',
				{ url: req.url },
				'Error fetching response'
			);
			return;
		}
	}

	public async handleAPIRequest(
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<void> {
		try {
			this.logger.info(`Handling API request: ${req.method} ${req.url}`);
			this.apiRouter.getRouter()(req, res, next);
		} catch (error) {
			this.logger.error('Error handling API request');
			next(error);
		}
	}

	public async handleStaticRequest(
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<void> {
		try {
			this.logger.info(
				`Handling static request: ${req.method} ${req.url}`
			);
			this.staticRouter.getRouter()(req, res, next);
		} catch (error) {
			this.logger.error('Error handling static request');
			next(error);
		}
	}

	public async handleHealthRequest(
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<void> {
		try {
			this.logger.info(
				`Handling health check request: ${req.method} ${req.url}`
			);
			this.healthRouter.getRouter()(req, res, next);
		} catch (error) {
			this.logger.error('Error handling health check request');
			next(error);
		}
	}

	public async handleTestRequest(
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<void> {
		try {
			this.logger.info(`Handling test request: ${req.method} ${req.url}`);
			this.testRouter.getRouter()(req, res, next); // Use the Test router
		} catch (error) {
			this.logger.error('Error handling test request');
			next(error);
		}
	}

	private getRouterHandler(handler: string): Function {
		switch (handler) {
			case 'apiRouter':
				return this.handleAPIRequest;
			case 'healthRouter':
				return this.handleHealthRequest;
			case 'staticRouter':
				return this.handleStaticRequest;
			case 'testRouter':
				return this.handleTestRequest;
			default:
				throw new Error(`Unknown router handler: ${handler}`);
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
