// Guestbook - version 0.0.0 (initial development)
// Licensed under GNU GPLv3 (https://www.gnu.org/licenses/gpl-3.0.html)
// Author: Viihna Lehraine (viihna@viihnatech.com || viihna.78 (Signal) || Viihna-Lehraine (Github))

import express from 'express';
import path from 'path';
import passport from 'passport';
import bodyParser from 'body-parser';
import { constants, randomBytes } from 'crypto';
import http2 from 'http2';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import csrf from 'csrf';
import morgan from 'morgan';
import permissionsPolicy from 'permissions-policy';
import { initializeDatabase } from './index.js';
import staticRoutes from './routes/staticRoutes.js';
import apiRoutes from './routes/apiRoutes.js';
import loadEnv from './config/loadEnv.js';
import {
	configurePassport,
	getSSLKeys,
	ipBlacklistMiddleware,
	loadBlacklist,
    limiter,
	setupLogger,
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

		// Helmet Initial Configuration
		app.use(
			helmet({
                frameguard: { action: 'deny' },
                dnsPrefetchControl: { allow: false },
                hidePoweredBy: true,
				hsts: {
					maxAge: 31536000, // 1 year
					includeSubDomains: true,
					preload: true, // enable HSTS preload list
				},
				ieNoOpen: true,
				noSniff: true,
				xssFilter: true,
			})
		);

		// Helmet CSP Configuration
		app.use(
			helmet.contentSecurityPolicy({
				directives: {
					defaultSrc: ['self'],
					scriptSrc: [
						'self',
                        // `'nonce-${res.locals.cspNonce}'`,
						'https://api.haveibeenpwned.com',
					],
					styleSrc: [
                        'self',
                        // `'nonce-${res.locals.cspNonce}'`
                    ],
					fontSrc: ['self'],
					imgSrc: [
                        'self',
                        'data:'
                    ],
					connectSrc: [
						'self',
						'https://api.haveibeenpwned.com',
						'https://cdjns.cloudflare.com',
					],
					objectSrc: ['none'],
					upgradeInsecureRequests: [], // automatically upgrade HTTP to HTTPS
					frameAncestors: ['none'],
					reportUri: '/report-violation',
				},
				reportOnly: false, // *DEV-NOTE* set to true to test CSP without enforcement
			}),
		);

        // Enforce Certificate Transparency
		app.use((req, res, next) => {
			res.setHeader('Expect-CT', 'enforce, max-age=86400');
			next();
		});

        // Configure Permissions Policy
        app.use(
            permissionsPolicy({
                features: {
                    fullscreen: ['self'], // allow fullscreen only on same origin
                    geolocation: ['none'], // disallow geolocation
                    microphone: ['none'], // disallow microphone access
                    camera: ['none'], // disallow camera access
                    payment: ['none'], // disallow payment requests
                },
            }),
        );


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

		// Start the server with HTTPS
		const options = {
			key: sslKeys.key,
			cert: sslKeys.cert,
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

		// Create HTTP2/HTTPS server
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
