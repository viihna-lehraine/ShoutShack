import { Application } from 'express';
import { constants } from 'crypto';
import gracefulShutdown from 'http-graceful-shutdown';
import https from 'https';
import setupLogger from './logger';
import sops from './sops';
import { getSequelizeInstance } from './db';
import { Sequelize } from 'sequelize';
import connectRedis from './redis';

interface SSLKeys {
	key: string;
	cert: string;
}

const logger = await setupLogger();
const sslKeys: SSLKeys = await sops.getSSLKeys();
const SERVER_PORT = process.env.SERVER_PORT || 3000;
const sequelize: Sequelize = getSequelizeInstance();

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

const options = {
	key: sslKeys.key,
	cert: sslKeys.cert,
	allowHTTP1: true,
	secureOptions: constants.SSL_OP_NO_TLSv1 | constants.SSL_OP_NO_TLSv1_1,
	ciphers: ciphers.join(':'),
	honorCipherOrder: true
};

export async function setupHttp(app: Application) {
	logger.info('setupHttp() executing');

	async function onShutdown() {
		logger.info('Cleaning up resources before shutdown');

		try {
			await sequelize.close();
			logger.info('Database connection closed');
		} catch (error) {
			logger.error(`Error closing database connection: ${error}`);
		}

		try {
			const redisClient = await connectRedis;
			await redisClient.quit();
			logger.info('Redis connection closed');
		} catch (error) {
			logger.error(`Error closing Redis connection: ${error}`);
		}

		try {
			await new Promise<void>((resolve, reject) => {
				logger.close();
				resolve();
			});
			logger.info('Logger closed');
		} catch (error) {
			logger.error(`Error closing logger: ${error}`);
		}

		// Notify monitoring systems here
	}

	async function startServer() {
		try {
			logger.info('Starting HTTP1.1 server');
			logger.info(`Server port: ${SERVER_PORT}`);

			const server = https
				.createServer(options, app)
				.listen(SERVER_PORT, () => {
					logger.info(
						`HTTP1.1 server running on port ${SERVER_PORT}`
					);
				});

			gracefulShutdown(server, {
				signals: 'SIGINT SIGTERM',
				timeout: 30000,
				development: false,
				onShutdown,
				finally: () => {
					logger.info('Server has gracefully shut down');
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
