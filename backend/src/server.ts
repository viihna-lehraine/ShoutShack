import passport from 'passport';
import loadEnv from './config/loadEnv';
import {
	initializeDatabase,
	configurePassport,
	initializeIpBlacklist,
	setupHttp
} from './index';
import { app, initializeApp } from './config/app';
import { getFeatureFlags } from './config/featureFlags';
import { getSequelizeInstance } from './config/db';
import setupLogger from './config/logger';
import { initializeModels } from './models/ModelsIndex';

loadEnv();

const logger = setupLogger();
logger.info('Logger is working');

logger.info(
	'NODE_ENV ',
	process.env.NODE_ENV,
	'SERVER PORT ',
	process.env.SERVER_PORT,
	'EMAIL USER ',
	process.env.EMAIL_USER,
	'BACKEND LOG EXPORT PATH ',
	process.env.BACKEND_LOG_EXPORT_PATH,
	'STATIC_ROOT_PATH ',
	process.env.STATIC_ROOT_PATH,
	'FRONTEND_APP_JS_PATH ',
	process.env.FRONTEND_APP_JS_PATH,
	'FRONTEND_BROWSER_CONFIG_XML_PATH ',
	process.env.FRONTEND_BROWSER_CONFIG_XML_PATH,
	'FRONTEND_CSS_PATH ',
	process.env.FRONTEND_CSS_PATH,
	'FRONTEND_FONTS_PATH ',
	process.env.FRONTEND_FONTS_PATH,
	'FRONTEND_HUMANS_MD_PATH ',
	process.env.FRONTEND_HUMANS_MD_PATH,
	'FRONTEND_ICONS_PATH ',
	process.env.FRONTEND_ICONS_PATH,
	'FRONTEND_IMAGES_PATH ',
	process.env.FRONTEND_IMAGES_PATH,
	'FRONTEND_JS_PATH ',
	process.env.FRONTEND_JS_PATH,
	'FRONTEND_KEYS_PATH ',
	process.env.FRONTEND_KEYS_PATH,
	'FRONTEND_LOGOS_PATH ',
	process.env.FRONTEND_LOGOS_PATH,
	'FRONTEND_ROBOTS_TXT_PATH ',
	process.env.FRONTEND_ROBOTS_TXT_PATH,
	'FRONTEND_SECURITY_MD_PATH ',
	process.env.FRONTEND_SECURITY_MD_PATH,
	'FRONTEND_SECRETS_PATH ',
	process.env.FRONTEND_SECRETS_PATH,
	'FRONTEND_SITEMAP_XML_PATH ',
	process.env.FRONTEND_SITEMAP_XML_PATH,
	'SERVER_DATA_FILE_PATH_1 ',
	process.env.SERVER_DATA_FILE_PATH_1,
	'SERVER_DATA_FILE_PATH_2 ',
	process.env.SERVER_DATA_FILE_PATH_2,
	'SERVER_DATA_FILE_PATH_3 ',
	process.env.SERVER_DATA_FILE_PATH_3,
	'SERVER_DATA_FILE_PATH_4 ',
	process.env.SERVER_DATA_FILE_PATH_4,
	'SERVER_LOG_PATH ',
	process.env.SERVER_LOG_PATH,
	'SERVER_NPM_LOG_PATH ',
	process.env.SERVER_NPM_LOG_PATH,
	'SERVER_SSL_KEY_PATH ',
	process.env.SERVER_SSL_KEY_PATH,
	'SERVER_SSL_CERT_PATH ',
	process.env.SERVER_SSL_CERT_PATH,
	'FEATURE API ROUTES CSRF ',
	process.env.FEATURE_API_ROUTES_CSRF,
	'FEATURE DB SYNC ',
	process.env.FEATURE_DB_SYNC,
	'FEATURE HTTPS REDIRECT ',
	process.env.FEATURE_HTTPS_REDIRECT,
	'FEATURE IP BLACKLIST ',
	process.env.FEATURE_IP_BLACKLIST,
	'FEATURE LOAD STATIC ROUTES ',
	process.env.FEATURE_LOAD_STATIC_ROUTES,
	'FEATURE LOAD TEST ROUTES ',
	process.env.FEATURE_LOAD_TEST_ROUTES,
	'FEATURE SECURE HEADERS ',
	process.env.FEATURE_SECURE_HEADERS,
	'FEATURE SEQUELIZE LOGGING ',
	process.env.FEATURE_SEQUELIZE_LOGGING,
	'LOGGER ',
	process.env.LOGGER,
	'YUBICO API URL ',
	process.env.YUBICO_API_URL
);

const featureFlags = getFeatureFlags();

try {
	logger.info('Initializing database');
	await initializeDatabase();

	logger.info('Initializing models');
	initializeModels();

	logger.info('Initializing passport');
	await configurePassport(passport);

	logger.info('Initializing IP blacklist');
	await initializeIpBlacklist();

	logger.info('Initializing app');
	await initializeApp();

	const dbSyncFlag = featureFlags?.dbSyncFlag ?? false;
	if (dbSyncFlag) {
		logger.info(
			'Testing database connection and syncing models using getSequelizeInstance'
		);
		const sequelize = getSequelizeInstance();
		try {
			await sequelize.sync();
			logger.info('Database and tables created!');
		} catch (err) {
			logger.error(
				'Database Connection Test and Sync: Server error:',
				err
			);
			process.exit(1);
		}
	}

	logger.info('Starting server');
	const { startServer } = await setupHttp(app);
	startServer();
	logger.info('Server started successfully!');
} catch (err) {
	logger.error('Unhandled error during server initialization:', err);
	process.exit(1);
}

export default app;
