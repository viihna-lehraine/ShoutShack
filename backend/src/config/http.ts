import { Application } from 'express';
import { constants } from 'crypto';
import gracefulShutdown from 'http-graceful-shutdown';
import https from 'https';
import setupLogger from './logger';
import sops from './sops';
import { Sequelize } from 'sequelize';
import { SecureContextOptions } from 'tls';
import {
	getFeatureFlags,
	getRedisClient,
	getSequelizeInstance,
	initializeDatabase
} from '../index';

interface SSLKeys {
	key: string;
	cert: string;
}

type Options = SecureContextOptions;

const logger = setupLogger();
const featureFlags = getFeatureFlags();

const SERVER_PORT = process.env.SERVER_PORT || 3000;
const SSL_FLAG = featureFlags.enableSslFlag;
const REDIS_FLAG = featureFlags.enableRedisFlag;

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

async function declareOptions(): Promise<Options> {
	const sslKeys: SSLKeys = await sops.getSSLKeys();
	logger.info('SSL keys retrieved');

	try {
		const options = {
			key: sslKeys.key,
			cert: sslKeys.cert,
			allowHTTP1: true,
			secureOptions:
				constants.SSL_OP_NO_TLSv1 | constants.SSL_OP_NO_TLSv1_1,
			ciphers: ciphers.join(':'),
			honorCipherOrder: true
		};

		return options;
	} catch (error) {
		logger.error(`Error declaring options: ${error}`);
		throw new Error('Error declaring options');
	}
}

export async function setupHttp(app: Application) {
	logger.info('setupHttp() executing');

	const options = await declareOptions();

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
			logger.info('REDIS_FLAG is true. Closing Redis connection');
		}
		try {
			const redisClient = getRedisClient();
			if (redisClient) {
				await redisClient.quit();
				logger.info('Redis connection closed');
			}
		} catch (error) {
			logger.error(`Error closing Redis connection: ${error}`);
		}

		// Notify monitoring systems here
		// try {
		// } catch (error) {
		// } logger.error(`Error notifying monitoring systems: ${error} `);

		try {
			await new Promise<void>(resolve => {
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
				logger.info('SSL_FLAG is true. Starting HTTP server with SSL');

				server = https
					.createServer(options, app)
					.listen(SERVER_PORT, () => {
						logger.info(
							`HTTP1.1 server running on port ${SERVER_PORT}`
						);
					});
			} else {
				logger.info(
					'SSL_FLAG is false. Starting HTTP server without SSL'
				);

				server = app.listen(SERVER_PORT, () => {
					logger.info(
						`HTTP1.1 server running on port ${SERVER_PORT}`
					);
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
				logger.error(`Failed to start server: ${err.message}`);
			} else {
				logger.error('Failed to start server due to an unknown error');
			}
			process.exit(1);
		}
	}

	return { startServer };
}
