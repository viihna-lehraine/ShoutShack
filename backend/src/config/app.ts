import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import hpp from 'hpp';
import morgan from 'morgan';
import passport from 'passport';
import { randomBytes } from 'crypto';
import path from 'path';
import RedisStore from 'connect-redis';
import initializeStaticRoutes from '../routes/staticRoutes';
import apiRoutes from '../routes/apiRoutes';
import {
	csrfMiddleware,
	errorHandler,
	getFeatureFlags,
	getRedisClient,
	ipBlacklistMiddleware,
	loadTestRoutes,
	rateLimitMiddleware,
	setupSecurityHeaders,
	startMemoryMonitor
} from '../index';
import setupLogger from './logger';

const app = express();
const logger = setupLogger();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const staticRootPath =
	process.env.STATIC_ROOT_PATH ?? path.join(__dirname, '../public');
const featureFlags = getFeatureFlags();

const NODE_ENV = process.env.NODE_ENV;
const SSL_FLAG = featureFlags.enableSslFlag;
const REDIS_FLAG = featureFlags.enableRedisFlag;

async function initializeApp(): Promise<void> {
	let memoryMonitor = false;

	if (NODE_ENV === 'development' || NODE_ENV === 'testing') {
		memoryMonitor = true;
	}

	if (memoryMonitor) {
		logger.info('Memory monitor started');
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

	app.use('/', initializeStaticRoutes);

	app.use('/api', apiRoutes);

	app.use(async (req: Request, res: Response, next: NextFunction) => {
		try {
			res.locals.cspNonce = randomBytes(16).toString('hex');
			next();
		} catch {
			next();
		}
	});

	setupSecurityHeaders(app);

	loadTestRoutes(app);

	// Session management
	if (REDIS_FLAG && getRedisClient()) {
		logger.info('REDIS_FLAG is true. Using Redis for session management');
		app.use(
			session({
				store: new RedisStore({ client: getRedisClient }),
				secret: 'secrets.REDIS_KEY',
				resave: false,
				saveUninitialized: false,
				cookie: { secure: true }
			})
		);
	} else {
		logger.info(
			'REDIS_FLAG is false. Skipping Redis operations because REDIS_FLAG is false or Redis is not connected. Using in-memory storage for session management'
		);

		let secureCookie: boolean;

		if (SSL_FLAG) {
			logger.info('SSL_FLAG is true. Using secure cookies');
			secureCookie = true;
		} else {
			logger.info('SSL_FLAG is false. Using insecure cookies');
			secureCookie = false;
		}

		app.use(
			session({
				secret: 'secrets.SESSION_KEY',
				resave: false,
				saveUninitialized: false,
				cookie: { secure: secureCookie }
			})
		);
	}

	// 404 error handling
	app.use((req: Request, res: Response, next: NextFunction) => {
		res.status(404).sendFile(
			path.join(__dirname, '../public', 'not-found.html')
		);
		next();
	});

	// General error handling
	app.use(errorHandler);
}

export { app, initializeApp };
