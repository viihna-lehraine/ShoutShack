import express from 'express';
import path from 'path';
import setupLogger from '../middleware/logger.js';

const router = express.Router();

async function setupRoutes() {
	const logger = await setupLogger();
	const staticRootPath = process.env.STATIC_ROOT_PATH as string;

	// Define root file path for public/
	router.get('/', (req, res) => {
		logger.info('GET request received at /');
		res.sendFile(path.join(staticRootPath, 'index.html'));
		logger.info('index.html was accessed');
	});

	// Serve root HTML files
	router.get('/:page', (req, res) => {
		const page = req.params.page;
		res.sendFile(path.join(staticRootPath, `${page}.html`), (err) => {
			if (err) {
				res.status(404).send('Page not found');
			}
		});
	});

	// Serve static directories
	router.use('/css', express.static(path.join(staticRootPath, 'assets/css')));
	router.use('/js', express.static(path.join(staticRootPath, 'assets/js')));
	router.use(
		'/images',
		express.static(path.join(staticRootPath, 'assets/images'))
	);
	router.use(
		'/fonts',
		express.static(path.join(staticRootPath, 'assets/fonts'))
	);
	router.use(
		'/icons',
		express.static(path.join(staticRootPath, 'assets/icons'))
	);

	// Serve nested HTML files
	router.get('/*', (req, res) => {
		res.sendFile(path.join(staticRootPath, req.path + '.html'), (err) => {
			if (err) {
				res.status(404).send('Page not found');
			}
		});
	});

	// Serve specific static files
	router.get('/app.js', (req, res) => {
		logger.info('GET request received at /app.js');
		res.sendFile(process.env.FRONTEND_APP_JS_PATH as string);
		logger.info('app.js was accessed');
	});

	router.get('/secrets.json.gpg', (req, res) => {
		logger.info('GET request received at /secrets.json.gpg');
		res.sendFile(process.env.FRONTEND_SECRETS_PATH as string, (err) => {
			if (err) {
				logger.error('Failed to send secrets.json.gpg:', err);
				res.status(404).send('File not found');
			} else {
				logger.info('secrets.json.gpg was accessed');
			}
		});
	});

	router.get('/browser-config.xml', (req, res) => {
		logger.info('GET request received at /browser-config.xml');
		res.sendFile(process.env.FRONTEND_BROWSER_CONFIG_XML_PATH as string);
		logger.info('browser-config.xml was accessed');
	});

	router.get('/humans.md', (req, res) => {
		logger.info('GET request received at /humans.md');
		res.sendFile(process.env.FRONTEND_HUMANS_MD_PATH as string);
		logger.info('humans.md was accessed');
	});

	router.get('/robots.txt', (req, res) => {
		logger.info('GET request received at /robots.txt');
		res.sendFile(process.env.FRONTEND_ROBOTS_TXT_PATH as string);
		logger.info('robots.txt was accessed');
	});

	// 404 handler for unmatched routes
	router.use((req, res) => {
		res.status(404).sendFile(path.join(staticRootPath, 'not-found.html'));
		logger.info('404 - Not Found');
	});
}

// For setting up routes when initializing the application
export default async function initializeRoutes(app) {
	try {
		await setupRoutes();
		app.use('/', router);
	} catch (err) {
		console.error('Error setting up routes: ', err);
	}
}