import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import setupLogger from '../config/logger';

const router = express.Router();

interface StaticRoutesDependencies {
	logLevel?: string;
	logDirectory?: string;
	serviceName?: string;
	isProduction?: boolean;
	staticRootPath: string;
	appMjsPath: string;
	appJsPath: string;
	secretsPath: string;
	browserConfigXmlPath: string;
	humansMdPath: string;
	robotsTxtPath: string;
}

export function setupStaticRoutes(
	deps: StaticRoutesDependencies
): express.Router {
	const logger = setupLogger({
		logLevel: deps.logLevel,
		logDirectory: deps.logDirectory,
		serviceName: deps.serviceName,
		isProduction: deps.isProduction
	});

	const {
		staticRootPath,
		appMjsPath,
		appJsPath,
		secretsPath,
		browserConfigXmlPath,
		humansMdPath,
		robotsTxtPath
	} = deps;

	// Middleware to log static asset access
	router.use((req: Request, res: Response, next: NextFunction) => {
		const assetTypes = ['css', '/mjs', 'js', '/fonts', '/icons', '/images'];
		if (assetTypes.some(type => req.url.startsWith(type))) {
			logger.info(`GET request received at ${req.url}`);
		}
		next();
	});

	// Serve root HTML files
	router.get('/:page', (req: Request, res: Response) => {
		const page = req.params.page;
		const filePath = path.join(staticRootPath, `${page}.html`);
		res.sendFile(filePath, err => {
			if (err) {
				logger.error(`Failed to send ${page}.html: ${err}`);
				res.status(404).send('Page not found');
			} else {
				logger.info(`${page}.html was accessed`);
			}
		});
	});

	// Serve static directories
	router.use('/css', express.static(path.join(staticRootPath, 'assets/css')));
	router.use('/mjs', express.static(path.join(staticRootPath, 'assets/mjs')));
	router.use('/js', express.static(path.join(staticRootPath, 'assets/js')));
	router.use(
		'/fonts',
		express.static(path.join(staticRootPath, 'assets/fonts'))
	);
	router.use(
		'/icons',
		express.static(path.join(staticRootPath, 'assets/icons'))
	);
	router.use(
		'/images',
		express.static(path.join(staticRootPath, 'assets/images'))
	);

	// Serve nested HTML files
	router.get('/*', (req: Request, res: Response) => {
		const filePath = path.join(staticRootPath, `${req.path}.html`);
		res.sendFile(filePath, err => {
			if (err) {
				logger.error(`Failed to send ${req.path}.html: ${err}`);
				res.status(404).send('Page not found');
			} else {
				logger.info(`${req.path}.html was accessed`);
			}
		});
	});

	// Serve specific static files
	const staticFiles = [
		{ route: '/app.mjs', filePath: appMjsPath },
		{ route: '/app.js', filePath: appJsPath },
		{ route: '/secrets.json.gpg', filePath: secretsPath },
		{ route: '/browserconfig.xml', filePath: browserConfigXmlPath },
		{ route: '/humans.md', filePath: humansMdPath },
		{ route: '/robots.txt', filePath: robotsTxtPath }
	];

	staticFiles.forEach(file => {
		router.get(file.route, (req: Request, res: Response) => {
			logger.info(`GET request received at ${file.route}`);
			res.sendFile(file.filePath, err => {
				if (err) {
					logger.error(`Failed to send ${file.route}: ${err}`);
					res.status(404).send('File not found');
				} else {
					logger.info(`${file.route} was accessed`);
				}
			});
		});
	});

	// 404 handler for unmatched routes
	router.use((req: Request, res: Response) => {
		logger.info(`404 - ${req.url} was not found`);
		res.status(404).sendFile(
			path.join(staticRootPath, 'not-found.html'),
			err => {
				if (err) {
					logger.error(`Failed to send not-found.html: ${err}`);
					res.status(500).send('Internal server error');
				}
			}
		);
	});

	return router;
}

export function initializeStaticRoutes(app: express.Application): void {
	const deps: StaticRoutesDependencies = {
		staticRootPath: process.env.STATIC_ROOT_PATH!,
		appMjsPath: process.env.FRONTEND_APP_MJS_PATH!,
		appJsPath: process.env.FRONTEND_APP_JS_PATH!,
		secretsPath: process.env.FRONTEND_SECRETS_PATH!,
		browserConfigXmlPath: process.env.FRONTEND_BROWSER_CONFIG_XML_PATH!,
		humansMdPath: process.env.FRONTEND_HUMANS_MD_PATH!,
		robotsTxtPath: process.env.FRONTEND_ROBOTS_TXT_PATH!,
		logLevel: process.env.LOG_LEVEL!,
		logDirectory: process.env.LOG_DIRECTORY!,
		serviceName: process.env.SERVICE_NAME!,
		isProduction: process.env.NODE_ENV! === 'development' ? false : true
	};
	const router = setupStaticRoutes(deps);
	app.use('/', router);
}
