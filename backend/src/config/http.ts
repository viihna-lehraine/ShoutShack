import { Application } from 'express';
import { Sequelize } from 'sequelize';
import { SecureContextOptions } from 'tls';
import { constants as cryptoConstants } from 'crypto';
import SopsDependencies from '../utils/sops';
import { execSync } from 'child_process';
import path from 'path';
import { Logger } from 'winston';
import { FeatureFlags } from '../utils/featureFlags';
import { RedisClientType } from 'redis';
import https from 'https';
import http from 'http';
import gracefulShutdown from 'http-graceful-shutdown';

interface SetupHttpParams {
    app: Application;
    sops: typeof SopsDependencies;
    fs: typeof import('fs').promises;
    logger: Logger;
    constants: typeof cryptoConstants;
    getFeatureFlags: () => FeatureFlags;
    getRedisClient: () => RedisClientType | null;
    getSequelizeInstance: () => Sequelize;
}

interface SetupHttpReturn {
    startServer: () => void;
}

interface SSLKeys {
    key: string;
    cert: string;
}

type Options = SecureContextOptions;

const SERVER_PORT = parseInt(process.env.SERVER_PORT ?? '3000', 10);

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
    let sslKeys: SSLKeys;

    try {
        if (DECRYPT_KEYS) {
            sslKeys = await sops.getSSLKeys({
                logger,
                execSync,
                getDirectoryPath: () => path.resolve(process.cwd())
            });
            logger.info('SSL Keys retrieved via sops.getSSLKeys()');
        } else {
            if (!SSL_KEY || !SSL_CERT) {
                throw new Error('SSL_KEY or SSL_CERT environment variable is not set');
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
        logger.error(`Failed to declare SSL options: ${error}`);
        throw error;
    }
}

// Main function to set up HTTP or HTTPS server
export async function setupHttp({
    app,
    sops,
    fs: fsPromises,
    logger,
    constants,
    getFeatureFlags,
    getRedisClient,
    getSequelizeInstance
}: SetupHttpParams): Promise<SetupHttpReturn> {
    logger.info('setupHttp() executing');

    const featureFlags = getFeatureFlags();
    let options: Options | undefined;

    if (featureFlags.enableSslFlag) {
        logger.info(`SSL_FLAG is set to true, setting up HTTPS server on port ${SERVER_PORT}`);
        options = await declareOptions({
            sops,
            fs: fsPromises,
            logger,
            constants,
            DECRYPT_KEYS: featureFlags.decryptKeysFlag,
            SSL_KEY: process.env.SERVER_SSL_KEY_PATH || null,
            SSL_CERT: process.env.SERVER_SSL_CERT_PATH || null,
            ciphers
        });
    } else {
        logger.info('SSL_FLAG is set to false, setting up HTTP server');
    }

    function startServer() {
        const server = options
            ? https.createServer(options, app)
            : http.createServer(app);

        server.listen(SERVER_PORT, () => {
            logger.info(`Server running on port ${SERVER_PORT}`);
        });

        gracefulShutdown(server, {
            signals: 'SIGINT SIGTERM',
            timeout: 30000,
            onShutdown: async () => {
                logger.info('Cleaning up resources before shutdown');

                const sequelize: Sequelize = getSequelizeInstance();

                try {
                    await sequelize.close();
                    logger.info('Database connection closed');
                } catch (error) {
                    logger.error(`Error closing database connection: ${error}`);
                }

                if (featureFlags.enableRedisFlag) {
                    logger.info('REDIS_FLAG is set to true. Closing redis connection');

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
        });
    }

    return { startServer };
}
