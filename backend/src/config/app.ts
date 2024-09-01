import express, { Application } from 'express';
import session from 'express-session';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import hpp from 'hpp';
import path from 'path';
import passport from 'passport';
import RedisStore from 'connect-redis';
import { randomBytes } from 'crypto';
import { setupSecurityHeaders } from '../middleware/securityHeaders';
import { initializeStaticRoutes } from '../routes/staticRoutes';
import errorHandler from '../middleware/errorHandler';
import { createCsrfMiddleware } from '../middleware/csrf';
import { FeatureFlags, getFeatureFlags } from '../utils/featureFlags';
import { getRedisClient } from '../config/redis';
import { createIpBlacklist } from '../middleware/ipBlacklist';
import setupLogger from './logger';
import { createFeatureEnabler } from './setFeatureFlags';

const logger = setupLogger();
const featureFlags: FeatureFlags = getFeatureFlags(logger);
const {
	enableFeatureBasedOnFlag,
	enableFeatureWithProdOverride
} = createFeatureEnabler(logger);

interface AppDependencies {
    express: typeof express;
    session: typeof session;
    cookieParser: typeof cookieParser;
    cors: typeof cors;
    hpp: typeof hpp;
    morgan: typeof morgan;
    passport: typeof passport;
    randomBytes: typeof randomBytes;
    path: typeof path;
    RedisStore: typeof RedisStore;
    initializeStaticRoutes: typeof initializeStaticRoutes;
    csrfMiddleware: ReturnType<typeof createCsrfMiddleware>;
    errorHandler: typeof errorHandler;
    getRedisClient: typeof getRedisClient;
    ipBlacklistMiddleware: ReturnType<typeof createIpBlacklist>['ipBlacklistMiddleware'];
    createTestRouter: (app: Application) => void;
    rateLimitMiddleware: any;
    setupSecurityHeaders: typeof setupSecurityHeaders;
    startMemoryMonitor: () => void;
    logger: any;
    staticRootPath: string;
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
    path,
    RedisStore,
    initializeStaticRoutes,
    csrfMiddleware,
    errorHandler,
    getRedisClient,
    ipBlacklistMiddleware,
    createTestRouter,
    rateLimitMiddleware,
    setupSecurityHeaders,
    startMemoryMonitor,
    logger,
    staticRootPath
}: AppDependencies): Promise<Application> {
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

    app.use(session({
        secret: randomBytes(32).toString('hex'),
        resave: false,
        saveUninitialized: true,
        store:
			featureFlags.enableRedisFlag ? new RedisStore({
				client: getRedisClient()
			}) : undefined,
        cookie: {
			secure: featureFlags.enableSslFlag,
			httpOnly: true,
			sameSite: 'strict'
		}
    }));

	// initialize passport
	logger.info('Initializing Passport and Passport session');
    app.use(passport.initialize());
    app.use(passport.session());

	// initialize security headers
	enableFeatureWithProdOverride(
		featureFlags.secureHeadersFlag,
		'security headers',
		() => {
        setupSecurityHeaders(app, {
            helmetOptions: {},
            permissionsPolicyOptions: {},
        });
    });

	// initialize static routes
    initializeStaticRoutes(app, staticRootPath);

	// initialize CSRF middlware
	enableFeatureWithProdOverride(
		featureFlags.enableCsrfFlag,
		'CSRF middleware',
		() => app.use(csrfMiddleware)
	);

	// initialize rate limit middleware
	enableFeatureBasedOnFlag(
		featureFlags.enableRateLimitFlag,
		'rate limit middleware',
		() => app.use(rateLimitMiddleware)
	);

	// initialize IP blacklist middleware
	enableFeatureBasedOnFlag(
		featureFlags.enableIpBlacklistFlag,
		'IP blacklist middleware',
		() => app.use(ipBlacklistMiddleware)
	);

	// initialize test router
	enableFeatureBasedOnFlag(featureFlags.loadTestRoutesFlag,
		'test router',
		() => createTestRouter(app)
	);

	// initialize memory monitor or Redis session, dependant on flag value
	if (!featureFlags.enableRedisFlag) {
        logger.info('Initializing memory monitor');
        startMemoryMonitor();
    } else {
		logger.info(
			'Redis session is enabled, skipping memory monitor initialization'
		);
	}

	// initialize error handler
	enableFeatureBasedOnFlag(featureFlags.enableErrorHandlerFlag,
		'error handler',
		() => app.use(errorHandler)
	);

    return app;
}
