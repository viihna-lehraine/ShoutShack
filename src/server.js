// Guestbook - version 0.0.0 (initial development)
// Licensed under GNU GPLv3 (https://www.gnu.org/licenses/gpl-3.0.html)
// Author: Viihna Lehraine (viihna@voidfucker.com || viihna.78 (Signal) || Viihna-Lehraine (Github))



const path = require('path');
const express = require('express');
const passport = require('passport');
const bodyParser = require('body-parser');
const sequelize = require('./config/database');
const apiRoutes = require('./routes/apiRoutes');
const userRoutes = require('./routes/userRoutes');
const staticRoutes = require('./routes/staticRoutes');
const https = require('https');
const fs = require('fs');
const helmet = require('helmet');
const morgan = require('morgan');
const logger = require('./config/logger'); 
const getSecrets = require('./config/sops');
require('./config/passport')(passport);

const secrets = getSecrets();
const app = express();


// Middleware for parsing JSON/URL-encoded bodies and setting secure HTTP headers
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet({   // set secure HTTP headers
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
(async () => {
    try {
        await sequelize.sync();
        console.log('Database and tables created!');
    } catch (err) {
        console.error('Database Connection Test and Sync: Server error: ', err);
    }
})();


// Enforce HTTPS and TLS
if (process.end.NODE_ENV === 'production') {
    // Redirect HTTP to HTTPS
    app.use((req, res, next) => {
        if (req.header('x-forwarded-proto') !== 'https') {
            res.redirect(`https://${req.header('host')}${req.url}`);
        } else {
            next();
        }
    });
}


// Start the server with HTTPS
const options = {
    key: fs.readFileSync(secrets.SSL_TEST_KEY_PATH),
    cert: fs.readFileSync(secrets.SSL_TEST_CERT_PATH)
};


https.createServer(options, app).listen(secrets.PORT, () => {
    console.log(`Server running on port ${secrets.PORT}`);
});