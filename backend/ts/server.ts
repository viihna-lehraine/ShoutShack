// Guestbook - version 0.0.0 (initial development)
// Licensed under GNU GPLv3 (https://www.gnu.org/licenses/gpl-3.0.html)
// Author: Viihna Lehraine (viihna@viihnatech.com || viihna.78 (Signal) || Viihna-Lehraine (Github))

import express from 'express';
import { Request, Response, NextFunction } from 'express';
import 'express-async-errors';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import csrf from 'csrf';
import hpp from 'hpp';
import morgan from 'morgan';
import path from 'path';
import passport from 'passport';
import { randomBytes } from 'crypto';
// import sentry from '@sentry/node';
import session from 'express-session';
import connectRedis from 'connect-redis';
import staticRoutes from '../ts/routes/staticRoutes';
import apiRoutes from './routes/apiRoutes';
import loadEnv from './config/loadEnv.js';
import setupLogger from './middleware/logger';
import getSecrets from './config/secrets';
import sops from './config/sops';
import {
	configurePassport,
	initializeDatabase,
	initializeIpBlacklist,
	ipBlacklistMiddleware,
	loadTestRoutes,
	rateLimitMiddleware,
	setupSecurityHeaders,
	slowdownMiddleware,
	startServer,
	__dirname,
	__filename,
} from './index.js';

const app = express();
const csrfProtection = new csrf({ secretLength: 32 });
const RedisStore = connectRedis(session);

const { decryptDataFiles, getSSLKeys } = sops;

loadEnv();

async function initializeServer() {
	const logger = await setupLogger();
	const sequelize = await initializeDatabase();
	const ipLists = await decryptDataFiles(); 
	const staticRootPath = process.env.STATIC_ROOT_PATH!;
	const keyPath = process.env.SERVER_SSL_KEY_PATH!;
	const certPath = process.env.SERVER_SSL_CERT_PATH!;

	await configurePassport(passport);
	await initializeIpBlacklist();

	try {
		await getSecrets();
		// Session management with Redis
		/* app.use(
			session({
				store: new RedisStore({ client: redisClient }),
				// secret: 'secrets.REDIS_KEY',
				resave: false,
				saveUninitialized: false,
				cookie: { secure: true }, 
			})
		); */

		// Implement Caching
		/*
		app.get('/your-route', (req, res) => {
			const cacheKey = 'your-cache-key';

	  		client.get(cacheKey, (err, data) => {
	    		if (err) throw err;

	    		if (data) {
	      			return res.json(JSON.parse(data));
	    		} else {
	      		// Fetch data from the database
	      		// Cache the data
	      		client.setex(cacheKey, 3600, JSON.stringify(yourData));
	      		return res.json(yourData);
	    		}
	  		});
		}); */

		// Parse JSON
		app.use(bodyParser.json());

		// Parse URL-encoded content
		app.use(express.urlencoded({ extended: true }));

		// Load test routes
		loadTestRoutes(app);

		// Configure express-session to use session data (necessary for slowdownMiddleware to work)
		/* app.use(session({
			secret: 'your_secret_key',
			resave: false,
			saveUninitialized: true,
		})); */

		// Apply Sentry middleware for request and error handling
		// app.use(Sentry.RequestHandlers.requestHandler());
		// app.use(Sentry.Handlers.errorHandler());

		// Apply global IP blacklistr
		app.use(ipBlacklistMiddleware);

		// Apply custom slowdown middleware
		// app.use(slowdownMiddleware);

		// Apply rate limiter middleware to all requests
		app.use(rateLimitMiddleware);

		// Generate nonce for each request
		app.use((req: Request, res: Response, next: NextFunction) => {
			res.locals.cspNonce = randomBytes(16).toString('hex');
			next();
		});

		// Apply CORS middleware
		app.use(cors({
			// origin: 'https://guestbook.com',
			methods: 'GET,POST,PUT,DELETE',
			allowedHeaders: 'Content-Type,Authorization', // allow specific headers
			credentials: true // allow cookies to be sent
		}));

		// Apply 'hpp' middleware to sanitize query parameters
		app.use(hpp());

		// Apply Security Headers
		setupSecurityHeaders(app);

		// HTTP Request Logging
		app.use(
			morgan('combined', {
				stream: {
					write: (message) => logger.info(message.trim()),
				},
			})
		);

		// Initialize Passport
		app.use(passport.initialize());

		// Add Cookie Parser
		app.use(cookieParser());

		// Serve Static Files from the /public Directory
		app.use(express.static(staticRootPath));

		// Use Static Routes
		app.use('/', staticRoutes);

		// Use API routes with CSRF protection
		app.use(
			'/api',
			(req: Request, res: Response, next: NextFunction) => {
				const token = req.body.csrfToken || req.headers['x-xsrf-token'];
				if (csrfProtection.verify(req.csrfToken, token)) {
					next();
				} else {
					res.status(403).send('Invalid CSRF token');
				}
			},
			apiRoutes
		);

		// 404 error handling
		app.use((req: Request, res: Response, next: NextFunction) => {
			res
				.status(404)
				.sendFile(path.join(__dirname, '../public', 'not-found.html'));
		});

		// Error Handling Middleware
		app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
			logger.error('Error occurred: ', err.stack || err.message || err);
			res.status(500).send(`Server error - something failed ${err.stack}`);
		});

		// Test database connection and sync models
		try {
			await sequelize.sync();
			logger.info('Database and tables created!');
		} catch (err) {
			logger.error('Database Connection Test and Sync: Server error: ', err);
			throw err;
		}

		// Enforce HTTPS Redirects
		logger.info('Enforcing HTTPS redirects');
		app.use((req: Request, res: Response, next: NextFunction) => {
			// redirect HTTP to HTTPS
			if (req.header('x-forwarded-proto') !== 'https') {
				res.redirect(`https://${req.header('host')}${req.url}`);
			} else {
				next();
			}
		});

		// Start the server with either HTTP1.1 or HTTP2, dependent on feature flags
		await startServer();

	} catch (err) {
		logger.error('Failed to start server: ', err);
		process.exit(1); // exit process with failure
	}
}

initializeServer();

export default app;
