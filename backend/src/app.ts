import express, { Application } from 'express';
import session from 'express-session';
import morgan from 'morgan';
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
import { initializeStaticRoutes } from './routes/staticRoutes';
import { createIpBlacklist } from './middleware/ipBlacklist';
import { FeatureFlags } from './config/environmentConfig';
import { Logger, setupLogger } from './config/logger';
import { getRedisClient } from './config/redis';

interface AppDependencies {
	express: typeof express;
	session: typeof session;
	cookieParser: typeof cookieParser;
	cors: typeof cors;
	hpp: typeof hpp;
	morgan: typeof morgan;
	passport: typeof passport;
	randomBytes: typeof randomBytes;
	RedisStore: typeof RedisStore;
	initializeStaticRoutes: typeof initializeStaticRoutes;
	csrfMiddleware: ReturnType<typeof createCsrfMiddleware>;
	getRedisClient: typeof getRedisClient;
	ipBlacklistMiddleware: ReturnType<
		typeof createIpBlacklist
	>['ipBlacklistMiddleware'];
	createTestRouter: (app: Application) => void;
	rateLimitMiddleware: typeof rateLimitMiddleware;
	setupSecurityHeaders: typeof setupSecurityHeaders;
	startMemoryMonitor: () => void;
	logger: Logger;
	staticRootPath: string;
	featureFlags: FeatureFlags;
	expressErrorHandler: typeof expressErrorHandler;
	handleGeneralError: typeof handleGeneralError;
}

export async function initializeApp({
	express,
	session,
	cookieParser,
	cors,
	hpp,
	morgan,
	passport,
	randomBytes,
	RedisStore,
	initializeStaticRoutes,
	csrfMiddleware,
	getRedisClient,
	ipBlacklistMiddleware,
	createTestRouter,
	rateLimitMiddleware,
	setupSecurityHeaders,
	startMemoryMonitor,
	logger,
	staticRootPath,
	featureFlags,
	expressErrorHandler,
	handleGeneralError
}: AppDependencies): Promise<Application | undefined> {
	try {
		try {
			const logger = setupLogger();
			logger.info('Logger initialized');
		} catch (error) {
			console.warn('Failed to initialize logger');
			handleGeneralError(error as Error, logger || console);
		}

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
					name: 'initializeStaticRoutes',
					instance: initializeStaticRoutes
				},
				{ name: 'csrfMiddleware', instance: csrfMiddleware },
				{ name: 'getRedisClient', instance: getRedisClient },
				{
					name: 'ipBlacklistMiddleware',
					instance: ipBlacklistMiddleware
				},
				{ name: 'createTestRouter', instance: createTestRouter },
				{ name: 'rateLimitMiddleware', instance: rateLimitMiddleware },
				{
					name: 'setupSecurityHeaders',
					instance: setupSecurityHeaders
				},
				{ name: 'startMemoryMonitor', instance: startMemoryMonitor },
				{ name: 'logger', instance: logger },
				{ name: 'staticRootPath', instance: staticRootPath },
				{ name: 'featureFlags', instance: featureFlags },
				{ name: 'expressErrorHandler', instance: expressErrorHandler },
				{ name: 'handleGeneralError', instance: handleGeneralError }
			],
			logger || console
		);

		const app = express();

		logger.info('Initializing middleware');

		// initialize Morgan logger
		logger.info('Initializing Morgan logger');
		app.use(morgan('combined', { stream: logger.stream }));

		// initialize cookie parser
		logger.info('Initializing cookie parser');
		app.use(cookieParser());

		// initialize CORS
		logger.info('Initializing CORS');
		app.use(cors());

		// initialize HPP
		logger.info('Initializing HPP');
		app.use(hpp());

		// initialize body parser
		logger.info('Initializing body parser');
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
		logger.info('Initializing Passport and Passport session');
		app.use(passport.initialize());
		app.use(passport.session());

		// initialize security headers
		if (featureFlags.secureHeadersFlag) {
			logger.debug(
				'Secure headers middleware is enabled. Initializing secure headers middleware'
			);
			setupSecurityHeaders(app, {
				helmetOptions: {},
				permissionsPolicyOptions: {}
			});
		} else {
			logger.debug(
				'Secure headers middleware is disabled. Skipping secure headers middleware initialization'
			);
		}

		// initialize static routes
		initializeStaticRoutes(app, staticRootPath, logger);

		// initialize CSRF middlware
		if (featureFlags.enableCsrfFlag) {
			logger.debug(
				'CSRF middleware is enabled. Initializing CSRF middleware'
			);
			app.use(csrfMiddleware);
		} else {
			logger.debug(
				'CSRF middleware is disabled. Skipping CSRF middleware initialization'
			);
		}

		// initialize rate limit middleware
		if (featureFlags.enableRateLimitFlag) {
			logger.debug(
				'Rate limiter is enabled. Initializing rate limit middleware'
			);
			app.use(rateLimitMiddleware);
		} else {
			logger.debug(
				'Rate limiter is disable. Skipping rate limit middleware initialization'
			);
		}

		// initialize IP blacklist middleware
		if (featureFlags.enableIpBlacklistFlag) {
			logger.debug(
				'IP blacklist middleware is enabled. Initializing IP blacklist middleware'
			);
			app.use(ipBlacklistMiddleware);
		} else {
			logger.debug(
				'IP blacklist middleware is disabled. Skipping IP blacklist middleware initialization'
			);
		}

		// initialize test router
		if (featureFlags.loadTestRoutesFlag) {
			logger.debug('Test router is enabled. Initializing test router');
			createTestRouter(app);
		} else {
			logger.debug(
				'Test router is disabled. Skipping test router initialization'
			);
		}

		// initialize memory monitor or Redis session, dependant on flag value
		if (!featureFlags.enableRedisFlag) {
			logger.debug('Redis is disabled. Initializing memory monitor');
			startMemoryMonitor();
		} else {
			logger.debug(
				'Redis is enabled. Skipping memory monitor initialization'
			);
		}

		// initialize error handler
		logger.info('Initializing error handler');
		app.use(expressErrorHandler({ logger, featureFlags }));

		return app;
	} catch (error) {
		handleGeneralError(error as Error, logger || console);
		return undefined;
	}
}
