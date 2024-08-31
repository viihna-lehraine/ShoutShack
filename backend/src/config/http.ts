import { Application } from 'express';
import gracefulShutdown from 'http-graceful-shutdown';
import https from 'https';
import { Sequelize } from 'sequelize';
import { SecureContextOptions } from 'tls';

interface SSLKeys {
	key: string;
	cert: string;
}

type Options = SecureContextOptions;

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

export async function declareOptions({
	sops,
	fs,
	logger,
	constants,
	DECRYPT_KEYS,
	SSL_KEY,
	SSL_CERT,
	ciphers
}: {
	sops: any;
	fs: typeof import('fs').promises;
	logger: any;
	constants: typeof import('crypto').constants;
	DECRYPT_KEYS: boolean;
	SSL_KEY: string | null;
	SSL_CERT: string | null;
	ciphers: string[];
}): Promise<Options> {
	let sslKeys: SSLKeys;

	if (DECRYPT_KEYS) {
		sslKeys = await sops.getSSLKeys();
		logger.info('SSL Keys retrieved from via sops.getSSLKeys()');
	} else {
		if (!SSL_KEY || !SSL_CERT) {
			throw new Error('SSL_Key or SSL_CERT environment variable is not set');
		}
		const key = await fs.readFile(SSL_KEY, 'utf8');
		const cert = await fs.readFile(SSL_CERT, 'utf8');

		sslKeys = { key, cert };
		logger.info('Using unencrypted SSL Keys from environment files');
	}

	const options = {
		key: sslKeys.key,
		cert: sslKeys.cert,
		allowHTTP1: true,
		secureOptions: constants.SSL_OP_NO_TLSv1 | constants.SSL_OP_NO_TLSv1_1,
		ciphers: ciphers.join(':'),
		honorCipherOrder: true
	};

	return options;
}

export async function setupHttp({
	app,
	sops,
	fs,
	logger,
	constants,
	getFeatureFlags,
	getRedisClient,
	getSequelizeInstance,
	initializeDatabase,
	SERVER_PORT,
	SSL_FLAG,
	REDIS_FLAG
}: {
	app: Application;
	sops: any;
	fs: typeof import('fs').promises;
	logger: any;
	constants: typeof import('crypto').constants;
	getFeatureFlags: () => any;
	getRedisClient: () => any;
	getSequelizeInstance: () => Sequelize;
	initializeDatabase: () => Promise<void>;
	SERVER_PORT: number;
	SSL_FLAG: boolean;
	REDIS_FLAG: boolean;
}) {
	logger.info('setupHttp() executing');

	const featureFlags = getFeatureFlags();

	const options = await declareOptions({
		sops,
		fs,
		logger,
		constants,
		DECRYPT_KEYS: featureFlags.decryptKeysFlag,
		SSL_KEY: process.env.SERVER_SSL_KEY_PATH || null,
		SSL_CERT: process.env.SERVER_SSL_CERT_PATH || null,
		ciphers: ciphers
	});

	async function onShutdown() {
		logger.info('Cleaning up resources before shutdown');

		const sequelize: Sequelize = getSequelizeInstance();

		try {
			await sequelize.close();
			logger.info('Database connection closed');
		} catch (error) {
			logger.error(`Error closing database connection: ${error}`);
		}

		if (REDIS_FLAG) {
			logger.info('REDIS_FLAG is set to true, Closing redis connection');

			try {
				const redisClient = getRedisClient();
				if (redisClient) {
					await redisClient.quit();
					logger.info('Redis connection closed');
				}
			} catch (error) {
				logger.error(`Error closing redis connection: ${error}`);
			}
		}

		try {
			await new Promise<void>((resolve) => {
				logger.close();
				resolve();
			});
			console.log('Logger closed');
		} catch (error) {
			logger.error(`Error closing logger: ${error}`);
		}
	}

	async function startServer() {
		try {
			logger.info(`Starting HTTP server on port ${SERVER_PORT}`);
			logger.info(
				'Initializing database before starting server. Awaiting execution of initializeDatabase()'
			);

			await initializeDatabase();

			let server;

			if (SSL_FLAG) {
				logger.info('SSL_FLAG is set to true, starting HTTPS server');

				server = https
					.createServer(options, app)
					.listen(SERVER_PORT, () => {
						logger.info(`HTTP.1 server running on port ${SERVER_PORT}`);
					});
			} else {
				logger.info('SSL_FLAG is false. Starting HTTP server without SSL');

				server = app.listen(SERVER_PORT, () => {
					logger.info(`HTTP1.1 server running on port ${SERVER_PORT}`);
				});
			}
			gracefulShutdown(server, {
				signals: 'SIGINT SIGTERM',
				timeout: 30000,
				development: false,
				onShutdown,
				finally: () => {
					console.log('Server has gracefully shut down');
				}
			});
		} catch (err) {
			if (err instanceof Error) {
				logger.error(`Error starting server: ${err.message}`);
			} else {
				logger.error('Failed to start server due to an unknown error');
			}
			process.exit(1);
		}
	}

	return { startServer };
}
