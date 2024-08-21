import express from 'express';
import { Request, Response, NextFunction } from 'express';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import hpp from 'hpp';
import morgan from 'morgan';
import passport from 'passport';
import { randomBytes } from 'crypto';
// import sentry from '@sentry/node';
// import session from 'express-session';
// import connectRedis from 'connect-redis';
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
import setupLogger from '../middleware/logger';

const app = express();
const staticRootPath = process.env.STATIC_ROOT_PATH!;

// Setup middlewares and routes
async function initializeApp() {
	let logger = await setupLogger();

	app.use(bodyParser.json());
	app.use(express.urlencoded({ extended: true }));
	app.use(
		cors({
			methods: 'GET,POST,PUT,DELETE',
			allowedHeaders: 'Content-Type,Authorization',
			credentials: true
		})
	);
	app.use(hpp());
	app.use(
		morgan('combined', {
			stream: { write: (message) => logger.info(message.trim()) }
		})
	);
	app.use(passport.initialize());
	app.use(cookieParser());
	app.use(express.static(staticRootPath));
	app.use('/', initializeStaticRoutes);
	app.use('/api', apiRoutes);
	app.use(rateLimitMiddleware);
	app.use(ipBlacklistMiddleware);
	app.use(csrfMiddleware);

	// Generate nonce for each request
	app.use((req: Request, res: Response, next: NextFunction) => {
		res.locals.cspNonce = randomBytes(16).toString('hex');
		next();
	});

	setupSecurityHeaders(app);

	// Load test routes
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
	// app.use(Sentry.RequestHandlers.requestHandler());
	// app.use(Sentry.Handlers.errorHandler());

	// 404 error handling
	app.use((req: Request, res: Response, next: NextFunction) => {
		res.status(404).sendFile(
			path.join(__dirname, '../public', 'not-found.html')
		);
		next();
	});

	// Error handling middleware
	app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
		logger.error('Error occurred: ', err.stack || err.message || err);
		res.status(500).send(`Server error - something failed ${err.stack}`);
		next();
	});

	return app;
}

export { app, initializeApp };
