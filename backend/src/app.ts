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
import { ipBlacklistMiddleware } from './middleware/ipBlacklist';
import { initializeRateLimitMiddleware } from './middleware/rateLimit';
import { initializeSecurityHeaders } from './middleware/securityHeaders';
import { expressErrorHandler } from './middleware/expressErrorHandler';
import { getRedisClient } from './config/redis';
import { initializeCsrfMiddleware } from './middleware/csrf';
import { createMemoryMonitor } from './middleware/memoryMonitor';
import os from 'os';
import process from 'process';
import { initializeRoutes } from './setupRoutes';
import { initializeValidatorMiddleware } from './middleware/validator';
import { initializeSlowdownMiddleware } from './middleware/slowdown';
import { processError } from './utils/processError';
import { validateDependencies } from './utils/validateDependencies';

let logger: Logger;

async function start(): Promise<void> {
	try {
		loadEnv();

		const staticRootPath = environmentVariables.staticRootPath;

		logger = setupLogger();
		logger.info('Logger successfully initialized');

		const featureFlags = {} as FeatureFlags;

		const memoryMonitor = createMemoryMonitor({
			logger,
			os,
			process,
			setInterval
		});

		const secrets = await sops.getSecrets({
			logger,
			execSync,
			getDirectoryPath: () => process.cwd()
		});

		validateDependencies(
			[
				{ name: 'logger', instance: logger },
				{ name: 'staticRootPath', instance: staticRootPath },
				{ name: 'featureFlags', instance: featureFlags }
			],
			logger
		);

		// test logger module writing functions in development
		if (environmentVariables.nodeEnv === 'development') {
			logger.debug('Testing logger levels...');
			console.log('Test log');
			console.info('Test info log');
			console.warn('Test warning');
			console.error('Test error');
			console.debug('Test debug log');
		}

		// database initialization
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

		// models initialization
		logger.info('Initializing models');
		initializeModels(sequelize, logger);

		// passport initialization
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

		// middleware initialization
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
			initializeCsrfMiddleware,
			getRedisClient,
			ipBlacklistMiddleware,
			initializeRateLimitMiddleware,
			initializeSecurityHeaders,
			createMemoryMonitor: memoryMonitor.startMemoryMonitor,
			logger,
			staticRootPath,
			featureFlags,
			expressErrorHandler,
			processError,
			secrets,
			verifyJwt: passport.authenticate('jwt', { session: false }),
			initializeJwtAuthMiddleware: () =>
				passport.authenticate('jwt', { session: false }),
			initializePassportAuthMiddleware: () =>
				passport.authenticate('local'),
			authenticateOptions: { session: false },
			initializeValidatorMiddleware,
			initializeSlowdownMiddleware
		});

		// initialize routes
		logger.info('Initializing routes');
		initializeRoutes({
			app,
			logger,
			featureFlags,
			staticRootPath
		});

		// sync database if flag is enabled
		const dbSyncFlag = featureFlags?.dbSyncFlag ?? false;
		if (environmentVariables.nodeEnv === 'production' || dbSyncFlag) {
			logger.info('Syncing database models');
			await sequelize.sync();
			logger.info('Database and tables created!');
		}

		const redisClient = await getRedisClient();

		// set up HTTP/HTTPS server
		await setupHttpServer({
			app,
			sops,
			fs: fsPromises,
			logger,
			constants,
			featureFlags,
			getRedisClient: () => redisClient,
			getSequelizeInstance: () => getSequelizeInstance({ logger })
		});
	} catch (error) {
		if (!logger) {
			console.error(
				`Critical error before logger setup: ${error instanceof Error ? error.stack : error}`
			);
			processError(error, console);
			process.exit(1);
		} else {
			logger.error(
				`Critical error before logger setup: ${error instanceof Error ? error.stack : error}`
			);
			processError(error, logger);
			process.exit(1);
		}
	}
}

await start();
