import express from 'express';
import { Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import hpp from 'hpp';
import morgan from 'morgan';
import passport from 'passport';
import { randomBytes } from 'crypto';
import path from 'path';
import initializeStaticRoutes from '../routes/staticRoutes';
import apiRoutes from '../routes/apiRoutes';
import {
	csrfMiddleware,
	ipBlacklistMiddleware,
	loadTestRoutes,
	rateLimitMiddleware,
	setupSecurityHeaders
} from '../index';
import setupLogger from './logger';

const app = express();
const staticRootPath =
	process.env.STATIC_ROOT_PATH ?? path.join(__dirname, '../public');
const logger = await setupLogger();

async function initializeApp(): Promise<void> {
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
	// app.use(session({
	//     store: new RedisStore({ client: redisClient }),
	//     secret: 'secrets.REDIS_KEY',
	//     resave: false,
	//     saveUninitialized: false,
	//     cookie: { secure: true },
	// }));

	// Apply Sentry middleware for request and error handling
	// if (process.env.NODE_ENV === 'production') {
	// 	app.use(Sentry.RequestHandlers.requestHandler());
	// 	app.use(Sentry.Handlers.errorHandler());
	// }

	// 404 error handling
	app.use((req: Request, res: Response, next: NextFunction) => {
		res.status(404).sendFile(
			path.join(__dirname, '../public', 'not-found.html')
		);
		next();
	});

	// General error handling
	app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
		logger.error(`Error occurred: ${err.stack ?? err.message ?? err}`);
		res.status(500).send(
			`Server error - something failed: ${err.stack ?? 'Unknown error'}`
		);
		next();
	});
}

export { app, initializeApp };
