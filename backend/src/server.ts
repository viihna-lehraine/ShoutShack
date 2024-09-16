import { execSync } from 'child_process';
import { constants as cryptoConstants } from 'crypto';
import { Application } from 'express';
import http from 'http';
import gracefulShutdown from 'http-graceful-shutdown';
import net from 'net';
import https from 'https';
import path from 'path';
import { createClient, RedisClientType } from 'redis';
import { Sequelize } from 'sequelize';
import { SecureContextOptions } from 'tls';
import { envVariables, FeatureFlags } from './environment/envVars';
import { getRedisClient } from './config/redis';
import SopsDependencies from './environment/envSecrets';
import { errorClasses } from './errors/errorClasses';
import { ErrorLogger } from './errors/errorLogger';
import { processError } from './errors/processError';
import { Logger } from './utils/logger';
import { validateDependencies } from './utils/validateDependencies';

interface SetUpHttpServerParams {
	app: Application;
	sops: typeof SopsDependencies;
	fs: typeof import('fs').promises;
	logger: Logger;
	constants: typeof cryptoConstants;
	featureFlags: FeatureFlags;
	getRedisClient: () => RedisClientType | null;
	sequelize: Sequelize;
}

interface SetUpHttpServerReturn {
	startServer: () => Promise<void>;
}

interface SSLKeys {
	key: string;
	cert: string;
}

type Options = SecureContextOptions;

const port = envVariables.serverPort;

const ciphers = [
	'ECDHE-ECDSA-AES256-GCM-SHA384',
	'ECDHE-RSA-AES256-GCM-SHA384',
	'ECDHE-ECDSA-CHACHA20-POLY1305',
	'ECDHE-RSA-CHACHA20-POLY1305',
	'ECDHE-ECDSA-AES128-GCM-SHA256',
	'ECDHE-RSA-AES128-GCM-SHA256',
	'ECDHE-ECDSA-AES256-SHA384',
	'ECDHE-RSA-AES256-SHA384',
	'ECDHE-ECDSA-AES128-SHA256',
	'ECDHE-RSA-AES128-SHA256'
];

async function declareOptions({
	sops,
	fs,
	logger,
	constants,
	DECRYPT_KEYS,
	SSL_KEY,
	SSL_CERT,
	ciphers
}: {
	sops: typeof SopsDependencies;
	fs: typeof import('fs').promises;
	logger: Logger;
	constants: typeof import('crypto').constants;
	DECRYPT_KEYS: boolean;
	SSL_KEY: string | null;
	SSL_CERT: string | null;
	ciphers: string[];
}): Promise<Options> {
	try {
		validateDependencies(
			[
				{ name: 'sops', instance: sops },
				{ name: 'fs', instance: fs },
				{ name: 'logger', instance: logger },
				{ name: 'constants', instance: constants },
				{ name: 'DECRYPT_KEYS', instance: DECRYPT_KEYS },
				{ name: 'SSL_KEY', instance: SSL_KEY },
				{ name: 'SSL_CERT', instance: SSL_CERT },
				{ name: 'ciphers', instance: ciphers }
			],
			logger || console
		);

		let sslKeys: SSLKeys;

		if (DECRYPT_KEYS) {
			sslKeys = await sops.getSSLKeys({
				logger,
				execSync,
				getDirectoryPath: () => path.resolve(process.cwd())
			});
			logger.info('SSL Keys retrieved');
		} else {
			if (!SSL_KEY || !SSL_CERT) {
				throw new Error(
					'SSL_KEY or SSL_CERT environment variable is not set'
				);
			}
			const key = await fs.readFile(SSL_KEY, 'utf8');
			const cert = await fs.readFile(SSL_CERT, 'utf8');
			sslKeys = { key, cert };
			logger.info('Using unencrypted SSL Keys from environment files');
		}

		return {
			key: sslKeys.key,
			cert: sslKeys.cert,
			secureOptions:
				constants.SSL_OP_NO_TLSv1 | constants.SSL_OP_NO_TLSv1_1,
			ciphers: ciphers.join(':'),
			honorCipherOrder: true
		};
	} catch (error) {
		const service: string = 'HTTP/HTTPS Server';
		const serviceError = new errorClasses.ServiceUnavailableErrorFatal(
			service,
			{
				message: `Failed to declare options required for HTTP/HTTPS server ${error instanceof Error ? error.message : error}`,
				exposeToClient: false
			}
		);
		ErrorLogger.logError(serviceError, logger);
		processError(serviceError, logger || console);
		throw serviceError;
	}
}

