const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env')});
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
require('./config/passport')(passport);

const app = express();

const SERVER_PORT = process.env.SERVER_PORT || 3000;


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


// Initialize passport
app.use(passport.initialize());


// Serve static files from the /public directory
app.use(express.static(path.join(__dirname, '../public')));


// Test database connection and sync models
(async () => {
    try {
        await sequelize.sync();
        console.log('Database and tables created!');
    } catch (err) {
        console.error('Database Connection Test and Sync: Server error: ', err);
    }
})();


// Routes
app.use('/api/users', userRoutes);
app.use('/', staticRoutes);


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
    key: fs.readFileSync(process.env.SSL_TEST_KEY_PATH),
    cert: fs.readFileSync(process.env.SSL_TEST_CERT_PATH)
};


https.createServer(options, app).listen(SERVER_PORT, () => {
    console.log(`Server running on port ${SERVER_PORT}`);
});