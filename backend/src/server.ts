import { execSync } from 'child_process';
import { constants as cryptoConstants } from 'crypto';
import { Application } from 'express';
import http from 'http';
import https from 'https';
import path from 'path';
import gracefulShutdown from 'http-graceful-shutdown';
import { Sequelize } from 'sequelize';
import { SecureContextOptions } from 'tls';
import { validateDependencies } from './utils/validateDependencies';
import { processError } from './utils/processError';
import SopsDependencies from './utils/sops';
import { environmentVariables, FeatureFlags } from './config/environmentConfig';
import { Logger } from './config/logger';
import { RedisClientType } from 'redis';
import net from 'net';
import { getRedisClient } from './config/redis';

interface SetupHttpServerParams {
	app: Application;
	sops: typeof SopsDependencies;
	fs: typeof import('fs').promises;
	logger: Logger;
	constants: typeof cryptoConstants;
	featureFlags: FeatureFlags;
	getRedisClient: () => RedisClientType | null;
	getSequelizeInstance: () => Sequelize;
}

interface SetupHttpServerReturn {
	startServer: () => Promise<void>;
}

interface SSLKeys {
	key: string;
	cert: string;
}

type Options = SecureContextOptions;

const port = environmentVariables.serverPort;

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
		processError(error, logger || console);
		throw error;
	}
}

async function flushInMemoryCache(
	logger: Logger,
	featureFlags: FeatureFlags
): Promise<void> {
	logger.info('Flushing in-memory cache');
	const redisClient = await getRedisClient();

	if (featureFlags.enableRedisFlag) {
		if (redisClient) {
			try {
				await redisClient.flushAll(); // Use the Redis client instance
				logger.info('In-memory cache flushed');
			} catch (error) {
				logger.error('Error flushing Redis cache', error);
			}
		} else {
			logger.warn('Redis client is not available for cache flush');
		}
	} else {
		logger.info('No cache to flush (Redis is disabled)');
	}
}

export async function setupHttpServer({
	app,
	sops,
	fs: fsPromises,
	logger,
	constants,
	featureFlags,
	getRedisClient,
	getSequelizeInstance
}: SetupHttpServerParams): Promise<SetupHttpServerReturn | undefined> {
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
				{ name: 'getSequelizeInstance', instance: getSequelizeInstance }
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
				SSL_KEY: environmentVariables.serverSslKeyPath || null,
				SSL_CERT: environmentVariables.serverSslCertPath || null,
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

					const sequelize: Sequelize = getSequelizeInstance();

					try {
						await sequelize.close();
						logger.info('Database connection closed');
					} catch (error) {
						processError(error, logger);
					}

					if (featureFlags.enableRedisFlag) {
						logger.info('Closing Redis connection');
						try {
							const redisClient = await getRedisClient();
							if (redisClient) {
								await redisClient.quit();
								logger.info('Redis connection closed');
							}
						} catch (error) {
							processError(error, logger);
						}
					}

					try {
						await new Promise<void>(resolve => {
							logger.close();
							resolve();
						});
						logger.info('Logger closed');
					} catch (error) {
						processError(error, logger);
					}
				},
				finally: async () => {
					logger.info('Waiting for all connections to close...');

					const waitForConnectionsToClose = new Promise<void>(
						resolve => {
							const timeout = setTimeout(() => {
								logger.warn(
									'Forcing shutdown: some connections did not close in time'
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
	} catch (error) {
		processError(error, logger || console);
		throw new Error(
			`Error occurred in setupHttpServer(): ${error instanceof Error ? error.message : error}`
		);
	}
}
