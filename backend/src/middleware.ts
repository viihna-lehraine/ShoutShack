import RedisStore from 'connect-redis';
import cookieParser from 'cookie-parser';
import { execSync } from 'child_process';
import compression from 'compression';
import cors from 'cors';
import csrf from 'csrf';
import { randomBytes } from 'crypto';
import express, {
	Application,
	NextFunction,
	RequestHandler,
	Response
} from 'express';
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
import { environmentVariables, FeatureFlags } from './config/environmentConfig';
import { errorClasses, ErrorSeverity } from './errors/errorClasses';
import { handleErrorResponse } from './errors/errorHandler';
import { ErrorLogger } from './utils/errorLogger';
import { Logger } from './utils/logger';
import { getRedisClient } from './config/redis';
import sops, { SecretsMap } from './utils/sops';
import { initializeCsrfMiddleware } from './middleware/csrf';
import { expressErrorHandler } from './middleware/expressErrorHandler';
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
import { processError } from './utils/processError';
import { validateDependencies } from './utils/validateDependencies';

export interface MiddlewareDependencies {
	express: typeof express;
	res: Response;
	next: NextFunction;
	session: typeof session;
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
	createMemoryMonitor: () => void;
	logger: Logger;
	staticRootPath: string;
	featureFlags: FeatureFlags;
	expressErrorHandler: typeof expressErrorHandler;
	processError: typeof processError;
	secrets: SecretsMap;
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
	logger: Logger,
	res: Response,
	next: NextFunction
): void {
	try {
		logger.info(`Initializing standard middleware: ${middlewareName}`);
		app.use(middleware);
	} catch (error) {
		const appError = new errorClasses.DependencyError(
			`${middlewareName} initialization failed`,
			{
				originalError: error,
				severity: ErrorSeverity.FATAL
			}
		);
		ErrorLogger.log(appError);
		handleErrorResponse(appError, res, logger);
		next(appError);
	}
}

