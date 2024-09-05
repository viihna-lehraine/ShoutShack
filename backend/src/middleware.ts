import express, { Application } from 'express';
import session from 'express-session';
import morgan, { StreamOptions } from 'morgan';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import hpp from 'hpp';
import passport from 'passport';
import RedisStore from 'connect-redis';
import { randomBytes } from 'crypto';
import { createCsrfMiddleware } from './middleware/csrf';
import {
	expressErrorHandler,
	handleGeneralError,
	validateDependencies
} from './middleware/errorHandler';
import { setupSecurityHeaders } from './middleware/securityHeaders';
import {
	initializeIpBlacklistDependencies,
	ipBlacklistMiddleware
} from './middleware/ipBlacklist';
import createRateLimitMiddleware from './middleware/rateLimit';
import { FeatureFlags } from './config/environmentConfig';
import { Logger } from './config/logger';
import { getRedisClient } from './config/redis';

interface MiddlewareDependencies {
	express: typeof express;
	session: typeof session;
	cookieParser: typeof cookieParser;
	cors: typeof cors;
	hpp: typeof hpp;
	morgan: typeof morgan;
	passport: typeof passport;
	randomBytes: typeof randomBytes;
	RedisStore: typeof RedisStore;
	createCsrfMiddleware: typeof createCsrfMiddleware;
	getRedisClient: typeof getRedisClient;
	initializeIpBlacklistDependencies: typeof initializeIpBlacklistDependencies;
	ipBlacklistMiddleware: typeof ipBlacklistMiddleware;
	createRateLimitMiddleware: typeof createRateLimitMiddleware;
	setupSecurityHeaders: typeof setupSecurityHeaders;
	createMemoryMonitor: () => void;
	logger: Logger;
	staticRootPath: string;
	featureFlags: FeatureFlags;
	expressErrorHandler: typeof expressErrorHandler;
	handleGeneralError: typeof handleGeneralError;
}

export async function initializeMiddleware({
	express,
	session,
	cookieParser,
	cors,
	hpp,
	morgan,
	passport,
	randomBytes,
	RedisStore,
	createCsrfMiddleware,
	getRedisClient,
	initializeIpBlacklistDependencies,
	ipBlacklistMiddleware,
	createRateLimitMiddleware,
	setupSecurityHeaders,
	createMemoryMonitor,
	logger,
	staticRootPath,
	featureFlags,
	expressErrorHandler,
	handleGeneralError
}: MiddlewareDependencies): Promise<Application> {
	try {
		// initialize express app
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
					name: 'createCsrfMiddleware',
					instance: createCsrfMiddleware
				},
				{ name: 'getRedisClient', instance: getRedisClient },
				{
					name: 'initializeIpBlacklistDependencies',
					instance: initializeIpBlacklistDependencies
				},
				{
					name: 'ipBlacklistMiddleware',
					instance: ipBlacklistMiddleware
				},
				{
					name: 'createRateLimitMiddleware',
					instance: createRateLimitMiddleware
				},
				{
					name: 'setupSecurityHeaders',
					instance: setupSecurityHeaders
				},
				{ name: 'createMemoryMonitor', instance: createMemoryMonitor },
				{ name: 'logger', instance: logger },
				{ name: 'staticRootPath', instance: staticRootPath },
				{ name: 'featureFlags', instance: featureFlags },
				{ name: 'expressErrorHandler', instance: expressErrorHandler },
				{ name: 'handleGeneralError', instance: handleGeneralError }
			],
			logger || console
		);

		// initialize morgan logger
		const stream: StreamOptions = {
			write: (message: string) => logger.info(message.trim())
		};
		app.use(morgan('combined', { stream }));

		// initialize cookie parser
		app.use(cookieParser());

		// initialize CORS
		app.use(cors());

		// initialize HPP
		app.use(hpp());

		// initialize body parser
		app.use(express.json());
		app.use(express.urlencoded({ extended: true }));

		// initialize session
		app.use(
			session({
				secret: randomBytes(32).toString('hex'),
				resave: false,
				saveUninitialized: true,
				store: featureFlags.enableRedisFlag
					? new RedisStore({ client: getRedisClient() })
					: undefined,
				cookie: {
					secure: featureFlags.enableSslFlag,
					httpOnly: true,
					sameSite: 'strict'
				}
			})
		);

		// initialize passport
		app.use(passport.initialize());
		app.use(passport.session());

		// Initialize security headers
		if (featureFlags.secureHeadersFlag) {
			setupSecurityHeaders(app, {
				helmetOptions: {},
				permissionsPolicyOptions: {}
			});
		}

		// initialize CSRF middleware
		if (featureFlags.enableCsrfFlag) {
			app.use(createCsrfMiddleware);
		}

		// initialize rate limiter
		if (featureFlags.enableRateLimitFlag) {
			app.use(createRateLimitMiddleware);
		}

		// initialize IP blacklist middleware
		if (featureFlags.enableIpBlacklistFlag) {
			app.use(ipBlacklistMiddleware);
		}

		// initialize memory monitor or Redis session based on flag
		if (!featureFlags.enableRedisFlag) {
			createMemoryMonitor();
		}

		// initialize error handler
		app.use(expressErrorHandler({ logger, featureFlags }));

		return app;
	} catch (error) {
		handleGeneralError(error as Error, logger || console);
		throw new Error(
			`Failed to initialize app. See logs for more details: ${error instanceof Error ? error.message : error}`
		);
	}
}
