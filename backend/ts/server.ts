import passport from 'passport';
import loadEnv from './config/loadEnv';
import {
	initializeDatabase,
	configurePassport,
	initializeIpBlacklist,
	setupHttp
} from './index';
import { initializeApp, app } from './config/app';

loadEnv();

async function initializeServer() {
	let sequelize = await initializeDatabase();
	await configurePassport(passport);
	await initializeIpBlacklist();

	try {
		await initializeApp(); // Initialize the app with all middlewares and routes

		// Test database connection and sync models
		try {
			await sequelize.sync();
			console.info('Database and tables created!');
		} catch (err) {
			console.error(
				'Database Connection Test and Sync: Server error: ',
				err
			);
			throw err;
		}

		// Start HTTP2 server
		await setupHttp(app);
	} catch (err) {
		console.error('Failed to start server: ', err);
		process.exit(1); // exit process with failure
	}
}

initializeServer();

export default app;
