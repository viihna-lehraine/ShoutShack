import gracefulShutdown from 'http-graceful-shutdown';
import https from 'https';
import net from 'net';
import { createClient } from 'redis';
import { flushRedisMemoryCache, getRedisClient } from '../services/redis';
import { declareWebServerOptions } from '../config/https';
import { envSecretsStore } from '../environment/envSecrets';
import { ErrorClasses, ErrorSeverity } from '../errors/errorClasses';
import { validateDependencies } from '../utils/helpers';
import { AppError } from '../errors/errorClasses';
import { appLogger, errorLogger, AppLoggerType } from '../services/logger';
import { Sequelize } from 'sequelize';
import { SecureContextOptions } from 'tls';
import { configService } from '../services/configService';
import { tlsCiphers } from '../utils/constants';
import { Request } from 'express';

export class WebServer {
	public static instance: WebServer;
	private app: Express.Application;
	private appLogger: AppLoggerType;
	private errorLogger: AppLoggerType;
	private sequelize: Sequelize;
	private featureFlags: Record<string, boolean>;
	private port: number;
	private options: SecureContextOptions | undefined;
	private shuttingDown: boolean = false;
	private connections: Set<net.Socket> = new Set();
	private server: https.Server | null = null;
	private tlsCiphers: string[];

	constructor(
		app: Express.Application,
		appLogger: AppLoggerType,
		errorLogger: AppLoggerType,
		sequelize: Sequelize,
		featureFlags: Record<string, boolean>,
		port: number,
		tlsCiphers: string[]
	) {
		this.app = app;
		this.appLogger = appLogger;
		this.errorLogger = errorLogger;
		this.sequelize = sequelize;
		this.featureFlags = configService.getFeatureFlags();
		this.port = configService.getEnvVariables().serverPort;
		this.tlsCiphers = tlsCiphers;
	}

	public static getInstance(
		app: Express.Application,
		appLogger: AppLoggerType,
		errorLogger: AppLoggerType,
		sequelize: Sequelize,
		featureFlags: Record<string, boolean>,
		port: number
	): WebServer {
		if (!WebServer.instance) {
			WebServer.instance = new WebServer(
				app,
				appLogger,
				errorLogger,
				sequelize,
				featureFlags,
				port,
				tlsCiphers
			);
		}
		return WebServer.instance;
	}

	public async initialize(): Promise<void> {
		try {
			this.appLogger.debug('Initializing the web server...');
			validateDependencies(
				[{ name: 'sequelize', instance: this.sequelize }],
				this.appLogger
			);
			this.options = await declareWebServerOptions({
				constants: cryptoConstants,
				fs: typeof import('fs'),
				appLogger: this.appLogger,
				configService,
				ErrorClasses,
				errorLogger: this.errorLogger,
				errorLoggerDetails: this.errorLogger.getErrorDetails.bind(
					this.errorLogger
				),
				ErrorSeverity,
				processError: () => {},
				getCallerInfo: () => 'WebServer',
				blankRequest: {} as Request
			});

			await this.startServer();
		} catch (error) {
			this.handleError(error, 'INITIALIZE_SERVER');
		}
	}

	private async startServer(): Promise<void> {
		try {
			if (!this.options) {
				throw new ErrorClasses.ConfigurationErrorFatal(
					'HTTPS options are not set!',
					{
						message:
							'Server options must be declared before starting the server.',
						severity: ErrorSeverity.FATAL
					}
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
				this.appLogger.info(`Server is running on port ${this.port}`);
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
				this.appLogger.info('Server shutting down...');
				this.shuttingDown = true;

				await this.cleanupResources();

				this.appLogger.info('All resources cleaned up successfully.');
			},
			finally: async () => {
				this.appLogger.info(
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
			this.appLogger.info('Database connection closed.');
		} catch (error) {
			this.handleError(error, 'DATABASE_CLOSE');
		}

		if (this.featureFlags.enableRedis) {
			try {
				const redisClient = await getRedisClient(createClient);
				if (redisClient) {
					await redisClient.quit();
					this.appLogger.info('Redis connection closed.');
				}
			} catch (error) {
				this.handleError(error, 'REDIS_CLOSE');
			}
		}

		try {
			await flushRedisMemoryCache();
			this.appLogger.info('Redis memory cache flushed.');
		} catch (error) {
			this.handleError(error, 'FLUSH_REDIS');
		}

		envSecretsStore.batchReEncryptSecrets();
	}

	private async closeConnections(): Promise<void> {
		await new Promise<void>(resolve => {
			const timeout = setTimeout(() => {
				this.appLogger.warn('Force closing remaining connections...');
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
		const appError = new AppError(
			error instanceof Error ? error.message : String(error)
		);
		this.errorLogger.logError(appError, {
			action,
			details: { error }
		});
		process.exit(1);
	}
}
