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
import { AppError, ErrorClasses, ErrorSeverity } from './errors/errorClasses';
import { configurePassport } from './auth/passport';
import { initCsrf } from './middleware/csrf';
import { initializeModels } from './models/modelsIndex';
import { createUserModel } from './models/UserModelFile';
import { blankRequest } from './utils/constants';
import { InitializeDatabaseStaticParameters } from './index/parameters';
import { Sequelize } from 'sequelize';
import { ServiceFactory } from './index/factory';
import {
	AppLoggerServiceInterface,
	ErrorHandlerServiceInterface,
	ErrorLoggerServiceInterface
} from './index/interfaces';
import { EnvironmentService } from './services/environment';

let sequelize: Sequelize;

async function start(): Promise<void> {
	try {
		let logger: AppLoggerServiceInterface;
		let errorLogger: ErrorLoggerServiceInterface;

		return login()
			.then(({ encryptionKey, gpgPassphrase, adminId }) => {
				if (!encryptionKey || !gpgPassphrase) {
					throw new Error('Admin key(s) not found. Shutting down...');
				}

				if (!adminId) {
					throw new Error('Admin ID not found. Shutting down...');
				}

				const logger = ServiceFactory.getLoggerService();
				const errorLogger = ServiceFactory.getErrorLoggerService();
				const errorHandler = ServiceFactory.getErrorHandlerService();
				logger.setErrorHandler(errorHandler);
				EnvironmentService.getInstance();
				const configService = ServiceFactory.getConfigService();

				configService.initialize(encryptionKey, gpgPassphrase, adminId);
				const secrets = ServiceFactory.getSecretsStore();
				logger.setUpSecrets(secrets);

				setInterval(() => {
					secrets.clearExpiredSecretsFromMemory();
				}, configService.getEnvVariable('clearExpiredSecretsInterval'));

				setInterval(() => {
					secrets.batchReEncryptSecrets();
				}, configService.getEnvVariable('batchReEncryptSecretsInterval'));

				logger.info(
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
							blankRequest,
							'start_memory_monitor'
						),
						appLogger,
						ErrorSeverity.RECOVERABLE
					);
					processError({
						...ProcessErrorStaticParameters,
						error: memoryMonitorError,
						req: blankRequest,
						details: { reason: 'Failed to start memory monitor' }
					});
				}
			})
			.then(() => {
				return initializeDatabase(InitializeDatabaseStaticParameters)
					.then(sequelize => {
						initializeModels(sequelize, appLogger);

						if (
							configService.getFeatureFlags().dbSync ||
							configService.getEnvVariables().nodeEnv ===
								'production'
						) {
							appLogger.info('Synchronizing database');
							return sequelize.sync().then(() => void 0);
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
						processError({
							...ProcessErrorStaticParameters,
							error: databaseErrorFatal,
							req: blankRequest,
							details: { reason: 'Failed to initialize database' }
						});
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
								originalError: passportConfigError,
								statusCode: 500,
								severity: ErrorSeverity.FATAL,
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
					processError({
						...ProcessErrorStaticParameters,
						error: passportConfigErrorFatal,
						req: blankRequest,
						details: { reason: 'Failed to configure Passport' }
					});
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
										originalError: Error,
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
							processError({
								...ProcessErrorStaticParameters,
								error: redisError,
								req: blankRequest,
								details: {
									reason: 'Failed to get Redis client'
								}
							});
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
						processError({
							...ProcessErrorStaticParameters,
							error: initRedisError,
							req: blankRequest,
							details: { reason: 'Failed to initialize Redis' }
						});
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
					processError({
						...ProcessErrorStaticParameters,
						error: appInitErrorFatal,
						req: blankRequest,
						details: { reason: 'Fatal error during APP_INIT' }
					});
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
