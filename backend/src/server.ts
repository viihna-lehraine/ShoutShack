import { constants } from 'crypto';
import { Application } from 'express';
import { promises as fsPromises } from 'fs';
import http from 'http';
import gracefulShutdown from 'http-graceful-shutdown';
import net from 'net';
import https from 'https';
import { createClient } from 'redis';
import { Sequelize } from 'sequelize';
import { configService } from './config/configService';
import { flushInMemoryCache, getRedisClient } from './config/redis';
import { ciphers, declareHttpServerOptions, Options } from './config/tlsConfig';
import { errorClasses, ErrorSeverity } from './errors/errorClasses';
import { ErrorLogger } from './errors/errorLogger';
import { processError } from './errors/processError';
import { validateDependencies } from './utils/validateDependencies';

interface SetUpHttpServerParams {
	app: Application;
	sequelize: Sequelize;
}

interface SetUpHttpServerReturn {
	startServer: () => Promise<void>;
}

export async function setUpHttpServer({
	app,
	sequelize
}: SetUpHttpServerParams): Promise<SetUpHttpServerReturn | undefined> {
	const appLogger = configService.getLogger();
	const envVariables = configService.getEnvVariables();
	const featureFlags = configService.getFeatureFlags();
	const port = envVariables.serverPort;

	let options: Options | undefined;

	appLogger.info('Setting up the HTTP/HTTPS server...');

	try {
		validateDependencies(
			[
				{ name: 'app', instance: app },
				{ name: 'sequelize', instance: sequelize }
			],
			appLogger || console
		);

		if (featureFlags.enableTLS) {
			appLogger.info(`Setting up HTTPS server on port ${port}`);
			options = await declareHttpServerOptions({
				fs: fsPromises,
				constants,
				ciphers
			});
		} else {
			appLogger.info('setting up HTTP server (no TLS)');
		}

		async function startServer(): Promise<void> {
			let shuttingDown = false;
			const connections: Set<net.Socket> = new Set();

			const server = options
				? https.createServer(options, app)
				: http.createServer(app);

			server.on('connection', conn => {
				connections.add(conn);
				conn.on('close', () => {
					connections.delete(conn);
				});
			});

			server.listen(port, () => {
				appLogger.info(
					`Server running on port ${envVariables.serverPort}`
				);
			});

			app.use((req, res, next) => {
				if (shuttingDown) {
					res.setHeader('Connection', 'close');
					return res.status(503).send('Server is shutting down.');
				}
				return next();
			});

			gracefulShutdown(server, {
				signals: 'SIGINT SIGTERM',
				timeout: 30000,
				onShutdown: async () => {
					appLogger.info('Cleaning up resources before shutdown');
					shuttingDown = true;

					await flushInMemoryCache();

					appLogger.info('Pre-shutdown tasks complete');
					server.keepAliveTimeout = 1;

					try {
						await sequelize.close();
						appLogger.info('Database connection closed');
					} catch (depError) {
						const dependency: string = 'sequelize.close()';
						const dependencyError =
							new errorClasses.DependencyErrorRecoverable(
								dependency,
								{
									message: `Error closing database connection ${depError instanceof Error ? depError.message : depError}`,
									originalError: depError,
									dependency,
									statusCode: 500,
									severity: ErrorSeverity.RECOVERABLE,
									exposeToClient: false
								}
							);
						ErrorLogger.logError(dependencyError);
						processError(dependencyError);
					}

					if (featureFlags.enableRedis) {
						appLogger.info('Closing Redis connection');
						try {
							const redisClient =
								await getRedisClient(createClient);
							if (redisClient) {
								await redisClient.quit();
								appLogger.info('Redis connection closed');
							}
						} catch (depError) {
							const dependency: string = 'redisClient.quit()';
							const dependencyError =
								new errorClasses.DependencyErrorRecoverable(
									dependency,
									{
										message: `Error closing Redis connection ${depError instanceof Error ? depError.message : depError}`,
										originalError: depError,
										dependency,
										statusCode: 500,
										severity: ErrorSeverity.RECOVERABLE,
										exposeToClient: false
									}
								);
							ErrorLogger.logError(dependencyError);
							processError(dependencyError);
						}
					}

					try {
						await new Promise<void>(resolve => {
							appLogger.close();
							resolve();
						});
						appLogger.info('Logger closed');
					} catch (depError) {
						const dependency: string = 'appLogger.close()';
						const dependencyError =
							new errorClasses.DependencyErrorRecoverable(
								dependency,
								{
									message: `Error closing appLogger ${depError instanceof Error ? depError.message : depError}`,
									dependency,
									statusCode: 500,
									severity: ErrorSeverity.RECOVERABLE,
									exposeToClient: false
								}
							);
						ErrorLogger.logError(dependencyError);
						processError(dependencyError);
					}
				},
				finally: async () => {
					appLogger.info('Waiting for all connections to close...');

					const waitForConnectionsToClose = new Promise<void>(
						resolve => {
							const timeout = setTimeout(() => {
								ErrorLogger.logInfo(
									'Forcing shutdown: some connections did not close in time'
								);
								connections.forEach(con => con.destroy());
								resolve();
							}, 30000);

							const checkConnections = setInterval(() => {
								if (connections.size === 0) {
									clearInterval(checkConnections);
									clearTimeout(timeout);
									resolve();
								}
							}, 100);
						}
					);

					await waitForConnectionsToClose;
					appLogger.info(
						'Application Shutdown\nAll connections closed: Shutting down server.'
					);
				}
			});
		}

		return { startServer };
	} catch (serviceError) {
		const service: string = 'HTTP/HTTPS Server';
		const serviceErrorFatal = new errorClasses.ServiceUnavailableErrorFatal(
			service,
			{
				message: `Fatal error occurred while trying to set up the HTTP/HTTPS server\n${serviceError instanceof Error ? serviceError.message : serviceError}`,
				originalError: serviceError,
				statusCode: 500,
				severity: ErrorSeverity.FATAL,
				exposeToClient: false
			}
		);
		ErrorLogger.logError(serviceErrorFatal);
		processError(serviceErrorFatal);
		throw serviceErrorFatal;
	}
}
