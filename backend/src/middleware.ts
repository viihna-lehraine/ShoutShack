import RedisStore from 'connect-redis';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import cors from 'cors';
import { randomBytes } from 'crypto';
import express, { Application, RequestHandler } from 'express';
import session from 'express-session';
import { promises as fs } from 'fs';
import hpp from 'hpp';
import morgan, { StreamOptions } from 'morgan';
import passport, { AuthenticateOptions } from 'passport';
import responseTime from 'response-time';
import validator from 'validator';
import { configService } from './config/configService';
import {
	helmetOptions,
	permissionsPolicyOptions
} from './config/securityOptions';
import { errorClasses, ErrorSeverity } from './errors/errorClasses';
import { ErrorLogger } from './errors/errorLogger';
import { expressErrorHandler, processError } from './errors/processError';
import { getRedisClient } from './config/redis';
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
import { ensureSecrets } from './utils/ensureSecrets';
import { validateDependencies } from './utils/validateDependencies';

export interface MiddlewareDependencies {
	express: typeof express;
	session: typeof session;
	fsModule: typeof fs;
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
	middlewareName: string
): void {
	const appLogger = configService.getLogger();

	validateDependencies(
		[
			{ name: 'middleware', instance: middleware },
			{ name: 'middlewareName', instance: middlewareName }
		],
		appLogger || console
	);

	try {
		appLogger.info(`Initializing Express middleware ${middlewareName}`);
		app.use(middleware);
	} catch (expressMiddlewareError) {
		const initExpressMiddlewareError =
			new errorClasses.DependencyErrorFatal(
				`Fatal error occurred. Unable to initialize Express middleware dependency ${middlewareName}\nShutting down...\n${expressMiddlewareError instanceof Error ? expressMiddlewareError.message : expressMiddlewareError}.`,
				{
					dependency: middlewareName,
					originalError: expressMiddlewareError,
					statusCode: 500,
					severity: ErrorSeverity.FATAL,
					exposeToClient: false
				}
			);
		ErrorLogger.logError(initExpressMiddlewareError);
		processError(initExpressMiddlewareError);
		throw initExpressMiddlewareError;
	}
}

