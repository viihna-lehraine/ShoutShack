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
import {
	envVariablesStore,
	envSecretsStore,
	initializeEnvConfig
} from './environment/envConfig';
import { envVariables, FeatureFlagTypes, loadEnv } from './environment/envVars';
import { errorClasses, ErrorSeverity } from './errors/errorClasses';
import { ErrorLogger } from './errors/errorLogger';
import configurePassport from './config/passport';
import { getRedisClient } from './config/redis';

import { expressErrorHandler, processError } from './errors/processError';
import { initializeCsrfMiddleware } from './middleware/csrf';
import { initializeIpBlacklistMiddleware } from './middleware/ipBlacklist';
import { createMemoryMonitor } from './middleware/memoryMonitor';
import { initializeRateLimitMiddleware } from './middleware/rateLimit';
import { initializeSecurityHeaders } from './middleware/securityHeaders';
import { initializeValidatorMiddleware } from './middleware/validator';
import { initializeSlowdownMiddleware } from './middleware/slowdown';
import { initializeModels } from './models/modelsIndex';
import { createUserModel } from './models/UserModelFile';
import { logger, Logger } from './utils/logger';
import { validateDependencies } from './utils/validateDependencies';

async function start(): Promise<void> {
	try {
		try {
			loadEnv();

			initializeEnvConfig({
				appLogger: logger,
				execSync,
				getDirectoryPath: () => process.cwd()
			});

			const featureFlags: FeatureFlagTypes = envVariablesStore.getFeatureFlags();
		} catch (error) {
			if (error instanceof Error) {
				ErrorLogger.logCritical(
					error.message
						? error.message
						: 'Fatal error occured\n Failed to initialize secrets, flags, and other environment variables',
					console
				);
			} else {
				ErrorLogger.logCritical(
					'Fatal error occured\n Failed to fetch envVariables',
					console
				);
			}
			throw new errorClasses.ConfigurationErrorFatal(
				`Failed to load environment variables \n${error instanceof Error ? error.message : error}`,
				{
					statusCode: 404,
					exposeToClient: false
				}
			);
		}

		const envVariablesStore = EnvVariablesStore.getInstance();
		const featureFlags: FeatureFlagTypes =
			envVariablesStore.getFeatureFlags();
		const envSecretsStore = EnvSecretsStore.getInstance();
		const envSecrets = envSecretsStore.getEnvSecrets();

		console.log('Environment Variables');
		console.table(envVariablesStore.getEnvVariables());

		console.log('Feature Flags');
		console.table(`${envVariablesStore.getFeatureFlags()}`);

		const staticRootPath = envVariables.staticRootPath;

		const appLogger: Logger = logger;
		try {
			appLogger.info('Logger successfully initialized');
		} catch (error) {
			const appLoggerError = new errorClasses.DependencyErrorFatal(
				`appLogger initialization failed. Shutting down now... \n${error instanceof Error ? error.message : error}`,
				{
					statusCode: 500,
					exposeToClient: false
				}
			);
			ErrorLogger.logError(appLoggerError, console);
			processError(appLoggerError, console);
			process.exit(1);
		}

		try {
			await envSecretsStore.loadSecrets({
				appLogger,
				execSync,
				getDirectoryPath: () => process.cwd()
			});
			appLogger.info('Secrets loaded');
		} catch (configurationError) {
			const loadSecretsError = new errorClasses.ConfigurationErrorFatal(
				`Fatal error occurred: Unable to fetch envSecrets \nShutting down... ${configurationError instanceof Error ? configurationError.message : configurationError}.`,
				{
					statusCode: 404,
					exposeToClient: false
				}
			);
			ErrorLogger.logCritical(loadSecretsError.message, logger);
			processError(loadSecretsError, logger);
			process.exit(1);
		}

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
			appLogger.debug('Testing logger levels...');
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
				envSecrets
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
				envSecrets,
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
