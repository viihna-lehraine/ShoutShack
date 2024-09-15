import argon2 from 'argon2';
import { execSync } from 'child_process';
import RedisStore from 'connect-redis';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { constants, randomBytes } from 'crypto';
import express from 'express';
import session from 'express-session';
import fsPromises from 'fs/promises';
import hpp from 'hpp';
import morgan from 'morgan';
import os from 'os';
import passport from 'passport';
import process from 'process';
import { createClient, RedisClientType } from 'redis';
import { initializeAllMiddleware } from './middleware';
import { setUpHttpServer } from './server';
import { initializeRoutes } from './routes';
import { initializeDatabase } from './config/db';
import { envVariables, FeatureFlags, loadEnv } from './config/envConfig';
import { errorClasses, ErrorSeverity } from './errors/errorClasses';
import { ErrorLogger } from './errors/errorLogger';
import configurePassport from './config/passport';
import { getRedisClient } from './config/redis';
import sops, { SecretsMap } from './config/sops';
import { expressErrorHandler, processError } from './errors/processError';
import { initializeCsrfMiddleware } from './middleware/csrf';
import { initializeIpBlacklistMiddleware } from './middleware/ipBlacklist';
import { createMemoryMonitor } from './middleware/memoryMonitor';
import { initializeRateLimitMiddleware } from './middleware/rateLimit';
import { initializeSecurityHeaders } from './middleware/securityHeaders';
import { initializeValidatorMiddleware } from './middleware/validator';
import { initializeSlowdownMiddleware } from './middleware/slowdown';
import { initializeModels } from './models/modelsIndex';
import createUserModel from './models/UserModelFile';
import { logger, Logger, setupLogger } from './utils/logger';
import { validateDependencies } from './utils/validateDependencies';

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

		const staticRootPath = envVariables.staticRootPath;

		let logger: Logger;
		try {
			logger = setupLogger();
			logger.info('Logger successfully initialized');
		} catch (error) {
			const dependencyError = new errorClasses.DependencyErrorFatal(
				'Fatal error occured: Logger service initializaton failed. Console logger fallback initialization has also failed. Shutting down now...',
				{
					originalError: error,
					exposeToClient: false
				}
			);
			ErrorLogger.logError(dependencyError, console);
			processError(dependencyError, console);
			process.exit(1);
		}

		let secrets: SecretsMap;
		try {
			secrets = await sops.getSecrets({
				logger,
				execSync,
				getDirectoryPath: () => process.cwd()
			});
		} catch (depError) {
			const dependency: string = 'Secrets';
			const dependencyError = new errorClasses.DependencyErrorFatal(
				`Failed to fetch ${dependency}: Shutting down... ${depError instanceof Error ? depError.message : depError}.`,
				{
					exposeToClient: false
				}
			);
			ErrorLogger.logError(dependencyError, logger);
			processError(dependencyError, logger);
			process.exit(1);
		}

		const featureFlags = {} as FeatureFlags;

		try {
			const memoryMonitor = createMemoryMonitor({
				logger,
				os,
				process,
				setInterval
			});

			memoryMonitor.startMemoryMonitor();
		} catch (depError) {
			const dependency: string = 'Memory Monitor';
			const dependencyError = new errorClasses.DependencyErrorRecoverable(
				`Failed to initialize ${dependency}: ${depError instanceof Error ? depError.message : depError}`,
				{
					exposeToClient: false
				}
			);
			ErrorLogger.logError(dependencyError, logger);
			processError(dependencyError, logger);
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
		if (envVariables.nodeEnv === 'development') {
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
			throw new errorClasses.AppAuthenticationError(
				'Passport initialization failed',
				{
					originalError: error,
					severity: ErrorSeverity.FATAL
				}
			);
		}

		// redis initialization
		let redisClient: RedisClientType | null = null;
		try {
			redisClient = await getRedisClient(createClient);
			if (!redisClient) {
				const dependency: string = 'Redis';
				const dependencyError =
					new errorClasses.DependencyErrorRecoverable(
						`Failed to initialize ${dependency}`,
						{
							exposeToClient: false
						}
					);
				ErrorLogger.logError(dependencyError, logger);
				processError(dependencyError, logger);
			}
		} catch (depError) {
			const dependency: string = 'Redis';
			const dependencyError = new errorClasses.DependencyErrorRecoverable(
				`Failed to initialize ${dependency}: ${depError instanceof Error ? depError.message : depError}`,
				{
					exposeToClient: false
				}
			);
			ErrorLogger.logError(dependencyError, logger);
			processError(dependencyError, logger);
		}

		logger.info('Initializing middleware');
		const app = await initializeAllMiddleware({
			express,
			session,
			secrets,
			cookieParser,
			cors,
			hpp,
			morgan,
			passport,
			randomBytes,
			RedisStore,
			redisClient: () => getRedisClient(createClient),
			initializeCsrfMiddleware,
			getRedisClient,
			initializeIpBlacklistMiddleware,
			initializeRateLimitMiddleware,
			initializeSecurityHeaders,
			logger,
			staticRootPath,
			featureFlags,
			expressErrorHandler,
			processError,
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
		try {
			logger.info('Initializing routes');
			initializeRoutes({
				app,
				logger,
				featureFlags,
				staticRootPath
			});
		} catch (configError) {
			const configurationError = new errorClasses.ConfigurationError(
				`Failed to initialize routes ${configError instanceof Error ? configError.message : configError}`,
				{
					exposeToClient: false
				}
			);
			ErrorLogger.logError(configurationError, logger);
			processError(configurationError, logger);
			process.exit(1);
		}

		// sync database if flag is enabled
		const dbSyncFlag = featureFlags?.dbSyncFlag ?? false;
		try {
			if (envVariables.nodeEnv === 'production' || dbSyncFlag) {
				logger.info('Syncing database models');
				await sequelize.sync();
				logger.info('Database and tables created!');
			}
		} catch (dbError) {
			const databaseError = new errorClasses.DatabaseErrorRecoverable(
				`Failed to synchronize database ${dbError instanceof Error ? dbError.message : dbError}`,
				{
					exposeToClient: false
				}
			);
			ErrorLogger.logError(databaseError, logger);
			processError(databaseError, logger);
		}

		// set up HTTP/HTTPS server
		await setUpHttpServer({
			app,
			sops,
			fs: fsPromises,
			logger,
			constants,
			featureFlags,
			getRedisClient: () => redisClient,
			sequelize
		});
	} catch (error) {
		if (!logger) {
			const dependencyError = new errorClasses.DependencyErrorRecoverable(
				'Logger initialization failed',
				{ exposeToClient: false }
			);
			ErrorLogger.logError(dependencyError, console);
			processError(error, console);
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