export async function initializeAllMiddleware({
	express,
	session,
	cookieParser,
	cors,
	fsModule,
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
		const appLogger = configService.getLogger();
		const featureFlags = configService.getFeatureFlags();
		const secrets = ensureSecrets({ subSecrets: ['sessionSecret'] });

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
				}
			],
			appLogger || console
		);

		appLogger.info('Initializing application middleware stack...');

		// initialize body parser middlewares
		try {
			initializeExpressMiddleware(app, express.json(), 'express.json');
			initializeExpressMiddleware(
				app,
				express.urlencoded({ extended: true }),
				'express.urlencoded'
			);
		} catch (depError) {
			const dependencyError = new errorClasses.DependencyErrorFatal(
				`Fatal error: Unable to initialize middleware dependency 'Body Parser'.\nShutting down...\n${depError instanceof Error ? depError.message : depError}.`,
				{
					dependency: 'Body Parser',
					originalError: depError,
					statusCode: 500,
					severity: ErrorSeverity.FATAL,
					exposeToClient: false
				}
			);
			ErrorLogger.logError(dependencyError);
			processError(dependencyError);
			throw dependencyError;
		}

		// initialize cookie parser
		try {
			initializeExpressMiddleware(app, cookieParser(), 'Cookie Parser');
		} catch (depError) {
			const dependencyError = new errorClasses.DependencyErrorFatal(
				`Fatal error: Unable to initialize middleware dependency 'Cookie Parser'.\nShutting down...\n${depError instanceof Error ? depError.message : depError}.`,
				{
					dependency: 'Cookie Parser',
					originalError: depError,
					statusCode: 500,
					severity: ErrorSeverity.FATAL,
					exposeToClient: false
				}
			);
			ErrorLogger.logError(dependencyError);
			processError(dependencyError);
			throw dependencyError;
		}

		// initialize morgan logger
		const stream: StreamOptions = {
			write: (message: string) => appLogger.info(message.trim())
		};
		try {
			app.use(morgan('combined', { stream }));
		} catch (depError) {
			const dependencyError = new errorClasses.DependencyErrorFatal(
				`Fatal error: Unable to initialize middleware dependency Morgan Logger.\nShutting down...\n${depError instanceof Error ? depError.message : depError}.`,
				{
					dependency: 'Morgan Logger',
					originalError: depError,
					statusCode: 500,
					severity: ErrorSeverity.FATAL,
					exposeToClient: false
				}
			);
			ErrorLogger.logError(dependencyError);
			processError(dependencyError);
			throw dependencyError;
		}

		// initialize CORS
		try {
			initializeExpressMiddleware(app, cors(), 'CORS');
		} catch (depError) {
			const dependencyError = new errorClasses.DependencyErrorFatal(
				`Fatal error: Unable to initialize middleware depedendency 'CORS'.\nShutting down...\n${depError instanceof Error ? depError.message : depError}.`,
				{
					dependency: 'CORS',
					originalError: depError,
					statusCode: 500,
					severity: ErrorSeverity.FATAL,
					exposeToClient: false
				}
			);
			ErrorLogger.logError(dependencyError);
			processError(dependencyError);
			throw dependencyError;
		}

		// initialize HPP
		try {
			initializeExpressMiddleware(app, hpp(), 'HPP');
		} catch (depError) {
			const dependencyError = new errorClasses.DependencyErrorFatal(
				`Fatal error: Unable to initialize dependency HPP: Shutting down... ${depError instanceof Error ? depError.message : depError}.`,
				{
					dependency: 'HPP',
					originalError: depError,
					statusCode: 500,
					severity: ErrorSeverity.FATAL,
					exposeToClient: false
				}
			);
			ErrorLogger.logError(dependencyError);
			processError(dependencyError);
			throw dependencyError;
		}

		// initialize session with Redis store
		if (featureFlags.enableRedis && !redisClient) {
			try {
				app.use(
					session({
						secret: secrets.sessionSecret,
						resave: false,
						saveUninitialized: true,
						store:
							featureFlags.enableRedis && redisClient
								? new RedisStore({ client: redisClient })
								: undefined,
						cookie: {
							secure: featureFlags.enableTLS,
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
						dependency,
						originalError: depError,
						statusCode: 500,
						severity: ErrorSeverity.FATAL,
						exposeToClient: false
					}
				);
				ErrorLogger.logError(dependencyError);
				processError(dependencyError);
				process.exit(1);
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
			ErrorLogger.logError(dependencyError);
			processError(dependencyError);
			process.exit(1);
		}

		// initialize compression
		try {
			initializeExpressMiddleware(app, compression(), 'Compression');
		} catch (depError) {
			const dependencyError = new errorClasses.DependencyErrorFatal(
				`Fatal error: Unable to initialize middleware dependency 'Compression'.\nShutting down...\n${depError instanceof Error ? depError.message : depError}.`,
				{
					dependency: 'Compression Middleware',
					originalError: depError,
					statusCode: 500,
					severity: ErrorSeverity.FATAL,
					exposeToClient: false
				}
			);
			ErrorLogger.logError(dependencyError);
			processError(dependencyError);
			throw dependencyError;
		}

		// initialize response time
		try {
			initializeExpressMiddleware(app, responseTime(), 'Response Time');
		} catch (depError) {
			const dependencyError = new errorClasses.DependencyErrorFatal(
				`Fatal error: Failed to initialize middleware dependency 'Response Time'\nShutting down...\n${depError instanceof Error ? depError.message : depError}.`,
				{
					dependency: 'Response Time Middleware',
					originalError: depError,
					statusCode: 500,
					severity: ErrorSeverity.FATAL,
					exposeToClient: false
				}
			);
			ErrorLogger.logError(dependencyError);
			processError(dependencyError);
			throw dependencyError;
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
			const dependencyError = new errorClasses.DependencyErrorFatal(
				`Fatal error: Failed to initialize middleware dependency 'Security Headers'\nShutting down...\n${depError instanceof Error ? depError.message : depError}.`,
				{
					dependency: 'Security Headers',
					originalError: depError,
					statusCode: 500,
					severity: ErrorSeverity.FATAL,
					exposeToClient: false
				}
			);
			ErrorLogger.logError(dependencyError);
			processError(dependencyError);
			throw dependencyError;
		}

		// initialize CSRF middleware
		try {
			app.use(initializeCsrfMiddleware());
		} catch (depError) {
			const dependency = 'CSRF Middleware';
			const dependencyError = new errorClasses.DependencyErrorFatal(
				`Failed to initialize ${dependency}: Shutting down... ${depError instanceof Error ? depError.message : depError}.`,
				{
					exposeToClient: false
				}
			);
			ErrorLogger.logError(dependencyError);
			processError(dependencyError);
			process.exit(1);
		}

		// initialize validator middleware
		try {
			initializeValidatorMiddleware({ validator, appLogger });
		} catch (depError) {
			const dependency: string = 'Validator Middleware';
			const dependencyError = new errorClasses.DependencyErrorFatal(
				`Failed to initialize ${dependency}: Shutting down... ${depError instanceof Error ? depError.message : depError}.`,
				{
					exposeToClient: false
				}
			);
			ErrorLogger.logError(dependencyError);
			processError(dependencyError);
			process.exit(1);
		}

		// initialize rate limiter
		if (featureFlags.enableRateLimit) {
			try {
				initializeRateLimitMiddleware();
			} catch (depError) {
				const dependency: string = 'Rate Limit Middleware';
				const dependencyError = new errorClasses.DependencyErrorFatal(
					`Failed to initialize ${dependency}: Shutting down... ${depError instanceof Error ? depError.message : depError}.`,
					{
						exposeToClient: false
					}
				);
				ErrorLogger.logError(dependencyError);
				processError(dependencyError);
				process.exit(1);
			}
		}

		// initialize slowdown middleware
		try {
			initializeSlowdownMiddleware({ slowdownThreshold });
		} catch (depError) {
			const dependency: string = 'Slowdown Middleware';
			const dependencyError = new errorClasses.DependencyErrorFatal(
				`Failed to initialize ${dependency}: Shutting down... ${depError instanceof Error ? depError.message : depError}.`,
				{
					exposeToClient: false
				}
			);
			ErrorLogger.logError(dependencyError);
			processError(dependencyError);
			process.exit(1);
		}

		// initialize IP blacklist middleware
		if (featureFlags.enableIpBlacklist) {
			try {
				initializeIpBlacklistMiddleware(fsModule);
			} catch (depError) {
				const dependency: string = 'IP Blacklist Middleware';
				const dependencyError = new errorClasses.DependencyErrorFatal(
					`Failed to initialize ${dependency}: Shutting down... ${depError instanceof Error ? depError.message : depError}.`,
					{
						exposeToClient: false
					}
				);
				ErrorLogger.logError(dependencyError);
				processError(dependencyError);
				process.exit(1);
			}
		}

		// initialize JWT authentication middleware
		try {
			await initializeJwtAuthMiddleware({ verifyJwt });
		} catch (depError) {
			const dependency: string = 'JWT Authentication Middleware';
			const dependencyError = new errorClasses.DependencyErrorFatal(
				`Failed to initialize ${dependency}: Shutting down... ${depError instanceof Error ? depError.message : depError}.`,
				{
					exposeToClient: false
				}
			);
			ErrorLogger.logError(dependencyError);
			processError(dependencyError);
			process.exit(1);
		}

		// initialize passport authentication middleware
		try {
			initializePassportAuthMiddleware({ passport, authenticateOptions });
		} catch (depError) {
			const dependency: string = 'Passport Authentication Middleware';
			const dependencyError = new errorClasses.DependencyErrorFatal(
				`Failed to initialize ${dependency}: Shutting down... ${depError instanceof Error ? depError.message : depError}.`,
				{
					exposeToClient: false
				}
			);
			ErrorLogger.logError(dependencyError);
			processError(dependencyError);
			process.exit(1);
		}

		// initialize error handler
		try {
			app.use(expressErrorHandler());
		} catch (depError) {
			const dependencyError = new errorClasses.DependencyErrorFatal(
				`Fatal error: Unable to initialize initialize 'Express Error Handler'\nShutting down\n${depError instanceof Error ? depError.message : depError}`,
				{
					dependency: 'Express Error Handler',
					originalError: depError,
					statusCode: 500,
					severity: ErrorSeverity.FATAL,
					exposeToClient: false
				}
			);
			ErrorLogger.logError(dependencyError);
			processError(dependencyError);
			throw dependencyError;
		}

		return app;
	} catch (dependencyError) {
		const dependencyErrorFatal = new errorClasses.DependencyErrorFatal(
			`Fatal error: Failed to execute bulk middleware initialization during application setup\nShutting down\n${dependencyError instanceof Error ? dependencyError.message : dependencyError}`,
			{
				dependency:
					'Bulk Middleware Initialization (initializeAllMiddleware())',
				originalError: dependencyError,
				statusCode: 500,
				severity: ErrorSeverity.FATAL,
				exposeToClient: false
			}
		);
		ErrorLogger.logError(dependencyErrorFatal);
		processError(dependencyErrorFatal);
		throw dependencyErrorFatal;
	}
}
