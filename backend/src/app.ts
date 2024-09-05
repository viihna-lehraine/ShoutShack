import { execSync } from 'child_process';
import fsPromises from 'fs/promises';
import { initializeMiddleware } from './middleware';
import { setupHttpServer } from './server';
import { getSequelizeInstance, initializeDatabase } from './config/db';
import {
	environmentVariables,
	FeatureFlags,
	loadEnv
} from './config/environmentConfig';
import { Logger, setupLogger } from './config/logger';
import configurePassport from './config/passport';
import sops from './utils/sops';
import { initializeModels } from './models/ModelsIndex';
import createUserModel from './models/User';
import passport from 'passport';
import argon2 from 'argon2';
import express from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import hpp from 'hpp';
import morgan from 'morgan';
import { constants, randomBytes } from 'crypto';
import RedisStore from 'connect-redis';
import {
	initializeIpBlacklistDependencies,
	ipBlacklistMiddleware
} from './middleware/ipBlacklist';
import createRateLimitMiddleware from './middleware/rateLimit';
import { setupSecurityHeaders } from './middleware/securityHeaders';
import {
	expressErrorHandler,
	handleGeneralError,
	validateDependencies
} from './middleware/errorHandler';
import { getRedisClient } from './config/redis';
import { createCsrfMiddleware } from './middleware/csrf';
import { createMemoryMonitor } from './utils/memoryMonitor';
import os from 'os';
import process from 'process';
import { initializeRoutes } from './setupRoutes';

let logger: Logger;

const featureFlags = {} as FeatureFlags;

async function start(): Promise<void> {
	try {
		loadEnv();

		const staticRootPath = environmentVariables.staticRootPath;

		logger = setupLogger();
		logger.info('Logger successfully initialized');

		// Memory monitor setup
		const memoryMonitor = createMemoryMonitor({
			logger,
			os,
			process,
			setInterval
		});

		// Dependency validation
		validateDependencies(
			[
				{ name: 'logger', instance: logger },
				{ name: 'staticRootPath', instance: staticRootPath },
				{ name: 'featureFlags', instance: featureFlags }
			],
			logger
		);

		// Test logger module writing functions in development
		if (environmentVariables.nodeEnv === 'development') {
			logger.debug('Testing logger levels...');
			console.log('Test log');
			console.info('Test info log');
			console.warn('Test warning');
			console.error('Test error');
			console.debug('Test debug log');
		}

		// Initialize IP blacklist dependencies
		initializeIpBlacklistDependencies({
			logger,
			featureFlags,
			__dirname,
			fsModule: fsPromises
		});

		// Database initialization
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

		// Models initialization
		logger.info('Initializing models');
		initializeModels(sequelize, logger);

		// Passport initialization
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

		// Middleware initialization
		logger.info('Initializing middleware');
		const app = await initializeMiddleware({
			express,
			session,
			cookieParser,
			cors,
			hpp,
			morgan,
			passport,
			randomBytes,
			RedisStore,
			createCsrfMiddleware,
			getRedisClient,
			initializeIpBlacklistDependencies,
			ipBlacklistMiddleware,
			createRateLimitMiddleware,
			setupSecurityHeaders,
			createMemoryMonitor: memoryMonitor.startMemoryMonitor,
			logger,
			staticRootPath,
			featureFlags,
			expressErrorHandler,
			handleGeneralError
		});

		// Sync database if flag is enabled
		const dbSyncFlag = featureFlags?.dbSyncFlag ?? false;
		if (dbSyncFlag) {
			logger.info('Syncing database models');
			await sequelize.sync();
			logger.info('Database and tables created!');
		}

		// Setup HTTP/HTTPS server
		await setupHttpServer({
			app,
			sops,
			fs: fsPromises,
			logger,
			constants,
			featureFlags,
			getRedisClient,
			getSequelizeInstance: () => getSequelizeInstance({ logger })
		});
	} catch (error) {
		// Fallback in case logger isn't set up
		if (!logger) {
			console.error(
				`Critical error before logger setup: ${error instanceof Error ? error.stack : error}`
			);
			process.exit(1);
		}

		// Handle general errors with the logger
		logger.error(
			`Unhandled error during server initialization: ${error instanceof Error ? error.stack : error}`
		);
		handleGeneralError(error, logger);
		process.exit(1);
	}
}

await start();
