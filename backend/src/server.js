// Guestbook - version 0.0.0 (initial development)
// Licensed under GNU GPLv3 (https://www.gnu.org/licenses/gpl-3.0.html)
// Author: Viihna Lehraine (viihna@viihnatech.com || viihna.78 (Signal) || Viihna-Lehraine (Github))

import express from 'express';
import path from 'path';
import passport from 'passport';
import bodyParser from 'body-parser';
import { randomBytes } from 'crypto';
import cookieParser from 'cookie-parser';
import csrf from 'csrf';
import morgan from 'morgan';
import staticRoutes from './routes/staticRoutes.js';
import apiRoutes from './routes/apiRoutes.js';
import loadEnv from './config/loadEnv.js';
import setupLogger from './config/logger.js';
import sops from './config/sops.js';
import {
	configurePassport,
	initializeDatabase,
	initializeIpBlacklist,
	ipBlacklistMiddleware,
	loadTestRoutes,
	limiter,
	setupSecurityHeaders,
	startServer,
	__dirname,
	__filename,
} from './index.js';

const app = express();
const csrfProtection = new csrf({ secretLength: 32 });

const { decryptDataFiles, getSSLKeys } = sops;

loadEnv();

async function initializeServer() {
	const logger = await setupLogger();
	const sequelize = await initializeDatabase();
	const ipLists = await decryptDataFiles(); 
	const staticRootPath = process.env.STATIC_ROOT_PATH;
	const keyPath = process.env.SERVER_SSL_KEY_PATH;
	const certPath = process.env.SERVER_SSL_CERT_PATH;

	await configurePassport(passport);
	await initializeIpBlacklist();

	try {
		// Load test routes
		loadTestRoutes(app);

		// Apply global IP blacklistr
		app.use(ipBlacklistMiddleware);

		// Apply rate limiter to all requests
		app.use(limiter);

		// Parse JSON
		app.use(bodyParser.json());

		// Parse URL-encoded content
		app.use(express.urlencoded({ extended: true }));

		// Generate nonce for each request
		app.use((req, res, next) => {
			res.locals.cspNonce = randomBytes(16).toString('hex');
			next();
		});

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
			(req, res, next) => {
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
		app.use((req, res, next) => {
			res
				.status(404)
				.sendFile(path.join(__dirname, '../public', 'not-found.html'));
		});

		// Error Handling Middleware
		app.use((err, req, res, next) => {
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
		app.use((req, res, next) => {
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
