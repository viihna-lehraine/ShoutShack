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
import hpp from 'hpp';
import morgan from 'morgan';
import passport from 'passport';
import os from 'os';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import { initializeApp } from './app';
import { getSequelizeInstance, initializeDatabase } from './config/db';
import {
	environmentVariables,
	FeatureFlags,
	getFeatureFlags,
	loadEnv
} from './config/environmentConfig';
import { setupHttp } from './config/http';
import { setupLogger } from './config/logger';
import configurePassport from './config/passport';
import { getRedisClient } from './config/redis';
import { createCsrfMiddleware } from './middleware/csrf';
import errorHandler from './middleware/errorHandler';
import { createIpBlacklist } from './middleware/ipBlacklist';
import { rateLimitMiddleware } from './middleware/rateLimit';
import { setupSecurityHeaders } from './middleware/securityHeaders';
import { initializeModels } from './models/ModelsIndex';
import createUserModel from './models/User';
import { initializeStaticRoutes } from './routes/staticRoutes';
import createTestRouter from './routes/testRoutes';
import { createMemoryMonitor } from './utils/memoryMonitor';
import sops from './utils/sops';

const logger = setupLogger();
const featureFlags: FeatureFlags = getFeatureFlags(logger);

const csrfProtection = new csrf();
const testRouter = createTestRouter({ logger });

const staticRootPath = environmentVariables.staticRootPath;

logger.info(`Static root path defined as ${staticRootPath}`);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function start(): Promise<void> {
	try {
		loadEnv({
			logger
		});

		try {
			logger.info('Logger is working');
		} catch (error) {
			console.warn(`Logger is not working! ${error}`);
		}

		if (environmentVariables.nodeEnv === 'development') {
			console.log('This is a test log');
			console.info('This is a test info log');
			console.warn('This is a test warning');
			console.error('This is a test error');
			console.debug('This is a test debug log');
		}

		logger.info('Initializing database');
		const sequelize = await initializeDatabase({
			logger,
			featureFlags,
			getSecrets: () =>
				sops.getSecrets({
					logger,
					execSync,
					getDirectoryPath: () => process.cwd()
				})
		});

		logger.info('Initializing models');
		initializeModels(sequelize, logger);

		logger.info('Initializing passport');
		const UserModel = createUserModel(sequelize, logger);
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
			staticRootPath
		});

		const dbSyncFlag = featureFlags?.dbSyncFlag ?? false;
		if (dbSyncFlag) {
			logger.info('Testing database connection and syncing models');
			await sequelize.sync();
			logger.info('Database and tables created!');
		}

		// Setup HTTP/HTTPS server
		const { startServer } = await setupHttp({
			app,
			sops,
			fs: fsPromises,
			logger,
			constants,
			getFeatureFlags: () => getFeatureFlags(logger),
			getRedisClient,
			getSequelizeInstance: () => getSequelizeInstance({ logger })
		});

		startServer();
	} catch (error) {
		logger.error('Unhandled error during server initialization:', error);
		process.exit(1);
	}
}

await start();
