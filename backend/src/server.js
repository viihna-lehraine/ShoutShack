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
import {
	configurePassport,
	getSSLKeys,
	initializeDatabase,
	ipBlacklistMiddleware,
	loadBlacklist,
    limiter,
	setupLogger,
	setupSecurityHeaders,
	__dirname,
	__filename,
} from './index.js';

const app = express();
const csrfProtection = new csrf({ secretLength: 32 });

async function initializeServer() {
	const logger = await setupLogger();
	const sequelize = await initializeDatabase();
	const sslKeys = await getSSLKeys();
	await configurePassport(passport);
	await loadBlacklist();

	loadEnv();

	try {
		// Apply rate limiter to all requests
		app.use(limiter);

		// Apply global IP blacklist
		app.use(ipBlacklistMiddleware);

		// Parse JSON
		app.use(bodyParser.json());

		// Parse URL-encoded content
		app.use(express.urlencoded({ extended: true }));

		// Load test routes conditionally
		// await loadTestRoutes(app);

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
		app.use(express.static(path.join(__dirname, '../public')));

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

		// Middleware for error handling
		app.use((err, req, res, next) => {
			logger.error('Error occurred: ', err.stack);
			res.status(500).send('server.js - Server error - something failed');
		});

		// Test database connection and sync models
		try {
			await sequelize.sync();
			logger.info('Database and tables created!');
		} catch (err) {
			logger.error('Database Connection Test and Sync: Server error: ', err);
			throw err;
		}

		// Enforce HTTPS and TLS
		logger.info('Enforcing HTTPS redirects');
		app.use((req, res, next) => {
			// redirect HTTP to HTTPS
			if (req.header('x-forwarded-proto') !== 'https') {
				res.redirect(`https://${req.header('host')}${req.url}`);
			} else {
				next();
			}
		});

		// *DEV-NOTE* debug
		if ((process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'testing') && sslKeys) {
			logger.info('SSL Keys loaded: ', sslKeys.key, sslKeys.cert);
		} else if (!sslKeys) {
			logger.error('SSL Keys not found. Unable to initialize TLS ', err.stack);
		} else if ((process.env.NODE_ENV === 'production') && sslKeys) {
			logger.info('SSL Keys loaded');			
		} else {
			logger.error('SSL Keys - Unhandled exception ', err.stack);
		}

		// Start the server with HTTPS
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

		// Create Server
		http2
			.createSecureServer(options, app)
			.listen(process.env.SERVER_PORT, () => {
				logger.info(`Server running on port ${process.env.SERVER_PORT}`);
			});
	} catch (err) {
		logger.error('Failed to start server: ', err);
	}
}

initializeServer();

export default app;
