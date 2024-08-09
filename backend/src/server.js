// Guestbook - version 0.0.0 (initial development)
// Licensed under GNU GPLv3 (https://www.gnu.org/licenses/gpl-3.0.html)
// Author: Viihna Lehraine (viihna@viihnatech.com || viihna.78 (Signal) || Viihna-Lehraine (Github))

import express from 'express';
import path from 'path';
import passport from 'passport';
import bodyParser from 'body-parser';
import { constants } from 'crypto';
import http2 from 'http2';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import csrf from 'csrf';
import morgan from 'morgan';
import staticRoutes from './routes/staticRoutes.js';
import apiRoutes from './routes/apiRoutes.js';
import loadEnv from './config/loadEnv.js';
import {
	getSSLKeys,
	configurePassport,
	initializeDatabase,
	ipBlacklistMiddleware,
    limiter,
	setupLogger,
	__dirname,
	__filename,
} from './index.js';

const app = express();
const csrfProtection = new csrf({ secretLength: 32 });

// Restrict which domains can access API
const corsOptions = {
    origin: 'https://[DOMAIN].com', // restrict domain access
    methods: ['GET', 'POST'], // allow only certain HTTP methods
    allowedHeaders: ['Content-Type', 'Authorization'], // allow specific headers
};

async function initializeServer() {
	const logger = await setupLogger();

	try {
		const sslKeys = await getSSLKeys();
		const sequelize = await initializeDatabase();

		await configurePassport(passport);

		// Apply rate limiter to all requests
		app.use(limiter);

		// Apply global IP blacklist
		app.use(ipBlacklistMiddleware);

		// Parse JSON
		app.use(bodyParser.json());

		// Parse URL-encoded content
		app.use(express.urlencoded({ extended: true }));

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
					defaultSrc: ["'self'"],
					scriptSrc: [
						"'self'",
                        "'nonce-<nonce>",
						'https://api.haveibeenpwned.com',
					],
					styleSrc: [
                        "'self'",
                        `'nonce-${res.locals.cspNonce}'`
                    ],
					fontSrc: ["'self'"],
					imgSrc: [
                        "'self'",
                        'data:'
                    ],
					connectSrc: [
						"'self'",
						'https://api.haveibeenpwned.com',
						'https://cdjns.cloudflare.com',
					],
					objectSrc: ["'none'"],
					upgradeInsecureRequests: [], // automatically upgrade HTTP to HTTPS
					frameAncestors: ["'none'"],
					reportUri: '/report-violation',
				},
				reportOnly: false, // *DEV-NOTE* set to true to test CSP without enforcement
			}),
		);

        // Helmet Certificate Transparency Enforcement
        app.use(
            helmet.expectCt({
                enforce: true,
                maxAge: 86400 // 1 day
                // reportUri: <BLANK> 
            }),
        );

        // Helmet Permissions Policy
        app.use(
            helmet.permissionsPolicy({
                features: {
                    fullscreen: ["'self'"], // allow fullscreen only on same origin
                    geolocation: ["'none'"], // disallow geolocation
                    microphone: ["'none'"], // disallow microphone access
                    camera: ["'none'"], // disallow camera access
                    payment: ["'none'"], // disallow payment requests
                },
            }),
        );


		// HTTP request logging
		app.use(
			morgan('combined', {
				stream: {
					write: (message) => logger.info(message.trim()),
				},
			})
		);

		// Initialize passport
		app.use(passport.initialize());

		// Add cookie parser
		app.use(cookieParser());

		// Serve static files from the /public directory
		app.use(express.static(path.join(__dirname, '../public')));

		// Use static routes
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
		if (process.env.NODE_ENV === 'production') {
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

loadEnv();
initializeServer();
