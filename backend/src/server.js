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
import morgan from 'morgan';
import staticRoutes from './routes/staticRoutes.js';
import apiRoutes from './routes/apiRoutes.js';
import loadEnv from './config/loadEnv.js';
import {
  getSSLKeys,
  configurePassport,
  initializeDatabase,
  setupLogger,
  __dirname,
  __filename,
} from './index.js';

const app = express();

async function initializeServer() {
  const logger = await setupLogger();

  try {
    const sslKeys = await getSSLKeys();
    const sequelize = await initializeDatabase();

    await configurePassport(passport);

    // Middleware for parsing JSON/URL-encoded bodies
    app.use(bodyParser.json());
    app.use(express.urlencoded({ extended: true }));

    // Middleware for setting secure HTTP headers
    app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ['"self"'],
            styleSrc: ['"self"'],
            fontSrc: ['"self"'],
            imgSrc: ['"self"', 'data:'],
            scriptSrc: [
              '"self"',
              '"unsafe-inline"',
              'https://api.haveibeenpwned.com',
            ],
            connectSrc: [
              '"self"',
              'https://api.haveibeenpwned.com',
              'https://cdnjs.cloudflare.com',
            ],
          },
        },
        referrerPolicy: { policy: 'no-referrer' },
        frameguard: { action: 'deny' },
      }),
    );

    // HTTP request logging
    app.use(
      morgan('combined', {
        stream: {
          write: (message) => logger.info(message.trim()),
        },
      }),
    );

    // Initialize passport
    app.use(passport.initialize());

    // Serve static files from the /public directory
    app.use(express.static(path.join(__dirname, '../public')));

    // Use static routes
    app.use('/', staticRoutes);

    // Use API routes
    app.use('/api', apiRoutes);

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
