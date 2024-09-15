import RedisStore from 'connect-redis';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import cors from 'cors';
import csrf from 'csrf';
import { randomBytes } from 'crypto';
import express, { Application, RequestHandler } from 'express';
import session from 'express-session';
import { promises as fs } from 'fs';
import hpp from 'hpp';
import morgan, { StreamOptions } from 'morgan';
import passport, { AuthenticateOptions } from 'passport';
import responseTime from 'response-time';
import validator from 'validator';
import {
	helmetOptions,
	permissionsPolicyOptions
} from './config/securityOptions';
import { envVariables, FeatureFlags } from './config/envConfig';
import { errorClasses } from './errors/errorClasses';
import { ErrorLogger } from './errors/errorLogger';
import { expressErrorHandler, processError } from './errors/processError';
import { Logger } from './utils/logger';
import { getRedisClient } from './config/redis';
import sops, { SecretsMap } from './config/sops';
import { initializeCsrfMiddleware } from './middleware/csrf';
import { initializeIpBlacklistMiddleware } from './middleware/ipBlacklist';
import { initializeJwtAuthMiddleware } from './middleware/jwtAuth';
import { initializePassportAuthMiddleware } from './middleware/passportAuth';
import { initializeRateLimitMiddleware } from './middleware/rateLimit';
import { initializeSecurityHeaders } from './middleware/securityHeaders';
import {
	initializeSlowdownMiddleware,
	slowdownThreshold
} from './middleware/slowdown';
import { initializeValidatorMiddleware } from './middleware/validator';
import { validateDependencies } from './utils/validateDependencies';

export interface MiddlewareDependencies {
	express: typeof express;
	session: typeof session;
	secrets: SecretsMap;
	cookieParser: typeof cookieParser;
	cors: typeof cors;
	hpp: typeof hpp;
	morgan: typeof morgan;
	passport: typeof passport;
	randomBytes: typeof randomBytes;
	RedisStore: typeof RedisStore;
	redisClient: typeof getRedisClient;
	initializeCsrfMiddleware: typeof initializeCsrfMiddleware;
	getRedisClient: typeof getRedisClient;
	initializeIpBlacklistMiddleware: typeof initializeIpBlacklistMiddleware;
	initializeRateLimitMiddleware: typeof initializeRateLimitMiddleware;
	initializeSecurityHeaders: typeof initializeSecurityHeaders;
	logger: Logger;
	staticRootPath: string;
	featureFlags: FeatureFlags;
	expressErrorHandler: typeof expressErrorHandler;
	processError: typeof processError;
	verifyJwt: (token: string) => Promise<string | object | null>;
	initializeJwtAuthMiddleware: typeof initializeJwtAuthMiddleware;
	initializePassportAuthMiddleware: typeof initializePassportAuthMiddleware;
	authenticateOptions: AuthenticateOptions;
	initializeValidatorMiddleware: typeof initializeValidatorMiddleware;
	initializeSlowdownMiddleware: typeof initializeSlowdownMiddleware;
}

function initializeExpressMiddleware(
	app: Application,
	middleware: RequestHandler,
	middlewareName: string,
	logger: Logger
): void {
	try {
		logger.info(`Initializing standard middleware: ${middlewareName}`);
		app.use(middleware);
	} catch (depError) {
		const dependencyError = new errorClasses.DependencyErrorFatal(
			`Unable to initialize Express middleware ${middlewareName}`,
			{
				originalError: depError,
				exposeToClient: false
			}
		);
		ErrorLogger.logError(dependencyError, logger);
		processError(dependencyError, logger);
	}
}

