import express, { Application } from 'express';
import session from 'express-session';
import morgan, { StreamOptions } from 'morgan';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import hpp from 'hpp';
import passport, { AuthenticateOptions } from 'passport';
import RedisStore from 'connect-redis';
import { randomBytes } from 'crypto';
import { initializeCsrfMiddleware } from './middleware/csrf';
import { expressErrorHandler } from './middleware/expressErrorHandler';
import { initializeSecurityHeaders } from './middleware/securityHeaders';
import { ipBlacklistMiddleware } from './middleware/ipBlacklist';
import { initializeJwtAuthMiddleware } from './middleware/jwtAuth';
import { initializeRateLimitMiddleware } from './middleware/rateLimit';
import { FeatureFlags } from './config/environmentConfig';
import { Logger } from './config/logger';
import { getRedisClient } from './config/redis';
import sops, { SecretsMap } from './utils/sops';
import { execSync } from 'child_process';
import compression from 'compression';
import responseTime from 'response-time';
import { initializePassportAuthMiddleware } from './middleware/passportAuth';
import { initializeValidatorMiddleware } from './middleware/validator';
import validator from 'validator';
import { initializeSlowdownMiddleware } from './middleware/slowdown';
import { validateDependencies } from './utils/validateDependencies';
import { processError } from './utils/processError';

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
	initializeCsrfMiddleware: typeof initializeCsrfMiddleware;
	getRedisClient: typeof getRedisClient;
	ipBlacklistMiddleware: typeof ipBlacklistMiddleware;
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
	initializeCsrfMiddleware,
	getRedisClient,
	ipBlacklistMiddleware,
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
					name: 'ipBlacklistMiddleware',
					instance: ipBlacklistMiddleware
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

		const secrets = await sops.getSecrets({
			logger,
			execSync,
			getDirectoryPath: () => process.cwd()
		});

		const redisClient = await getRedisClient();

		// initialize body parser
		app.use(express.json());
		app.use(express.urlencoded({ extended: true }));

		// initialize cookie parser
		app.use(cookieParser());

		// initialize morgan logger
		const stream: StreamOptions = {
			write: (message: string) => logger.info(message.trim())
		};
		app.use(morgan('combined', { stream }));

		// initialize CORS
		app.use(cors());

		// initialize HPP
		app.use(hpp());

		// initialize session with Redis store
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

		// initialize passport
		app.use(passport.initialize());
		app.use(passport.session());

		// initialize compression
		app.use(compression());

		// initialize response time
		app.use(responseTime());

		// set e-tag header for client-side caching
		app.set('etag', 'strong');

		// initialize security headers
		initializeSecurityHeaders(app, {
			helmetOptions: {},
			permissionsPolicyOptions: {}
		});

		// initialize CSRF middleware
		app.use(initializeCsrfMiddleware);

		// initialize validator middleware
		initializeValidatorMiddleware({ validator, logger });

		// initialize memory monitor or Redis session based on flag
		if (!featureFlags.enableRedisFlag) {
			createMemoryMonitor();
		}

		// initialize rate limiter
		if (featureFlags.enableRateLimitFlag) {
			app.use(initializeRateLimitMiddleware);
		}

		// initialize slowdown middleware
		initializeSlowdownMiddleware({ slowdownThreshold: 100, logger });

		// initialize IP blacklist middleware
		if (featureFlags.enableIpBlacklistFlag) {
			app.use(ipBlacklistMiddleware);
		}

		// initialize JWT authentication middleware
		app.use(initializeJwtAuthMiddleware({ logger, verifyJwt }));

		// initialize passport authentication middleware
		app.use(
			initializePassportAuthMiddleware({
				passport,
				authenticateOptions,
				logger
			})
		);

		// initialize error handler
		app.use(expressErrorHandler({ logger, featureFlags }));

		return app;
	} catch (error) {
		processError(error as Error, logger || console);
		throw new Error(
			`Failed to initialize app. See logs for more details: ${error instanceof Error ? error.message : error}`
		);
	}
}
