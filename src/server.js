require('dotenv').config();
const express = require('express');
const passport = require('passport');
const bodyParser = require('body-parser');
const sequelize = require('./config/database');
const userRoutes = require('./routes/userRoutes');
const https = require('https');
const fs = require('fs');
require('./config/passport')(passport);

const app = express();

const SERVER_PORT = process.env.SERVER_PORT || 3000;


// Middleware
app.use(bodyParser.json());
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