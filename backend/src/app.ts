import argon2 from 'argon2';
import { execSync } from 'child_process';
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
import path from 'path';
import process from 'process';
import { createClient, RedisClientType } from 'redis';
import { Sequelize } from 'sequelize';
import { login } from './login';
import { initializeAllMiddleware } from './middleware';
import { setUpHttpServer } from './server';
import { initializeRoutes } from './routes';
import { configService, initialize } from './config/configService';
import { initializeDatabase } from './config/db';
import { errorClasses, ErrorSeverity } from './errors/errorClasses';
import { ErrorLogger } from './errors/errorLogger';
import { configurePassport } from './config/passport';
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

async function start(): Promise<void> {
	try {
		try {
			const { encryptionKey, gpgPassphrase } = await login();

			if (!encryptionKey || !gpgPassphrase) {
				throw new Error(
					'Missing encryption key or GPG passphrase. Exiting.'
				);
			}

			configService.initialize(encryptionKey);

			// *DEV-NOTE* ADD THIS AS WELL AS AN ADMIN SECRETS STORE CLASS, LIKE SECRETSSTORE
			// If you have any additional GPG handling logic, handle that here
			// Example: someGPGService.initialize(gpgPassphrase);

			console.log(
				'Secrets store initialized This application is ready to ROCK AND ROLL!!!'
			);
		} catch (error) {
			throw error;
		}

		const appLogger = configService.getLogger();

		appLogger.info('Environment Variables');
		console.table(configService.getEnvVariables());

		appLogger.info('Feature Flags');
		console.table(configService.getFeatureFlags());

		const initSecretsDependencies = {
			execSync,
			getDirectoryPath: (): string =>
				path.resolve(__dirname, '../secrets'),
			appLogger: configService.getLogger()
		};
		initSecretsConfig(initSecretsDependencies);

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
				{ statusCode: 500, exposeToClient: false }
			);
			ErrorLogger.logError(memoryMonitorError);
			processError(memoryMonitorError);
		}

		// development only - logger test
		if (configService.getEnvVariables().nodeEnv === 'development') {
			appLogger.debug('Testing logger levels...');
			console.log('Test log');
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
		const fallbackLogger = configService.getLogger();
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
