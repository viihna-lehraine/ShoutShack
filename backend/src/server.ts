import passport from 'passport';
import loadEnv from './config/loadEnv';
import {
	initializeDatabase,
	configurePassport,
	initializeIpBlacklist,
	setupHttp
} from './index';
import { app, initializeApp } from './config/app';
import featureFlags from './config/featureFlags';
import { getSequelizeInstance } from './config/db';
import setupLogger from './config/logger';
import { initializeModels } from './models/ModelsIndex';

await loadEnv();

const logger = await setupLogger();

// Initialize Database
logger.info('Initializing database');
await initializeDatabase();

// Initialize all models
logger.info('Initializing models');
initializeModels();

// Confuigure Passport for authentication
logger.info('Initializing passport');
await configurePassport(passport);

// Initialize IP blacklist
logger.info('Initializing IP blacklist');
await initializeIpBlacklist();

// Initialize the Express application with all middlewares and routes
logger.info('Initializing app');
await initializeApp();

// Sync Datababase Connection and Models, dependent on flag value
logger.info(
	'DB Sync Flag: ',
	featureFlags.dbSyncFlag,
	' Type: ',
	typeof featureFlags.dbSyncFlag
);

const dbSyncFlag = featureFlags?.dbSyncFlag ?? false;
if (dbSyncFlag) {
	// test the database connection and sync models
	logger.info(
		'Testing database connection and syncing models using getSequelizeInstance'
	);
	const sequelize = getSequelizeInstance();
	try {
		await sequelize.sync(); // if sync isn't working, try adding { force: true } for one round then removing again
		logger.info('Database and tables created!');
	} catch (err) {
		logger.error('Database Connection Test and Sync: Server error:', err);
		process.exit(1); // exit process with failure
	}
}

// Start Web Server
logger.info('Starting server');
try {
	const { startServer } = await setupHttp(app);
	startServer();
	logger.info('Server started successfully!');
} catch (err) {
	logger.error('Unhandled error during server initialization: ', err);
	process.exit(1);
}

export default app;
