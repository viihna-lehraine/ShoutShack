import gracefulShutdown from 'http-graceful-shutdown';
import https from 'https';
import net from 'net';
import { createClient } from 'redis';
import { flushRedisMemoryCache, getRedisClient } from './services/redis';
import { declareWebServerOptions } from './config/https';
import { envSecretsStore } from './environment/envSecrets';
import { errorClasses, ErrorSeverity } from './errors/errorClasses';
import { validateDependencies } from './utils/helpers';
import { AppError } from './errors/errorClasses';
import {
	SetUpWebServerInterface,
	SetUpWebServerReturn
} from './index/webServerInterfaces';
import {
	DeclareWebServerOptionsParameters,
	SetUpWebServerParameters
} from './parameters/webServerParameters';
import { SecureContextOptions } from 'tls';
import { configService } from './services/configService';

export async function setUpWebServer(
	SetUpWebServerParameters: SetUpWebServerInterface
): Promise<SetUpWebServerReturn | undefined> {
	const { appLogger, envVariables, featureFlags, processError, sequelize } =
		SetUpWebServerParameters;
	const app = SetUpWebServerParameters.app;
	const errorLogger = SetUpWebServerParameters.errorLogger;
	const port = envVariables.serverPort;

	type Options = SecureContextOptions;
	let options: Options;

	appLogger.debug('Setting up the HTTPS server...');

	try {
		validateDependencies(
			[{ name: 'sequelize', instance: sequelize }],
			appLogger
		);

		options = await declareWebServerOptions(
			DeclareWebServerOptionsParameters
		);

		async function startServer(): Promise<void> {
			let shuttingDown = false;
			const connections: Set<net.Socket> = new Set();

			if (!options) {
				const ConfigError = new errorClasses.ConfigurationErrorFatal(
					`HTTPS server options are required but were not provided`,
					{
						message:
							'HTTPS server options are required but were not provided',
						originalError: null,
						statusCode: 500,
						severity: ErrorSeverity.FATAL,
						exposeToClient: false
					}
				);
				errorLogger.logError(
					ConfigError as AppError,
					SetUpWebServerParameters.errorLoggerDetails(
						SetUpWebServerParameters.getCallerInfo,
						SetUpWebServerParameters.blankRequest,
						'DECLARE_HTTPS_OPTIONS'
					),
					appLogger,
					ErrorSeverity.FATAL
				);
				processError(
					configService
					ConfigError
				);
				throw ConfigError;
			}

			const server = https.createServer(options, app);

			server.on('connection', (conn: net.Socket) => {
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

					await flushRedisMemoryCache();

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
									message: `Error closing database connection\n${depError instanceof Error ? depError.message : depError}`,
									originalError: depError,
									dependency,
									statusCode: 500,
									severity: ErrorSeverity.RECOVERABLE,
									exposeToClient: false
								}
							);
						errorLogger.logError(
							dependencyError as AppError,
							SetUpWebServerParameters.errorLoggerDetails(
								SetUpWebServerParameters.getCallerInfo,
								SetUpWebServerParameters.blankRequest,
								'DATABASE_CLOSE'
							),
							appLogger,
							ErrorSeverity.RECOVERABLE
						);
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
										message: `Error closing Redis connection\n${depError instanceof Error ? depError.message : depError}`,
										originalError: depError,
										dependency,
										statusCode: 500,
										severity: ErrorSeverity.RECOVERABLE,
										exposeToClient: false
									}
								);
							errorLogger.logError(
								dependencyError as AppError,
								SetUpWebServerParameters.errorLoggerDetails(
									SetUpWebServerParameters.getCallerInfo,
									SetUpWebServerParameters.blankRequest,
									'REDIS_CLOSE'
								),
								appLogger,
								ErrorSeverity.RECOVERABLE
							);
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
						errorLogger.logError(
							dependencyError as AppError,
							SetUpWebServerParameters.errorLoggerDetails(
								SetUpWebServerParameters.getCallerInfo,
								SetUpWebServerParameters.blankRequest,
								'LOGGER_CLOSE'
							),
							appLogger,
							ErrorSeverity.RECOVERABLE
						);
						processError(dependencyError);
					}

					envSecretsStore.batchReEncryptSecrets();
				},
				finally: async () => {
					appLogger.info('Waiting for all connections to close...');

					const waitForConnectionsToClose = new Promise<void>(
						resolve => {
							const timeout = setTimeout(() => {
								console.warn(
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
						'Application Shutdown\nAll connections closed\nShutting down...'
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
		errorLogger.logError(
			serviceErrorFatal as AppError,
			SetUpWebServerParameters.errorLoggerDetails(
				SetUpWebServerParameters.getCallerInfo,
				SetUpWebServerParameters.blankRequest,
				'SETUP_HTTPS_SERVER'
			),
			appLogger,
			ErrorSeverity.FATAL
		);
		processError(serviceErrorFatal);
		throw serviceErrorFatal;
	}
}
