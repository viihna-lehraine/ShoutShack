import express, { Application, Request, Response, NextFunction } from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import hpp from 'hpp';
import morgan from 'morgan';
import passport from 'passport';
import helmet, { HelmetOptions } from 'helmet';
import { randomBytes } from 'crypto';
import path from 'path';
import RedisStore from 'connect-redis'


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
	initializeStaticRoutes: (app: Application) => void;
	csrfMiddleware: (req: Request, res: Response, next: NextFunction) => void;
	errorHandler: (err: any, req: Request, res: Response, next: NextFunction) => void;
	getRedisClient: () => any;
	ipBlacklistMiddleware: (req: Request, res: Response, next: NextFunction) => void;
	createTestRouter: (app: Application) => void;
	rateLimitMiddleware: (req: Request, res: Response, next: NextFunction) => void;
	setupSecurityHeaders: (
		app: Application,
		options: { helmetOptions?: HelmetOptions; permissionsPolicyOptions?: any }
	) => void;
	startMemoryMonitor: () => NodeJS.Timeout;
	logger: any;
	staticRootPath: string;
	NODE_ENV: string | undefined;
	SSL_FLAG: boolean;
	REDIS_FLAG: boolean;
}

async function initializeApp({
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
	staticRootPath,
	NODE_ENV,
	SSL_FLAG,
	REDIS_FLAG,
}: AppDependencies): Promise<Application> {
	const app = express();

	let memoryMonitor = NODE_ENV === 'development' || NODE_ENV === 'testing';
	if (memoryMonitor) {
		logger.info('Memory Monitor enabled');
		startMemoryMonitor();
	}

	const middlewares = [
		express.json(),
		express.urlencoded({ extended: true }),
		cookieParser(),
		passport.initialize(),
		express.static(staticRootPath),
		hpp(),
		rateLimitMiddleware,
		ipBlacklistMiddleware,
		csrfMiddleware
	];

	app.use(...middlewares);

	app.use(
		cors({
			methods: 'GET,POST,PUT,DELETE',
			allowedHeaders: 'Content-Type,Authorization',
			credentials: true
		})
	);

	app.use(
		morgan('combined', {
			stream: { write: (message = '') => logger.info(message.trim()) }
		})
	);

	initializeStaticRoutes(app);

	app.use(async (req: Request, res: Response, next: NextFunction) => {
		try {
			res.locals.cspNonce = randomBytes(16).toString('hex');
			next();
		} catch {
			next();
		}
	});

	setupSecurityHeaders(app, {
		helmetOptions: {
		// *DEV-NOTE* FILL THIS OUT
		},
		permissionsPolicyOptions: {
		// *DEV-NOTE* FILL THIS OUT
		}
	});

	createTestRouter(app);

	// session management
	if (REDIS_FLAG && getRedisClient()) {
		logger.info('REDIS_FLAG is true. Using Redis for session management');
		app.use(
			session({
				store: new RedisStore({ client: getRedisClient() }),
				secret: 'secrets.REDIS_KEY',
				resave: false,
				saveUninitialized: false,
				cookie: { secure: true }
			})
		);
	} else {
		logger.info('REDIS_FLAG is false. Using in-memory store for session management');

		app.use(
			session({
				secret: 'secrets.SESSION_KEY',
				resave: false,
				saveUninitialized: false,
				cookie: { secure: SSL_FLAG }
			})
		);
	}

	// 404 error handling
	app.use((req: Request, res: Response, next: NextFunction) => {
		res.status(404).sendFile(path.join(staticRootPath, '404.html'));
		next();
	});

	// general error handling
	app.use(errorHandler);

	return app;
}

export { initializeApp };
