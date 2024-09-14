import argon2 from 'argon2';
import { execSync } from 'child_process';
import RedisStore from 'connect-redis';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { constants, randomBytes } from 'crypto';
import express, { NextFunction, Response } from 'express';
import session from 'express-session';
import fsPromises from 'fs/promises';
import hpp from 'hpp';
import morgan from 'morgan';
import os from 'os';
import passport from 'passport';
import process from 'process';
import { initializeAllMiddleware } from './middleware';
import { setUpHttpServer } from './server';
import { initializeRoutes } from './routes';
import { getSequelizeInstance, initializeDatabase } from './config/db';
import {
	environmentVariables,
	FeatureFlags,
	loadEnv
} from './config/environmentConfig';
import { errorClasses, ErrorSeverity } from './errors/errorClasses';
import { Logger, setupLogger } from './utils/logger';
import configurePassport from './config/passport';
import { getRedisClient } from './config/redis';
import { initializeCsrfMiddleware } from './middleware/csrf';
import { expressErrorHandler } from './middleware/expressErrorHandler';
import { initializeIpBlacklistMiddleware } from './middleware/ipBlacklist';
import { createMemoryMonitor } from './middleware/memoryMonitor';
import { initializeRateLimitMiddleware } from './middleware/rateLimit';
import { initializeSecurityHeaders } from './middleware/securityHeaders';
import { initializeValidatorMiddleware } from './middleware/validator';
import { initializeSlowdownMiddleware } from './middleware/slowdown';
import { initializeModels } from './models/modelsIndex';
import createUserModel from './models/UserModelFile';
import sops from './utils/sops';
import { processError } from './utils/processError';
import { validateDependencies } from './utils/validateDependencies';

let logger: Logger;

async function start(): Promise<void> {
	try {
		try {
			loadEnv();
		} catch (error) {
			throw new errorClasses.ConfigurationError(
				'Failed to load environment variables',
				{
					originalError: error,
					severity: ErrorSeverity.FATAL
				}
			);
		}

		const staticRootPath = environmentVariables.staticRootPath;

		try {
			logger = setupLogger();
			logger.info('Logger successfully initialized');
		} catch (error) {
			throw new errorClasses.DependencyError(
				'Logger initialization failed',
				{
					originalError: error,
					severity: ErrorSeverity.FATAL
				}
			);
		}

		const featureFlags = {} as FeatureFlags;

		let memoryMonitor;
		try {
			memoryMonitor = createMemoryMonitor({
				logger,
				os,
				process,
				setInterval
			});
		} catch (error) {
			throw new errorClasses.DependencyError(
				'Failed to create memory monitor',
				{
					originalError: error,
					severity: ErrorSeverity.RECOVERABLE
				}
			);
		}

		let secrets;
		try {
			secrets = await sops.getSecrets({
				logger,
				execSync,
				getDirectoryPath: () => process.cwd()
			});
		} catch (error) {
			throw new errorClasses.DependencyError('Failed to load secrets', {
				originalError: error,
				severity: ErrorSeverity.FATAL
			});
		}

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
		let sequelize;
		try {
			sequelize = await initializeDatabase({
				logger,
				featureFlags,
				getSecrets: () =>
					sops.getSecrets({
						logger,
						execSync,
						getDirectoryPath: () => process.cwd()
					})
			});
			logger.info('Database successfully initialized');
		} catch (error) {
			logger.error(`Error during database initialization: ${error}`);
			throw new errorClasses.DatabaseErrorFatal(
				'Failed to initialize the database',
				{
					originalError: error,
					severity: ErrorSeverity.FATAL
				}
			);
		}

		// models initialization
		try {
			logger.info('Initializing models');
			initializeModels(sequelize, logger);
		} catch (error) {
			throw new errorClasses.DataIntegrityError(
				'Failed to initialize models',
				{
					originalError: error,
					severity: ErrorSeverity.FATAL
				}
			);
		}

		// passport initialization
		try {
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
		} catch (error) {
			throw new errorClasses.AuthenticationError(
				'Passport initialization failed',
				{
					originalError: error,
					severity: ErrorSeverity.FATAL
				}
			);
		}

		// Redis initialization here
		let redisClient;
		try {
			redisClient = await getRedisClient();
		} catch (error) {
			throw new errorClasses.DependencyError('Redis', {
				originalError: error
			});
		}

		// middleware initialization
		let app;
		try {
			logger.info('Initializing middleware');
			app = await initializeAllMiddleware({
				express,
				res,
				next,
				session,
				cookieParser,
				cors,
				hpp,
				morgan,
				passport,
				randomBytes,
				RedisStore,
				redisClient: () => Promise.resolve(redisClient),
				initializeCsrfMiddleware,
				getRedisClient,
				initializeIpBlacklistMiddleware,
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
		} catch (error) {
			throw new errorClasses.DependencyError(
				'Middleware initialization failed',
				{
					originalError: error,
					severity: ErrorSeverity.FATAL
				}
			);
		}

		// initialize routes
		try {
			logger.info('Initializing routes');
			initializeRoutes({
				app,
				logger,
				featureFlags,
				staticRootPath
			});
		} catch (error) {
			throw new errorClasses.ConfigurationError(
				'Failed to initialize routes',
				{
					originalError: error,
					severity: ErrorSeverity.FATAL
				}
			);
		}

		// sync database if flag is enabled
		const dbSyncFlag = featureFlags?.dbSyncFlag ?? false;
		try {
			if (environmentVariables.nodeEnv === 'production' || dbSyncFlag) {
				logger.info('Syncing database models');
				await sequelize.sync();
				logger.info('Database and tables created!');
			}
		} catch (error) {
			throw new errorClasses.DatabaseErrorFatal('Database sync failed', {
				originalError: error,
				severity: ErrorSeverity.FATAL
			});
		}

		// set up HTTP/HTTPS server
		try {
			await setUpHttpServer({
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
			throw new errorClasses.DependencyError(
				'Failed to set up HTTP/HTTPS server',
				{
					originalError: error,
					severity: ErrorSeverity.FATAL
				}
			);
		}
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
