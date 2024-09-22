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
import { createClient } from 'redis';
import { login } from './login';
import { initializeAllMiddleware } from './middleware';
import { initializeRoutes } from './routes';
import { configService } from './services/configService';
import { initializeDatabase } from './config/database';
import { AppError, errorClasses, ErrorSeverity } from './errors/errorClasses';
import { errorLogger } from './services/errorLogger';
import { configurePassport } from './auth/passport';
import { getRedisClient } from './services/redis';
import { envSecretsStore } from './environment/envSecrets';
import { displayEnvAndFeatureFlags } from './environment/envVars';
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
import { AppLogger, handleCriticalError } from './services/appLogger';
import { errorLoggerDetails } from './utils/helpers';
import { getCallerInfo } from './utils/helpers';
import { blankRequest } from './utils/helpers';

async function start(): Promise<void> {
	try {
		let appLogger: AppLogger;

		return login()
			.then(({ encryptionKey, gpgPassphrase, adminId }) => {
				if (!encryptionKey || !gpgPassphrase) {
					throw new Error('Admin key(s) not found. Shutting down...');
				}

				if (!adminId) {
					throw new Error('Admin ID not found. Shutting down...');
				}

				configService.initialize(encryptionKey, gpgPassphrase, adminId);

				appLogger = configService.getAppLogger();

				displayEnvAndFeatureFlags();

				setInterval(() => {
					envSecretsStore.clearExpiredSecretsFromMemory(appLogger);
				}, configService.getEnvVariables().clearExpiredSecretsInterval);

				setInterval(() => {
					envSecretsStore.batchReEncryptSecrets(appLogger);
				}, configService.getEnvVariables().batchReEncryptSecretsInterval);

				console.log(
					`Secrets store initialized. READY TO ROCK AND ROLL!!!`
				);
			})
			.then(() => {
				try {
					const memoryMonitor = createMemoryMonitor({
						os,
						process,
						setInterval
					});
					memoryMonitor.startMemoryMonitor();
				} catch (error) {
					const memoryMonitorError =
						new errorClasses.UtilityErrorRecoverable(
							`Failed to start memory monitor\n${error instanceof Error ? error.message : String(error)}`,
							{
								originalError: error,
								statusCode: 500,
								severity: ErrorSeverity.RECOVERABLE,
								exposeToClient: false
							}
						);
					errorLogger.logError(
						memoryMonitorError as AppError,
						errorLoggerDetails(
							getCallerInfo,
							blankRequest,
							'start_memory_monitor'
						),
						appLogger,
						ErrorSeverity.RECOVERABLE
					);
					processError(memoryMonitorError);
				}
			})
			.then(() => {
				return initializeDatabase()
					.then(sequelize => {
						initializeModels(sequelize, appLogger);

						if (
							configService.getFeatureFlags().dbSync ||
							configService.getEnvVariables().nodeEnv ===
								'production'
						) {
							appLogger.info('Synchronizing database');
							return sequelize.sync();
						}

						return Promise.resolve();
					})
					.catch(dbError => {
						const databaseErrorFatal =
							new errorClasses.DatabaseErrorFatal(
								`Error occurred during database initialization\n${dbError instanceof Error ? dbError.message : String(dbError)}`,
								{
									originalError: dbError,
									statusCode: 500,
									severity: ErrorSeverity.FATAL,
									exposeToClient: false
								}
							);
						errorLogger.logError(
							databaseErrorFatal as AppError,
							errorLoggerDetails(
								getCallerInfo,
								blankRequest,
								'DATABASE_INIT'
							),
							appLogger,
							ErrorSeverity.FATAL
						);
						processError(databaseErrorFatal);
						throw databaseErrorFatal;
					});
			})
			.then(() => {
				return configurePassport({
					passport,
					UserModel: createUserModel(sequelize),
					argon2
				}).catch(passportConfigError => {
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
					errorLogger.logError(
						passportConfigErrorFatal as AppError,
						errorLoggerDetails(
							getCallerInfo,
							blankRequest,
							'PASSPORT_CONFIG'
						),
						appLogger,
						ErrorSeverity.FATAL
					);
					processError(passportConfigErrorFatal);
					throw passportConfigErrorFatal;
				});
			})
			.then(() => {
				return getRedisClient(createClient)
					.then(redisClient => {
						if (!redisClient) {
							const redisError =
								new errorClasses.DependencyErrorRecoverable(
									`Failed to get Redis client. Redis client is null\n${String(Error)}`,
									{
										originalError: String(Error),
										statusCode: 500,
										severity: ErrorSeverity.RECOVERABLE,
										exposeToClient: false
									}
								);
							errorLogger.logError(
								redisError as AppError,
								errorLoggerDetails(
									getCallerInfo,
									blankRequest,
									'REDIS_CLIENT_FETCH'
								),
								appLogger,
								ErrorSeverity.RECOVERABLE
							);
							processError(redisError);
						}
					})
					.catch(initRedisErrorRecoverable => {
						const initRedisError =
							new errorClasses.DependencyErrorRecoverable(
								`Failed to initialize Redis client\n${initRedisErrorRecoverable instanceof Error ? initRedisErrorRecoverable.message : String(initRedisErrorRecoverable)}`,
								{
									originalError: initRedisErrorRecoverable,
									statusCode: 500,
									severity: ErrorSeverity.RECOVERABLE,
									exposeToClient: false
								}
							);
						errorLogger.logError(
							initRedisError as AppError,
							errorLoggerDetails(
								getCallerInfo,
								blankRequest,
								'REDIS_INIT'
							),
							appLogger,
							ErrorSeverity.RECOVERABLE
						);
						processError(initRedisError);
					});
			})
			.then(() => {
				return initializeAllMiddleware({
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
				}).then(app => {
					initializeRoutes({ app });
				});
			})
			.catch(appInitError => {
				const appLogger: AppLogger = configService.getAppLogger();
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
					errorLogger.logError(
						appInitErrorFatal as AppError,
						errorLoggerDetails(
							getCallerInfo,
							blankRequest,
							'APP_INIT'
						),
						appLogger,
						ErrorSeverity.FATAL
					);
					processError(appInitErrorFatal);
					throw appInitErrorFatal;
				} else {
					handleCriticalError(appInitError);
				}
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
