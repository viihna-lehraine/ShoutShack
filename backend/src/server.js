// Guestbook - version 0.0.0 (initial development)
// Licensed under GNU GPLv3 (https://www.gnu.org/licenses/gpl-3.0.html)
// Author: Viihna Lehraine (viihna@viihnatech.com || viihna.78 (Signal) || Viihna-Lehraine (Github))

import express from 'express';
import path from 'path';
import passport from 'passport';
import bodyParser from 'body-parser';
import { constants, randomBytes } from 'crypto';
import http2 from 'http2';
import https from 'https';
import cookieParser from 'cookie-parser';
import csrf from 'csrf';
import morgan from 'morgan';
import staticRoutes from './routes/staticRoutes.js';
import apiRoutes from './routes/apiRoutes.js';
import loadEnv from './config/loadEnv.js';
import setupLogger from './config/logger.js';
import {
	configurePassport,
	featureFlags,
	getSSLKeys,
	initializeDatabase,
	initializeIPBlacklist,
	ipBlacklistMiddleware,
	limiter,
	setupSecureHeaders,
	__dirname,
	__filename,
} from './index.js';

const app = express();
const csrfProtection = new csrf({ secretLength: 32 });

loadEnv();

async function initializeServer() {
	const logger = await setupLogger();
	const sequelize = await initializeDatabase();
	const sslKeys = await getSSLKeys();
	await configurePassport(passport);

	if (featureFlags.ipBlacklistFlag) {
		await initializeIPBlacklist();
	}

	try {
		// Apply global IP blacklist
		if (featureFlags.ipBlacklistFlag) {
			app.use(ipBlacklistMiddleware);
		}

		// Apply rate limiter to all requests
		app.use(limiter);

		// Parse JSON
		app.use(bodyParser.json());

		// Parse URL-encoded content
		app.use(express.urlencoded({ extended: true }));

		// Load test routes conditionally
		if (featureFlags.loadTestRoutesFlag) {
			await loadTestRoutes(app);
		}

		// Generate nonce for each request
		app.use((req, res, next) => {
			res.locals.cspNonce = randomBytes(16).toString('hex');
			next();
		});

		// Apply Security Headers
		if (featureFlags.secureHeadersFlag) {
			setupSecureHeaders(app);
		}

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
		app.use(express.static(path.join(__dirname, '../public')));

		// Use Static Routes
		if (featureFlags.loadStaticRoutesFlag) {
			app.use('/', staticRoutes);
		}

		// Use API routes with CSRF protection
		if (featureFlags.apiRoutesCsrfFlag) {
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
		}

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
		if (featureFlags.dbSyncFlag) {
			try {
				await sequelize.sync();
				logger.info('Database and tables created!');
			} catch (err) {
				logger.error('Database Connection Test and Sync: Server error: ', err);
				throw err;
			}
		}

		// Enforce HTTPS Redirects
		if (featureFlags.httpsRedirectFlag) {
			logger.info('Enforcing HTTPS redirects');
			app.use((req, res, next) => {
				// redirect HTTP to HTTPS
				if (req.header('x-forwarded-proto') !== 'https') {
					res.redirect(`https://${req.header('host')}${req.url}`);
				} else {
					next();
				}
			});
		}

		// *DEV-NOTE* debugging
		if (
			(process.env.NODE_ENV === 'development' ||
				process.env.NODE_ENV === 'testing') &&
			sslKeys
		) {
			logger.info('SSL Keys loaded: ', sslKeys.key, sslKeys.cert);
		} else if (!sslKeys) {
			logger.error('SSL Keys not found. Unable to initialize TLS ', err.stack);
		} else if (process.env.NODE_ENV === 'production' && sslKeys) {
			logger.info('SSL Keys loaded');
		} else {
			logger.error('SSL Keys - Unhandled exception ', err.stack);
		}

		// Start the server with HTTPS
		// *DEV-NOTE* export this from elsewhere
		const options = {
			key: sslKeys.key,
			cert: sslKeys.cert,
			allowHTTP1: true,
			secureOptions: constants.SSL_OP_NO_TLSv1 | constants.SSL_OP_NO_TLSv1_1,
			ciphers: [
				'ECDHE-ECDSA-AES256-GCM-SHA384',
				'ECDHE-RSA-AES256-GCM-SHA384',
				'ECDHE-ECDSA-CHACHA20-POLY1305',
				'ECDHE-RSA-CHACHA20-POLY1305',
				'ECDHE-ECDSA-AES128-GCM-SHA256',
				'ECDHE-RSA-AES128-GCM-SHA256',
				'ECDHE-ECDSA-AES256-SHA384',
				'ECDHE-RSA-AES256-SHA384',
				'ECDHE-ECDSA-AES128-SHA256',
				'ECDHE-RSA-AES128-SHA256',
			].join(':'),
			honorCipherOrder: true,
		};

		if (
			(featureFlags.http1Flag && featureFlags.http2Flag) ||
			(!featureFlags.http1Flag && !featureFlags.http2Flag)
		) {
			logger.error(
				'HTTP1 / HTTP2 flags not correctly set. Please check backend .env file'
			);
			throw Error(
				'HTTP1 / HTTP2 flags not correctly set. Please check backend .env file'
			);
		}

		// Create HTTP2 Server
		if (featureFlags.http2Flag) {
			http2
				.createSecureServer(options, app)
				.listen(process.env.SERVER_PORT, () => {
					logger.info(`Server running on port ${process.env.SERVER_PORT}`);
				});
		}

		// Create HTTP1 Server
		if (featureFlags.http1Flag) {
			https.createServer(options, app).listen(process.env.SERVER_PORT, () => {
				logger.info(`Server running on port ${process.env.SERVER_PORT}`);
			});
		}
	} catch (err) {
		logger.error('Failed to start server: ', err);
		process.exit(1); // exit process with failure
	}
}

initializeServer();

export default app;
