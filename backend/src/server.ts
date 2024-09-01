import argon2 from 'argon2';
import { execSync } from 'child_process';
import RedisStore from 'connect-redis';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { constants, randomBytes } from 'crypto';
import csrf from 'csrf';
import express from 'express';
import session from 'express-session';
import * as fs from 'fs';
import * as fsPromises from 'fs/promises';
import gracefulShutdown from 'http-graceful-shutdown';
import hpp from 'hpp';
import https from 'https';
import morgan from 'morgan';
import passport from 'passport';
import os from 'os';
import path, { dirname } from 'path';
import { Sequelize } from 'sequelize';
import { fileURLToPath } from 'url';
import { initializeApp } from './config/app';
import { getSequelizeInstance, initializeDatabase } from './config/db';
import { FeatureFlags, getFeatureFlags } from './config/featureFlags';
import { setupHttp } from './config/http';
import setupLogger from './config/logger';
import configurePassport from './config/passport';
import { getRedisClient } from './config/redis';
import { startServer } from './config/startServer';
import { createCsrfMiddleware } from './middleware/csrf';
import errorHandler from './middleware/errorHandler';
import { createIpBlacklist } from './middleware/ipBlacklist';
import { rateLimitMiddleware } from './middleware/rateLimit';
import { setupSecurityHeaders } from './middleware/securityHeaders';
import { initializeModels } from './models/ModelsIndex';
import createUserModel from './models/User';
import { initializeStaticRoutes } from './routes/staticRoutes';
import createTestRouter from './routes/testRoutes';
import { loadEnv } from './utils/loadEnv';
import { createMemoryMonitor } from './utils/memoryMonitor';
import sops from './utils/sops';

loadEnv({ logger: setupLogger() });

const logger = setupLogger();
const featureFlags: FeatureFlags = getFeatureFlags(logger);

const csrfProtection = new csrf();
const testRouter = createTestRouter({ logger });

const NODE_ENV = process.env.NODE_ENV!;
const SSL_FLAG = featureFlags.enableSslFlag;
const REDIS_FLAG = featureFlags.enableRedisFlag;
const SERVER_PORT = Number(process.env.SERVER_PORT) || 3000;
const staticRootPath = process.env.STATIC_ROOT_PATH!;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

