import { Application } from 'express';
import { Sequelize } from 'sequelize';
import { SecureContextOptions } from 'tls';
import { constants as cryptoConstants } from 'crypto';
import SopsDependencies from '../utils/sops';
import { execSync } from 'child_process';
import path from 'path';

interface SetupHttpParams {
	app: Application;
	sops: any;
	fs: typeof import('fs').promises;
	logger: any;
	constants: typeof cryptoConstants;
	getFeatureFlags: () => any;
	getRedisClient: () => any;
	getSequelizeInstance: () => Sequelize;
	initializeDatabase: () => Promise<Sequelize>;
	SERVER_PORT: number;
	SSL_FLAG: boolean;
	REDIS_FLAG: boolean;
}

interface SetupHttpReturn {
	options?: SecureContextOptions;
	startServer?: () => void;
}

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
		sslKeys = await sops.getSSLKeys({
			logger,
			execSync,
			getDirectoryPath: () => path.resolve(process.cwd())
		});
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
    fs: fsPromises,
    logger,
    constants,
    getFeatureFlags,
    getRedisClient,
    getSequelizeInstance,
    SERVER_PORT,
    SSL_FLAG,
    REDIS_FLAG
}: SetupHttpParams): Promise<SetupHttpReturn> {
    logger.info('setupHttp() executing');

    const featureFlags = getFeatureFlags();

    const options = await declareOptions({
        sops,
        fs: fsPromises,
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

    return { options };
}
