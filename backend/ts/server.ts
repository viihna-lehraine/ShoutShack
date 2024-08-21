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
import { initializeModels } from './models/ModelsIndex';

loadEnv();

async function initializeServer(): Promise<void> {
	try {
		// Initialize the database
		console.log('Initializing database');
		await initializeDatabase();

		// Initialize all models
		console.log('Initializing models');
		initializeModels();

		// Configure Passport for authentication]
		console.log('Initializing passport');
		await configurePassport(passport);

		// Initialize IP blacklist
		console.log('Initializing IP blacklist');
		await initializeIpBlacklist();

		// Initialize the Express application with all middlewares and routes
		console.log('Initializing app');
		await initializeApp();

		// Sync Datababase Connection and Models, dependent on flag value
		console.log(
			'DB Sync Flag: ',
			featureFlags.dbSyncFlag,
			typeof featureFlags.dbSyncFlag
		);

		if (featureFlags.dbSyncFlag) {
			// Test the database connection and sync models
			console.log(
				'Testing database connection and syncing models using getSequelizeInstance'
			);
			let sequelize = getSequelizeInstance();
			try {
				await sequelize.sync(); // if sync isnt working, try adding { force: true }	for one round then removing again
				console.info('Database and tables created!');
			} catch (err) {
				console.error(
					'Database Connection Test and Sync: Server error:',
					err
				);
				throw err;
			}
		}

		// Start Web Server
		console.log('Starting server');
		setupHttp(app);
		console.info('Server started successfully!');
	} catch (err) {
		console.error('Failed to start server:', err);
		process.exit(1); // exit process with failure
	}
}

initializeServer().catch((err) => {
	console.error('Unhandled error during server initialization:', err);
	process.exit(1); // exit process with failure
});

export default app;