export async function initializeAllMiddleware({
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
	redisClient,
	initializeCsrfMiddleware,
	initializeIpBlacklistMiddleware,
	initializeRateLimitMiddleware,
	initializeSecurityHeaders,
	logger,
	staticRootPath,
	featureFlags,
	expressErrorHandler,
	processError,
	verifyJwt,
	initializeJwtAuthMiddleware,
	initializePassportAuthMiddleware,
	authenticateOptions,
	initializeValidatorMiddleware
}: MiddlewareDependencies): Promise<Application> {
	try {
		const app = express();

		validateDependencies(
			[
				{ name: 'express', instance: express },
				{ name: 'session', instance: session },
				{ name: 'cookieParser', instance: cookieParser },
				{ name: 'secrets', instance: sops },
				{ name: 'cors', instance: cors },
				{ name: 'hpp', instance: hpp },
				{ name: 'morgan', instance: morgan },
				{ name: 'passport', instance: passport },
				{ name: 'randomBytes', instance: randomBytes },
				{ name: 'RedisStore', instance: RedisStore },
				{
					name: 'initializeCsrfMiddleware',
					instance: initializeCsrfMiddleware
				},
				{ name: 'getRedisClient', instance: getRedisClient },
				{
					name: 'initializeIpBlacklistMiddleware',
					instance: initializeIpBlacklistMiddleware
				},
				{
					name: 'initializeRateLimitMiddleware',
					instance: initializeRateLimitMiddleware
				},
				{
					name: 'initializeSecurityHeaders',
					instance: initializeSecurityHeaders
				},
				{ name: 'logger', instance: logger },
				{ name: 'staticRootPath', instance: staticRootPath },
				{ name: 'featureFlags', instance: featureFlags },
				{ name: 'expressErrorHandler', instance: expressErrorHandler },
				{ name: 'processError', instance: processError }
			],
			logger || console
		);

		// initialize body parser middlewares
		try {
			initializeExpressMiddleware(
				app,
				express.json(),
				'express.json',
				logger
			);
			initializeExpressMiddleware(
				app,
				express.urlencoded({ extended: true }),
				'express.urlencoded',
				logger
			);
		} catch (depError) {
			const dependency: string = 'Body Parser Middleware';
			const dependencyError = new errorClasses.DependencyErrorFatal(
				`Fatal error: Failed to initialize ${dependency}: Shutting down... ${depError instanceof Error ? depError.message : depError}.`,
				{
					exposeToClient: false
				}
			);
			ErrorLogger.logError(dependencyError, logger);
			processError(dependencyError, logger);
			process.exit(1);
		}

		// initialize cookie parser
		try {
			initializeExpressMiddleware(
				app,
				cookieParser(),
				'Cookie Parser',
				logger
			);
		} catch (depError) {
			const dependency: string = 'Cookie Parser';
			const dependencyError = new errorClasses.DependencyErrorFatal(
				`Failed to initialize ${dependency}: Shutting down... ${depError instanceof Error ? depError.message : depError}.`,
				{
					exposeToClient: false
				}
			);
			ErrorLogger.logError(dependencyError, logger);
			processError(dependencyError, logger);
			process.exit(1);
		}

		// initialize morgan logger
		const stream: StreamOptions = {
			write: (message: string) => logger.info(message.trim())
		};
		try {
			app.use(morgan('combined', { stream }));
		} catch (depError) {
			const dependency: string = 'Morgan Logger';
			const dependencyError = new errorClasses.DependencyErrorFatal(
				`Failed to initialize ${dependency}: Shutting down... ${depError instanceof Error ? depError.message : depError}.`,
				{
					exposeToClient: false
				}
			);
			ErrorLogger.logError(dependencyError, logger);
			processError(dependencyError, logger);
			process.exit(1);
		}

		// initialize CORS
		try {
			initializeExpressMiddleware(app, cors(), 'CORS', logger);
		} catch (depError) {
			const dependency: string = 'CORS';
			const dependencyError = new errorClasses.DependencyErrorFatal(
				`Failed to initialize ${dependency}: Shutting down... ${depError instanceof Error ? depError.message : depError}.`,
				{
					exposeToClient: false
				}
			);
			ErrorLogger.logError(dependencyError, logger);
			processError(dependencyError, logger);
			process.exit(1);
		}

		// initialize HPP
		try {
			initializeExpressMiddleware(app, hpp(), 'HPP', logger);
		} catch (depError) {
			const dependency: string = 'HPP';
			const dependencyError = new errorClasses.DependencyErrorFatal(
				`Failed to initialize ${dependency}: Shutting down... ${depError instanceof Error ? depError.message : depError}.`,
				{
					exposeToClient: false
				}
			);
			ErrorLogger.logError(dependencyError, logger);
			processError(dependencyError, logger);
			process.exit(1);
		}

		// initialize session with Redis store
		if (featureFlags.enableRedisFlag && !redisClient) {
			try {
				app.use(
					session({
						secret: secrets.SESSION_SECRET,
						resave: false,
						saveUninitialized: true,
						store:
							featureFlags.enableRedisFlag && redisClient
								? new RedisStore({ client: redisClient })
								: undefined,
						cookie: {
							secure: featureFlags.enableSslFlag,
							httpOnly: true,
							sameSite: 'strict'
						}
					})
				);
			} catch (depError) {
				const dependency: string = 'Session with Redis Store';
				const dependencyError = new errorClasses.DependencyErrorFatal(
					`Failed to initialize ${dependency}: Shutting down... ${depError instanceof Error ? depError.message : depError}.`,
					{
						exposeToClient: false
					}
				);
				ErrorLogger.logError(dependencyError, logger);
				processError(dependencyError, logger);
			}
		}

		// initialize passport
		try {
			app.use(passport.initialize());
			app.use(passport.session());
		} catch (depError) {
			const dependency: string = 'Passport';
			const dependencyError = new errorClasses.DependencyErrorFatal(
				`Failed to initialize ${dependency}: Shutting down... ${depError instanceof Error ? depError.message : depError}.`,
				{
					exposeToClient: false
				}
			);
			ErrorLogger.logError(dependencyError, logger);
			processError(dependencyError, logger);
			process.exit(1);
		}

		// initialize compression
		try {
			initializeExpressMiddleware(
				app,
				compression(),
				'Compression',
				logger
			);
		} catch (depError) {
			const dependency: string = 'Compression Middleware';
			const dependencyError = new errorClasses.DependencyErrorFatal(
				`Fatal error: Failed to initialize ${dependency}: Shutting down... ${depError instanceof Error ? depError.message : depError}.`,
				{
					exposeToClient: false
				}
			);
			ErrorLogger.logError(dependencyError, logger);
			processError(dependencyError, logger);
			process.exit(1);
		}

		// initialize response time
		try {
			initializeExpressMiddleware(
				app,
				responseTime(),
				'Response Time',
				logger
			);
		} catch (depError) {
			const dependency: string = 'Response Time Middleware';
			const dependencyError = new errorClasses.DependencyErrorFatal(
				`Fatal error: Failed to initialize ${dependency}: Shutting down... ${depError instanceof Error ? depError.message : depError}.`,
				{
					exposeToClient: false
				}
			);
			ErrorLogger.logError(dependencyError, logger);
			processError(dependencyError, logger);
			process.exit(1);
		}

		// set e-tag header for client-side caching
		app.set('etag', 'strong');

		// initialize security headers
		try {
			initializeSecurityHeaders(app, {
				helmetOptions,
				permissionsPolicyOptions
			});
		} catch (depError) {
			const dependency: string = 'Security Headers';
			const dependencyError = new errorClasses.DependencyErrorFatal(
				`Failed to initialize ${dependency}: Shutting down... ${depError instanceof Error ? depError.message : depError}.`,
				{
					exposeToClient: false
				}
			);
			ErrorLogger.logError(dependencyError, logger);
			processError(dependencyError, logger);
			process.exit(1);
		}

		const csrfProtection = new csrf();

		// initialize CSRF middleware
		try {
			app.use(initializeCsrfMiddleware({ logger, csrfProtection }));
		} catch (depError) {
			const dependency = 'CSRF Middleware';
			const dependencyError = new errorClasses.DependencyErrorFatal(
				`Failed to initialize ${dependency}: Shutting down... ${depError instanceof Error ? depError.message : depError}.`,
				{
					exposeToClient: false
				}
			);
			ErrorLogger.logError(dependencyError, logger);
			processError(dependencyError, logger);
			process.exit(1);
		}

		// initialize validator middleware
		try {
			initializeValidatorMiddleware({ validator, logger });
		} catch (depError) {
			const dependency: string = 'Validator Middleware';
			const dependencyError = new errorClasses.DependencyErrorFatal(
				`Failed to initialize ${dependency}: Shutting down... ${depError instanceof Error ? depError.message : depError}.`,
				{
					exposeToClient: false
				}
			);
			ErrorLogger.logError(dependencyError, logger);
			processError(dependencyError, logger);
			process.exit(1);
		}

		// initialize rate limiter
		if (featureFlags.enableRateLimitFlag) {
			try {
				initializeRateLimitMiddleware({ logger });
			} catch (depError) {
				const dependency: string = 'Rate Limit Middleware';
				const dependencyError = new errorClasses.DependencyErrorFatal(
					`Failed to initialize ${dependency}: Shutting down... ${depError instanceof Error ? depError.message : depError}.`,
					{
						exposeToClient: false
					}
				);
				ErrorLogger.logError(dependencyError, logger);
				processError(dependencyError, logger);
				process.exit(1);
			}
		}

		// initialize slowdown middleware
		try {
			initializeSlowdownMiddleware({ slowdownThreshold, logger });
		} catch (depError) {
			const dependency: string = 'Slowdown Middleware';
			const dependencyError = new errorClasses.DependencyErrorFatal(
				`Failed to initialize ${dependency}: Shutting down... ${depError instanceof Error ? depError.message : depError}.`,
				{
					exposeToClient: false
				}
			);
			ErrorLogger.logError(dependencyError, logger);
			processError(dependencyError, logger);
			process.exit(1);
		}

		// initialize IP blacklist middleware
		if (featureFlags.enableIpBlacklistFlag) {
			try {
				initializeIpBlacklistMiddleware({
					logger,
					featureFlags,
					envVariables,
					fsModule: fs
				});
			} catch (depError) {
				const dependency: string = 'IP Blacklist Middleware';
				const dependencyError = new errorClasses.DependencyErrorFatal(
					`Failed to initialize ${dependency}: Shutting down... ${depError instanceof Error ? depError.message : depError}.`,
					{
						exposeToClient: false
					}
				);
				ErrorLogger.logError(dependencyError, logger);
				processError(dependencyError, logger);
				process.exit(1);
			}
		}

		// initialize JWT authentication middleware
		try {
			await initializeJwtAuthMiddleware({
				logger,
				verifyJwt
			});
		} catch (depError) {
			const dependency: string = 'JWT Authentication Middleware';
			const dependencyError = new errorClasses.DependencyErrorFatal(
				`Failed to initialize ${dependency}: Shutting down... ${depError instanceof Error ? depError.message : depError}.`,
				{
					exposeToClient: false
				}
			);
			ErrorLogger.logError(dependencyError, logger);
			processError(dependencyError, logger);
			process.exit(1);
		}

		// initialize passport authentication middleware
		try {
			initializePassportAuthMiddleware({
				logger,
				passport,
				authenticateOptions
			});
		} catch (depError) {
			const dependency: string = 'Passport Authentication Middleware';
			const dependencyError = new errorClasses.DependencyErrorFatal(
				`Failed to initialize ${dependency}: Shutting down... ${depError instanceof Error ? depError.message : depError}.`,
				{
					exposeToClient: false
				}
			);
			ErrorLogger.logError(dependencyError, logger);
			processError(dependencyError, logger);
			process.exit(1);
		}

		// initialize error handler
		try {
			app.use(expressErrorHandler({ logger, featureFlags }));
		} catch (depError) {
			const dependency: string = 'Express Error Handler';
			const dependencyError = new errorClasses.DependencyErrorFatal(
				`Failed to initialize ${dependency}: Shutting down... ${depError instanceof Error ? depError.message : depError}.`,
				{
					exposeToClient: false
				}
			);
			ErrorLogger.logError(dependencyError, logger);
			processError(dependencyError, logger);
			process.exit(1);
		}

		return app;
	} catch (depError) {
		const dependency: string =
			'Bulk Middleware Initialization (initializeAllMiddleware())';
		const dependencyError = new errorClasses.DependencyErrorFatal(
			`Failed to execute ${dependency}: ${depError instanceof Error ? depError.message : depError}`,
			{
				exposeToClient: false
			}
		);
		ErrorLogger.logError(dependencyError, logger);
		processError(dependencyError, logger);
		process.exit(1);
	}
}
