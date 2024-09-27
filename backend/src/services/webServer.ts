import gracefulShutdown from 'http-graceful-shutdown';
import https from 'https';
import net from 'net';
import { Sequelize } from 'sequelize';
import { Application, Request, Response, NextFunction } from 'express';
import { constants as cryptoConstants } from 'crypto';
import { validateDependencies } from '../utils/helpers';
import {
	AppLoggerServiceInterface,
	ConfigServiceInterface,
	ErrorHandlerServiceInterface,
	ErrorLoggerServiceInterface,
	RedisServiceInterface,
	SecretsStoreInterface,
	WebServerInterface,
	WebServerOptions
} from '../index/interfaces';
import { ServiceFactory } from '../index/factory';
import { tlsCiphers } from '../utils/constants';
import { createClient } from 'redis'; // ES module import

export class WebServer implements WebServerInterface {
	public static instance: WebServer;
	private server: https.Server | null = null;
	private app: Application;
	private sequelize: Sequelize;
	private shuttingDown = false;
	private connections: Set<net.Socket> = new Set();
	private options: WebServerOptions | undefined;
	private port: number;
	private logger: AppLoggerServiceInterface;
	private errorLogger: ErrorLoggerServiceInterface;
	private errorHandler: ErrorHandlerServiceInterface;
	private configService: ConfigServiceInterface;
	private redis: RedisServiceInterface;
	private secrets: SecretsStoreInterface;

	constructor(app: Application, sequelize: Sequelize) {
		this.app = app;
		this.sequelize = sequelize;
		this.logger = ServiceFactory.getLoggerService();
		this.errorLogger = ServiceFactory.getErrorLoggerService();
		this.errorHandler = ServiceFactory.getErrorHandlerService();
		this.configService = ServiceFactory.getConfigService();
		this.redis = ServiceFactory.getRedisService();
		this.secrets = ServiceFactory.getSecretsStore();
		this.port = this.configService.getEnvVariable('serverPort');
	}

	public static getInstance(
		app: Application,
		sequelize: Sequelize
	): WebServer {
		if (!WebServer.instance) {
			WebServer.instance = new WebServer(app, sequelize);
		}
		return WebServer.instance;
	}

	public async initialize(): Promise<void> {
		try {
			this.logger.debug('Initializing the web server...');
			validateDependencies(
				[{ name: 'sequelize', instance: this.sequelize }],
				this.logger
			);

			this.options = await this.declareWebServerOptions();

			await this.startServer();
		} catch (error) {
			this.handleError(error, 'INITIALIZE_SERVER');
		}
	}

	private async declareWebServerOptions(): Promise<WebServerOptions> {
		try {
			validateDependencies(
				[{ name: 'tlsCiphers', instance: tlsCiphers }],
				this.logger
			);

			const tlsKeyPath1 =
				this.configService.getEnvVariable('tlsKeyPath1');
			const tlsCertPath1 =
				this.configService.getEnvVariable('tlsCertPath1');

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
					this.configService.getFeatureFlags().honorCipherOrder ===
					true
			};
		} catch (error) {
			const serviceError =
				new this.errorHandler.ErrorClasses.ServiceUnavailableErrorFatal(
					`Error declaring web server options: ${error instanceof Error ? error.message : error}`,
					{ exposeToClient: false }
				);
			this.errorLogger.logError(serviceError.message);
			this.errorHandler.handleError({ error: serviceError });
			throw serviceError;
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
			this.handleError(error, 'START_SERVER');
		}
	}

	private setupGracefulShutdown(): void {
		gracefulShutdown(this.server!, {
			signals: 'SIGINT SIGTERM',
			timeout: 30000,
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
			this.handleError(error, 'DATABASE_CLOSE');
		}

		if (this.configService.getFeatureFlags().enableRedis) {
			try {
				const redisClient = await this.redis.getRedisClient({
					req: {} as Request,
					res: {} as Response,
					next: (() => {}) as NextFunction,
					blankRequest: {} as Request,
					createRedisClient: createClient
				});
				if (redisClient) {
					await redisClient.quit();
					this.logger.info('Redis connection closed.');
				}
			} catch (error) {
				this.handleError(error, 'REDIS_CLOSE');
			}
		}

		try {
			await this.redis.flushRedisMemoryCache({
				req: {} as Request,
				res: {} as Response,
				next: (() => {}) as NextFunction,
				blankRequest: {} as Request,
				createRedisClient: createClient
			});
			this.logger.info('Redis memory cache flushed.');
		} catch (error) {
			this.handleError(error, 'FLUSH_REDIS');
		}

		this.secrets.batchReEncryptSecrets();
	}

	public async shutdownServer(): Promise<void> {
		try {
			this.logger.info('Initiating server shutdown...');
			await this.cleanupResources();
			await this.closeConnections();
			this.logger.info('Server has shut down successfully.');
		} catch (error) {
			this.handleError(error, 'SHUTDOWN_SERVER');
		}
	}

	private async closeConnections(): Promise<void> {
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
	}

	private handleError(error: unknown, action: string): void {
		const appError =
			new this.errorHandler.ErrorClasses.ServiceDegradedError(
				error instanceof Error ? error.message : String(error)
			);
		this.errorLogger.logError(`Error during action: ${action}`);
		this.errorHandler.handleError({ error: appError });
		process.exit(1);
	}
}
