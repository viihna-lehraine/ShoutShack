import passport from 'passport';
import { loadEnv } from './config/loadEnv';
import { initializeDatabase, configurePassport, setupHttp } from './index';
import { initializeApp } from './config/app';
import { getFeatureFlags } from './config/featureFlags';
import { getSequelizeInstance } from './config/db';
import setupLogger from './config/logger';
import { initializeModels } from './models/ModelsIndex';
import { getRedisClient } from './config/redis';
import { initializeStaticRoutes } from './routes/staticRoutes';
import { createCsrfMiddleware } from './middleware/csrf';
import errorHandler from './middleware/errorHandler';
import { createIpBlacklist } from './middleware/ipBlacklist';
import loadTestRoutes from './routes/testRoutes';
import { rateLimitMiddleware } from './middleware/rateLimit';
import { setupSecurityHeaders } from './middleware/securityHeaders';
import { createMemoryMonitor } from './utils/memoryMonitor';
import path from 'path';
import RedisStore from 'connect-redis';
import express from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import hpp from 'hpp';
import morgan from 'morgan';
import { randomBytes } from 'crypto';
import { Logger } from 'winston';
import fs from 'fs';
import { execSync } from 'child_process';
import sops from './config/sops';
import createUserModel from './models/User';
import argon2 from 'argon2';

loadEnv({ logger: setupLogger() });

const logger = setupLogger();

const NODE_ENV = process.env.NODE_ENV!;
const SSL_FLAG = process.env.FEATURE_ENABLE_SSL!;
const REDIS_FLAG = process.env.FEATURE_ENABLE_REDIS!;
const staticRootPath = process.env.STATIC_ROOT_PATH!;

const featureFlags = getFeatureFlags(logger);

try {
	logger.info('Logger is working');

	logger.info('Environment Variables:', {
		NODE_ENV: process.env.NODE_ENV,
		SERVER_PORT: process.env.SERVER_PORT,
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
		LOGGER: process.env.LOGGER,
		YUBICO_API_URL: process.env.YUBICO_API_URL
	});

	logger.info('Initializing database');
	// Initialize database
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
		createCsrfMiddleware,
		errorHandler,
		getRedisClient,
		ipBlacklistMiddleware: ipBlacklist.ipBlacklistMiddleware,
		loadTestRoutes,
		rateLimitMiddleware,
		setupSecurityHeaders,
		startMemoryMonitior: createMemoryMonitor,
		logger,
		staticRootPath,
		NODE_ENV,
		SSL_FLAG,
		REDIS_FLAG
	});

	const dbSyncFlag = featureFlags?.dbSyncFlag ?? false;
	if (dbSyncFlag) {
		logger.info('Testing database connection and syncing models');
		const sequelize = getSequelizeInstance();
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

	logger.info('Starting server');
	const { startServer } = await setupHttp(app);
	startServer();
	logger.info('Server started successfully!');
} catch (err) {
	logger.error('Unhandled error during server initialization:', err);
	process.exit(1);
}

export default startServer;
