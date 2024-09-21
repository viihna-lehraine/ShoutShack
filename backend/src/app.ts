import argon2 from 'argon2';
import RedisStore from 'connect-redis';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { randomBytes } from 'crypto';
import express from 'express';
import session from 'express-session';
import { promises as fs } from 'fs';
import hpp from 'hpp';
import morgan from 'morgan';
import os from 'os';
import passport from 'passport';
import process from 'process';
import { createClient, RedisClientType } from 'redis';
import { Sequelize } from 'sequelize';
import { login } from './login';
import { initializeAllMiddleware } from './middleware';
import { setUpHttpServer } from './server';
import { initializeRoutes } from './routes';
import { configService } from './config/configService';
import { initializeDatabase } from './config/db';
import { errorClasses, ErrorSeverity } from './errors/errorClasses';
import { ErrorLogger } from './errors/errorLogger';
import { configurePassport } from './config/passport';
import { getRedisClient } from './config/redis';
import { envSecretsStore } from './environment/envSecrets';
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
import { AppLogger, handleCriticalError } from './utils/appLogger';

async function start(): Promise<void> {
	try {
		let appLogger: AppLogger | Console = console;

		try {
			const { encryptionKey, gpgPassphrase } = await login();

			if (!encryptionKey || !gpgPassphrase) {
				throw new Error('Admin key(s) not found. Shutting down...');
			}

			configService.initialize(encryptionKey, gpgPassphrase);

			console.log('ENVIRONMENT VARIABLES');
			console.table(configService.getEnvVariables());

			console.log('FEATURE FLAGS');
			console.table(configService.getFeatureFlags());

			appLogger = configService.getAppLogger() || console;

			setInterval(() => {
				envSecretsStore.clearExpiredSecretsFromMemory(appLogger);
			}, configService.getEnvVariables().clearExpiredSecretsInterval);

			setInterval(() => {
				envSecretsStore.batchReEncryptSecrets(appLogger);
			}, configService.getEnvVariables().batchReEncryptSecretsInterval);

			console.log(
				`Secrets store initialized. Let's get READY TO ROCK AND ROLL!!!`
			);
		} catch (appInitError) {
			if (configService.getAppLogger()) {
				const appInitErrorFatal =
					new errorClasses.ConfigurationErrorFatal(
						`Fatal error occurred during APP_INIT process\n${appInitError instanceof Error ? appInitError.message : String(appInitError)}\nShutting down...`,
						{
							originalError: appInitError,
							statusCode: 500,
							severity: ErrorSeverity.FATAL,
							exposeToClient: false
						}
					);
				ErrorLogger.logError(appInitErrorFatal);
				processError(appInitErrorFatal);
				throw appInitErrorFatal;
			} else {
				handleCriticalError(appInitError);
			}
		}

		try {
			const memoryMonitor = createMemoryMonitor({
				os,
				process,
				setInterval
			});
			memoryMonitor.startMemoryMonitor();
		} catch (error) {
			const memoryMonitorError = new errorClasses.UtilityErrorRecoverable(
				`Failed to start memory monitor\n${error instanceof Error ? error.message : String(error)}`,
				{
					originalError: error,
					statusCode: 500,
					severity: ErrorSeverity.RECOVERABLE,
					exposeToClient: false
				}
			);
			ErrorLogger.logError(memoryMonitorError);
			processError(memoryMonitorError);
		}

		// development only - logger test
		if (configService.getEnvVariables().nodeEnv === 'development') {
			(appLogger as AppLogger).debug('Testing logger levels...');
			console.log('Console test log');
			console.info('Test info log');
			console.warn('Test warning');
			console.error('Test error');
			console.debug('Test debug log');
		}

		let sequelize: Sequelize;
		try {
			sequelize = await initializeDatabase();
		} catch (dbError) {
			const databaseErrorFatal = new errorClasses.DatabaseErrorFatal(
				`Error occurred during database initialization\n${dbError instanceof Error ? dbError.message : String(dbError)}`,
				{
					originalError: dbError,
					statusCode: 500,
					severity: ErrorSeverity.FATAL,
					exposeToClient: false
				}
			);
			ErrorLogger.logError(databaseErrorFatal);
			processError(databaseErrorFatal);
			throw databaseErrorFatal;
		}

		try {
			initializeModels(sequelize, appLogger);
		} catch (loadModelError) {
			const loadModelErrorFatal = new errorClasses.DataIntegrityError(
				`Error occurred during model initialization\n${loadModelError instanceof Error ? loadModelError.message : String(loadModelError)}`,
				{
					originalError: loadModelError,
					statusCode: 500,
					severity: ErrorSeverity.FATAL,
					exposeToClient: false
				}
			);
			ErrorLogger.logError(loadModelErrorFatal);
			processError(loadModelErrorFatal);
			throw loadModelErrorFatal;
		}

		try {
			const UserModel = createUserModel(sequelize);
			await configurePassport({ passport, UserModel, argon2 });
		} catch (passportConfigError) {
			const passportConfigErrorFatal =
				new errorClasses.DependencyErrorFatal(
					`Error occurred during passport configuration\n${passportConfigError instanceof Error ? passportConfigError.message : String(passportConfigError)}`,
					{
						statusCode: 500,
						severity: ErrorSeverity.FATAL,
						originalError: passportConfigError,
						exposeToClient: false
					}
				);
			ErrorLogger.logError(passportConfigErrorFatal);
			processError(passportConfigErrorFatal);
			throw passportConfigErrorFatal;
		}

		const redisClient: RedisClientType | null =
			await getRedisClient(createClient);

		try {
			if (!redisClient) {
				const redisError = new errorClasses.DependencyErrorRecoverable(
					`Failed to get Redis client. Redis client is null\n${String(Error)}`,
					{
						originalError: String(Error),
						statusCode: 500,
						severity: ErrorSeverity.RECOVERABLE,
						exposeToClient: false
					}
				);
				ErrorLogger.logError(redisError);
				processError(redisError);
			}
		} catch (initRedisErrorRecoverable) {
			const initRedisError = new errorClasses.DependencyErrorRecoverable(
				`Failed to initialize Redis client\n${initRedisErrorRecoverable instanceof Error ? initRedisErrorRecoverable.message : String(initRedisErrorRecoverable)}`,
				{
					originalError: initRedisErrorRecoverable,
					statusCode: 500,
					severity: ErrorSeverity.RECOVERABLE,
					exposeToClient: false
				}
			);
			ErrorLogger.logError(initRedisError);
			processError(initRedisError);
		}

		appLogger.info('Initializing application middleware...');
		const app = await initializeAllMiddleware({
			express,
			session,
			fsModule: fs,
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

		initializeRoutes({ app });

		// sync database (if enabled)
		if (
			configService.getFeatureFlags().dbSync ||
			configService.getEnvVariables().nodeEnv === 'production'
		) {
			appLogger.info('Synchronizing database');
			try {
				await sequelize.sync();
				appLogger.info('Database synchronized successfully');
			} catch (dbSyncErrorRecoverable) {
				const dbSyncError = new errorClasses.DatabaseErrorRecoverable(
					`Failed to synchronize database: ${dbSyncErrorRecoverable instanceof Error ? dbSyncErrorRecoverable.message : dbSyncErrorRecoverable}`,
					{
						statusCode: 500,
						severity: ErrorSeverity.RECOVERABLE,
						originalError: dbSyncErrorRecoverable,
						exposeToClient: false
					}
				);
				ErrorLogger.logError(dbSyncError);
				processError(dbSyncError);
			}
		}

		await setUpHttpServer({
			app,
			sequelize
		});
	} catch (error) {
		const fallbackLogger = configService.getAppLogger();
		if (!fallbackLogger) {
			console.error(
				`Critical error occurred during startup\n${error instanceof Error ? error.message : String(error)}`
			);
			process.exit(1);
		} else {
			fallbackLogger.error(
				`Critical error occurred during startup\n${error instanceof Error ? error.message : String(error)}`
			);
			process.exit(1);
		}
	}
}

await start();