try {
	logger.info('Logger is working');

	logger.info('Environment Variables:', {
		NODE_ENV: process.env.NODE_ENV,
		SERVER_PORT: parseInt(process.env.SERVER_PORT || '3000', 10),
		EMAIL_USER: process.env.EMAIL_USER,
		BACKEND_LOG_EXPORT_PATH: process.env.BACKEND_LOG_EXPORT_PATH,
		STATIC_ROOT_PATH: process.env.STATIC_ROOT_PATH,
		FRONTEND_APP_JS_PATH: process.env.FRONTEND_APP_JS_PATH,
		FRONTEND_BROWSER_CONFIG_XML_PATH:
			process.env.FRONTEND_BROWSER_CONFIG_XML_PATH,
		FRONTEND_CSS_PATH: process.env.FRONTEND_CSS_PATH,
		FRONTEND_FONTS_PATH: process.env.FRONTEND_FONTS_PATH,
		FRONTEND_HUMANS_MD_PATH: process.env.FRONTEND_HUMANS_MD_PATH,
		FRONTEND_ICONS_PATH: process.env.FRONTEND_ICONS_PATH,
		FRONTEND_IMAGES_PATH: process.env.FRONTEND_IMAGES_PATH,
		FRONTEND_JS_PATH: process.env.FRONTEND_JS_PATH,
		FRONTEND_KEYS_PATH: process.env.FRONTEND_KEYS_PATH,
		FRONTEND_LOGOS_PATH: process.env.FRONTEND_LOGOS_PATH,
		FRONTEND_ROBOTS_TXT_PATH: process.env.FRONTEND_ROBOTS_TXT_PATH,
		FRONTEND_SECURITY_MD_PATH: process.env.FRONTEND_SECURITY_MD_PATH,
		FRONTEND_SECRETS_PATH: process.env.FRONTEND_SECRETS_PATH,
		FRONTEND_SITEMAP_XML_PATH: process.env.FRONTEND_SITEMAP_XML_PATH,
		SERVER_DATA_FILE_PATH_1: process.env.SERVER_DATA_FILE_PATH_1,
		SERVER_DATA_FILE_PATH_2: process.env.SERVER_DATA_FILE_PATH_2,
		SERVER_DATA_FILE_PATH_3: process.env.SERVER_DATA_FILE_PATH_3,
		SERVER_DATA_FILE_PATH_4: process.env.SERVER_DATA_FILE_PATH_4,
		SERVER_LOG_PATH: process.env.SERVER_LOG_PATH,
		SERVER_NPM_LOG_PATH: process.env.SERVER_NPM_LOG_PATH,
		SERVER_SSL_KEY_PATH: process.env.SERVER_SSL_KEY_PATH,
		SERVER_SSL_CERT_PATH: process.env.SERVER_SSL_CERT_PATH,
		FEATURE_API_ROUTES_CSRF: process.env.FEATURE_API_ROUTES_CSRF,
		FEATURE_DB_SYNC: process.env.FEATURE_DB_SYNC,
		FEATURE_HTTPS_REDIRECT: process.env.FEATURE_HTTPS_REDIRECT,
		FEATURE_IP_BLACKLIST: process.env.FEATURE_IP_BLACKLIST,
		FEATURE_LOAD_STATIC_ROUTES: process.env.FEATURE_LOAD_STATIC_ROUTES,
		FEATURE_LOAD_TEST_ROUTES: process.env.FEATURE_LOAD_TEST_ROUTES,
		FEATURE_SECURE_HEADERS: process.env.FEATURE_SECURE_HEADERS,
		FEATURE_SEQUELIZE_LOGGING: process.env.FEATURE_SEQUELIZE_LOGGING,
		LOGGER: parseInt(process.env.LOGGER || '1', 10),
		YUBICO_API_URL: process.env.YUBICO_API_URL
	});

	logger.info('Initializing database');
	const sequelize = await initializeDatabase({
		logger,
		getFeatureFlags,
		getSecrets: () =>
			sops.getSecrets({
				logger,
				execSync,
				getDirectoryPath: () => process.cwd()
			})
	});

	logger.info('Initializing models');
	initializeModels(sequelize);

	logger.info('Initializing passport');
	const UserModel = createUserModel(sequelize);
	await configurePassport({
		passport,
		logger,
		getSecrets: () =>
			sops.getSecrets({
				logger,
				execSync,
				getDirectoryPath: () => process.cwd()
			}),
		UserModel,
		argon2
	});

	logger.info('Initializing IP blacklist');
	const ipBlacklist = createIpBlacklist({
		logger,
		featureFlags,
		__dirname,
		fsModule: fs
	});
	await ipBlacklist.initializeBlacklist();

	const csrfMiddleware = createCsrfMiddleware({
		featureFlags,
		logger,
		csrfProtection
	});

	const { startMemoryMonitor } = createMemoryMonitor({
		logger,
		os,
		process,
		setInterval
	});

	logger.info('Initializing app');
	const app = await initializeApp({
		express,
		session,
		cookieParser,
		cors,
		hpp,
		morgan,
		passport,
		randomBytes,
		path,
		RedisStore,
		initializeStaticRoutes,
		csrfMiddleware,
		errorHandler,
		getRedisClient,
		ipBlacklistMiddleware: ipBlacklist.ipBlacklistMiddleware,
		createTestRouter: app => app.use(testRouter),
		rateLimitMiddleware,
		setupSecurityHeaders,
		startMemoryMonitor,
		logger,
		staticRootPath,
		NODE_ENV,
		SSL_FLAG,
		REDIS_FLAG
	});

	const dbSyncFlag = featureFlags?.dbSyncFlag ?? false;
	if (dbSyncFlag) {
		logger.info('Testing database connection and syncing models');
		const sequelize = getSequelizeInstance({ logger });
		try {
			await sequelize.sync();
			logger.info('Database and tables created!');
		} catch (err) {
			logger.error(
				'Database Connection Test and Sync: Server error:',
				err
			);
			process.exit(1);
		}
	}

	// Setup HTTP/HTTPS server
	const { options } = await setupHttp({
		app,
		sops,
		fs: fsPromises,
		logger,
		constants,
		getFeatureFlags: () => getFeatureFlags(logger),
		getRedisClient,
		getSequelizeInstance: () => getSequelizeInstance({ logger }),
		initializeDatabase: async (): Promise<Sequelize> =>
			initializeDatabase({
				logger,
				getFeatureFlags: () => getFeatureFlags(logger),
				getSecrets: () =>
					sops.getSecrets({
						logger,
						execSync,
						getDirectoryPath: () => process.cwd()
					})
			}),
		SERVER_PORT,
		SSL_FLAG: featureFlags.enableSslFlag,
		REDIS_FLAG: featureFlags.enableRedisFlag
	});

	// Start server with appropriate options
	try {
		logger.info(`Starting HTTP server on port ${SERVER_PORT}`);
		logger.info('Initializing database before starting server.');

		const sequelize = getSequelizeInstance({ logger });
		await sequelize.authenticate();
		logger.info('Database connection has been established successfully.');

		let server;

		if (SSL_FLAG && options) {
			server = https
				.createServer(options, app)
				.listen(SERVER_PORT, () => {
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
} catch (err) {
	logger.error('Unhandled error during server initialization:', err);
	process.exit(1);
}

export default startServer;
