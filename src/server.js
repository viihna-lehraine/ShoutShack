// Guestbook - version 0.0.0 (initial development)
// Licensed under GNU GPLv3 (https://www.gnu.org/licenses/gpl-3.0.html)
// Author: Viihna Lehraine (viihna@viihnatech.com || viihna.78 (Signal) || Viihna-Lehraine (Github))



const path = require('path');
const passport = require('passport');
const bodyParser = require('body-parser');
const staticRoutes = require('./routes/staticRoutes');
const https = require('https');
const helmet = require('helmet');
const morgan = require('morgan');
const setupLogger = require('./config/logger'); 
require('./config/passport')(passport);
const { getSecrets, getSSLKeys } = require('./config/sops');
const initializeDatabase = require('./config/db');
const express = require('express');


async function initializeServer() {
    try {
        const secrets = await getSecrets();
        const sslKeys = await getSSLKeys();
        const sequelize = await initializeDatabase();
        const logger = await setupLogger;

        const app = express();

        // Middleware for parsing JSON/URL-encoded bodies and setting secure HTTP headers
        app.use(bodyParser.json());
        app.use(express.urlencoded({ extended: true }));
        app.use(helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'"],
                    fontSrc: ["'self'"],
                    imgSrc: ["'self'", 'data:'],
                    scriptSrc: ["'self'", "'unsafe-inline'", 'https://api.haveibeenpwned.com'],
                    connectSrc: ["'self'", 'https://api.haveibeenpwned.com', 'https://cdnjs.cloudflare.com']
                }
            },
            referrerPolicy: { policy: 'no-referrer' },
            frameguard: { action: 'deny' }
        }));

        // HTTP request logging
        app.use(morgan('combined', {
            stream: {
                write: (message) => logger.info(message.trim())
            }
        }));

        // Initialize passport
        app.use(passport.initialize());

        // Serve static files from the /public directory
        app.use(express.static(path.join(__dirname, '../public')));

        // Use static routes
        app.use('/', staticRoutes);

        // Middleware for error handling
        app.use((err, req, res, next) => {
            logger.error(err.stack);
            res.status(500).send('server.js - Server error - something failed');
        });

        // Test database connection and sync models
        try {
            await sequelize.sync();
            console.log('Database and tables created!');
        } catch (err) {
            console.error('Database Connection Test and Sync: Server error: ', err);
            throw err;
        }

        // Enforce HTTPS and TLS
        if (secrets.NODE_ENV === 'production') {
            app.use((req, res, next) => {
                // Redirect HTTP to HTTPS
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
            secureOptions: require('constants').SSL_OP_NO_TLSv1 | require('constants').SSL_OP_NO_TLSv1_1,
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
                'ECDHE-RSA-AES128-SHA256'
            ].join(':'),
            honorCipherOrder: true
        };

        // Create HTTPS server
        https.createServer(options, app).listen(secrets.PORT, () => {
            console.log(`Server running on port ${secrets.PORT}`);
        });
    } catch (err) {
        console.error('Failed to start server: ', err);
    }
}


initializeServer();