async function flushInMemoryCache(
	logger: Logger,
	featureFlags: FeatureFlags
): Promise<void> {
	logger.info('Flushing in-memory cache');

	const redisClient = await getRedisClient(createClient);

	if (featureFlags.enableRedisFlag) {
		if (redisClient) {
			try {
				await redisClient.flushAll();
				logger.info('In-memory cache flushed');
			} catch (utilError) {
				const utility: string = 'flushInMemoryCache()';
				const utilityError = new errorClasses.UtilityErrorRecoverable(
					'flushInMemoryCache()',
					{
						message: `Error flushing Redis cache ${utilError instanceof Error ? utilError.message : utilError}`,
						utility,
						exposeToClient: false
					}
				);
				ErrorLogger.logError(utilityError, logger);
				processError(utilityError, logger || console);
			}
		} else {
			ErrorLogger.logWarning(
				'Redis client is not available for cache flush',
				logger
			);
		}
	} else {
		ErrorLogger.logInfo('No cache to flush (Redis is disabled)', logger);
	}
}

export async function setUpHttpServer({
	app,
	sops,
	fs: fsPromises,
	logger,
	constants,
	featureFlags,
	getRedisClient,
	sequelize
}: SetUpHttpServerParams): Promise<SetUpHttpServerReturn | undefined> {
	try {
		logger.info('Setting up the HTTP/HTTPS server');

		validateDependencies(
			[
				{ name: 'app', instance: app },
				{ name: 'sops', instance: sops },
				{ name: 'fs', instance: fsPromises },
				{ name: 'logger', instance: logger },
				{ name: 'constants', instance: constants },
				{ name: 'featureFlags', instance: featureFlags },
				{ name: 'getRedisClient', instance: getRedisClient },
				{ name: 'sequelize', instance: sequelize }
			],
			logger || console
		);

		let options: Options | undefined;

		if (featureFlags.enableSslFlag) {
			logger.info(
				`SSL_FLAG is set to true, setting up HTTPS server on port ${port}`
			);
			options = await declareOptions({
				sops,
				fs: fsPromises,
				logger,
				constants,
				DECRYPT_KEYS: featureFlags.decryptKeysFlag,
				SSL_KEY: envVariables.serverSslKeyPath || null,
				SSL_CERT: envVariables.serverSslCertPath || null,
				ciphers
			});
		} else {
			logger.info('SSL_FLAG is set to false, setting up HTTP server');
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
				logger.info(`Server running on port ${port}`);
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
					logger.info('Cleaning up resources before shutdown');
					shuttingDown = true;

					await flushInMemoryCache(logger, featureFlags);

					logger.info('Pre-shutdown tasks complete');
					server.keepAliveTimeout = 1;

					try {
						await sequelize.close();
						logger.info('Database connection closed');
					} catch (depError) {
						const dependency: string = 'sequelize.close()';
						const dependencyError =
							new errorClasses.DependencyErrorRecoverable(
								dependency,
								{
									message: `Error closing database connection ${depError instanceof Error ? depError.message : depError}`,
									dependency,
									exposeToClient: false
								}
							);
						ErrorLogger.logError(dependencyError, logger);
						processError(dependencyError, logger);
					}

					if (featureFlags.enableRedisFlag) {
						logger.info('Closing Redis connection');
						try {
							const redisClient = await getRedisClient();
							if (redisClient) {
								await redisClient.quit();
								logger.info('Redis connection closed');
							}
						} catch (depError) {
							const dependency: string = 'redisClient.quit()';
							const dependencyError =
								new errorClasses.DependencyErrorRecoverable(
									dependency,
									{
										message: `Error closing Redis connection ${depError instanceof Error ? depError.message : depError}`,
										dependency,
										exposeToClient: false
									}
								);
							ErrorLogger.logError(dependencyError, logger);
							processError(dependencyError, logger);
						}
					}

					try {
						await new Promise<void>(resolve => {
							logger.close();
							resolve();
						});
						logger.info('Logger closed');
					} catch (depError) {
						const dependency: string = 'logger.close()';
						const dependencyError =
							new errorClasses.DependencyErrorRecoverable(
								dependency,
								{
									message: `Error closing logger ${depError instanceof Error ? depError.message : depError}`,
									dependency,
									exposeToClient: false
								}
							);
						ErrorLogger.logError(dependencyError, logger);
						processError(dependencyError, console);
					}
				},
				finally: async () => {
					logger.info('Waiting for all connections to close...');

					const waitForConnectionsToClose = new Promise<void>(
						resolve => {
							const timeout = setTimeout(() => {
								ErrorLogger.logInfo(
									'Forcing shutdown: some connections did not close in time',
									logger
								);
								connections.forEach(con => con.destroy());
								resolve();
							}, 30000); // 30s timeout

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
					logger.info(
						'All connections closed. Shutting down server.'
					);
				}
			});
		}

		return { startServer };
	} catch (appError) {
		const service: string = 'HTTP/HTTPS Server';
		const serviceError = new errorClasses.ServiceUnavailableErrorFatal(
			service,
			{
				message: `Fatal error occurred while trying to set up the HTTP/HTTPS server ${appError instanceof Error ? appError.message : appError}`,
				exposeToClient: false
			}
		);
		ErrorLogger.logError(serviceError, logger);
		processError(serviceError, logger || console);
		throw serviceError;
	}
}
