import https from 'https';
import { Application } from 'express';
import { Sequelize } from 'sequelize';
import gracefulShutdown from 'http-graceful-shutdown';

export async function startServer({
    app,
    options,
    logger,
    SERVER_PORT,
    SSL_FLAG,
    getSequelizeInstance,
    getRedisClient,
    REDIS_FLAG,
}: {
    app: Application;
    options: any;
    logger: any;
    SERVER_PORT: number;
    SSL_FLAG: boolean;
    getSequelizeInstance: () => Sequelize;
    getRedisClient: () => any;
    REDIS_FLAG: boolean;
}) {
    try {
        logger.info(`Starting HTTP server on port ${SERVER_PORT}`);
        logger.info('Initializing database before starting server.');

        const sequelize = getSequelizeInstance();
        await sequelize.authenticate();
        logger.info('Database connection has been established successfully.');

        let server;

        if (SSL_FLAG && options) {
            server = https.createServer(options, app).listen(SERVER_PORT, () => {
                logger.info(`HTTPS server running on port ${SERVER_PORT}`);
            });
        } else {
            server = app.listen(SERVER_PORT, () => {
                logger.info(`HTTP server running on port ${SERVER_PORT}`);
            });
        }

        gracefulShutdown(server, {
            signals: 'SIGINT SIGTERM',
            timeout: 30000,
            development: false,
            onShutdown: async () => {
                try {
                    await sequelize.close();
                    logger.info('Database connection closed');

                    if (REDIS_FLAG) {
                        const redisClient = getRedisClient();
                        if (redisClient) {
                            await redisClient.quit();
                            logger.info('Redis connection closed');
                        }
                    }
                    logger.close();
                    console.log('Logger closed');
                } catch (error) {
                    logger.error(`Error during shutdown: ${error}`);
                }
            },
            finally: () => console.log('Server has gracefully shut down')
        });
    } catch (error) {
        logger.error(`Failed to start server: ${error}`);
        process.exit(1);
    }
}