export async function initializeAllMiddleware({
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
	redisClient,
	initializeCsrfMiddleware,
	initializeIpBlacklistMiddleware,
	initializeRateLimitMiddleware,
	initializeSecurityHeaders,
	createMemoryMonitor,
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
				{ name: 'createMemoryMonitor', instance: createMemoryMonitor },
				{ name: 'logger', instance: logger },
				{ name: 'staticRootPath', instance: staticRootPath },
				{ name: 'featureFlags', instance: featureFlags },
				{ name: 'expressErrorHandler', instance: expressErrorHandler },
				{ name: 'processError', instance: processError }
			],
			logger || console
		);

		// fetch secrets securely
		let secrets: SecretsMap;
		try {
			secrets = await sops.getSecrets({
				logger,
				execSync,
				getDirectoryPath: () => process.cwd()
			});
		} catch (error) {
			throw new errorClasses.ConfigurationErrorFatal(
				'Failed to retrieve secrets',
				{
					originalError: error,
					errorSeverity: ErrorSeverity.FATAL
				}
			);
		}

		// initialize body parser middlewares
		initializeExpressMiddleware(
			app,
			express.json(),
			'express.json',
			logger,
			res,
			next
		);
		initializeExpressMiddleware(
			app,
			express.urlencoded({ extended: true }),
			'express.urlencoded',
			logger,
			res,
			next
		);

		// initialize cookie parser
		initializeExpressMiddleware(
			app,
			cookieParser(),
			'Cookie Parser',
			logger,
			res,
			next
		);

		// initialize morgan logger
		const stream: StreamOptions = {
			write: (message: string) => logger.info(message.trim())
		};
		try {
			app.use(morgan('combined', { stream }));
		} catch (error) {
			throw new errorClasses.ConfigurationError(
				'Failed to initialize morgan logger',
				{
					originalError: error,
					severity: ErrorSeverity.RECOVERABLE
				}
			);
		}

		// initialize CORS
		initializeExpressMiddleware(app, cors(), 'CORS', logger, res, next);

		// initialize HPP
		initializeExpressMiddleware(app, hpp(), 'HPP', logger, res, next);

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
			} catch (error) {
				throw new errorClasses.DependencyError(
					'Session initialization failed',
					{
						originalError: error,
						severity: ErrorSeverity.FATAL
					}
				);
			}
		}

		// initialize passport
		initializeExpressMiddleware(
			app,
			passport.initialize(),
			'Passport',
			logger,
			res,
			next
		);
		initializeExpressMiddleware(
			app,
			passport.session(),
			'Passport Session',
			logger,
			res,
			next
		);

		// initialize compression
		initializeExpressMiddleware(
			app,
			compression(),
			'Compression',
			logger,
			res,
			next
		);

		// initialize response time
		initializeExpressMiddleware(
			app,
			responseTime(),
			'Response Time',
			logger,
			res,
			next
		);

		// set e-tag header for client-side caching
		app.set('etag', 'strong');

		// initialize security headers
		try {
			initializeSecurityHeaders(app, {
				helmetOptions,
				permissionsPolicyOptions
			});
		} catch (error) {
			throw new errorClasses.ConfigurationError(
				'Failed to initialize security headers',
				{
					originalError: error,
					severity: ErrorSeverity.RECOVERABLE
				}
			);
		}

		const csrfProtection = new csrf();

		// initialize CSRF middleware
		try {
			app.use(initializeCsrfMiddleware({ logger, csrfProtection }));
		} catch (error) {
			throw new errorClasses.DependencyError(
				'Failed to initialize CSRF middleware',
				{
					originalError: error,
					severity: ErrorSeverity.FATAL
				}
			);
		}

		// initialize validator middleware
		try {
			initializeValidatorMiddleware({ validator, logger });
		} catch (error) {
			throw new errorClasses.DependencyError(
				'Failed to initialize validator middleware',
				{
					originalError: error,
					severity: ErrorSeverity.FATAL
				}
			);
		}

		// initialize memory monitor or Redis session based on flag
		if (!featureFlags.enableRedisFlag) {
			try {
				createMemoryMonitor();
			} catch (error) {
				throw new errorClasses.DependencyError(
					'Failed to initialize memory monitor',
					{
						originalError: error,
						severity: ErrorSeverity.FATAL
					}
				);
			}
		}

		// initialize rate limiter
		if (featureFlags.enableRateLimitFlag) {
			try {
				initializeRateLimitMiddleware({ logger });
			} catch (error) {
				throw new errorClasses.DependencyError(
					'Failed to initialize rate limit middleware',
					{
						originalError: error,
						severity: ErrorSeverity.FATAL
					}
				);
			}
		}

		// initialize slowdown middleware
		try {
			initializeSlowdownMiddleware({ slowdownThreshold, logger });
		} catch (error) {
			throw new errorClasses.DependencyError(
				'Failed to initialize slowdown middleware',
				{
					originalError: error,
					severity: ErrorSeverity.FATAL
				}
			);
		}

		// initialize IP blacklist middleware
		if (featureFlags.enableIpBlacklistFlag) {
			try {
				initializeIpBlacklistMiddleware({
					logger,
					featureFlags,
					environmentVariables,
					fsModule: fs
				});
			} catch (error) {
				throw new errorClasses.DependencyError(
					'Failed to initialize IP blacklist middleware',
					{
						originalError: error,
						severity: ErrorSeverity.FATAL
					}
				);
			}
		}

		// initialize JWT authentication middleware
		try {
			await initializeJwtAuthMiddleware({
				logger,
				verifyJwt
			});
		} catch (error) {
			throw new errorClasses.DependencyError(
				'Failed to initialize JWT authentication middleware',
				{
					originalError: error,
					severity: ErrorSeverity.FATAL
				}
			);
		}

		// initialize passport authentication middleware
		try {
			initializePassportAuthMiddleware({
				logger,
				passport,
				authenticateOptions
			});
		} catch (error) {
			throw new errorClasses.DependencyError(
				'Failed to initialize Passport authentication middleware',
				{
					originalError: error,
					severity: ErrorSeverity.FATAL
				}
			);
		}

		// initialize error handler
		try {
			app.use(expressErrorHandler({ logger, featureFlags }));
		} catch (error) {
			throw new errorClasses.DependencyError(
				'Failed to initialize Express error handler',
				{
					originalError: error,
					severity: ErrorSeverity.FATAL
				}
			);
		}

		return app;
	} catch (error) {
		processError(error as Error, logger || console);
		throw new Error(
			`Failed to initialize app. See logs for more details: ${error instanceof Error ? error.message : error}`
		);
	}
}
