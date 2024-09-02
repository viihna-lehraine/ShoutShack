import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { setupLogger } from '../config/logger';
import { environmentVariables } from 'src/config/environmentConfig';

const router = express.Router();

interface StaticRoutesDependencies {
	logLevel?: string;
	logDirectory?: string;
	serviceName?: string;
	isProduction?: boolean;
	staticRootPath: string;
	appJsPath: string;
	secretsPath: string;
	browserConfigXmlPath: string;
	humansMdPath: string;
	robotsTxtPath: string;
}

// Setup static routes
export function setupStaticRoutes({
	staticRootPath,
	appJsPath,
	secretsPath,
	browserConfigXmlPath,
	humansMdPath,
	robotsTxtPath,
	logLevel = 'info',
	logDirectory = './logs',
	serviceName = 'StaticRouter',
	isProduction = environmentVariables.nodeEnv === 'production' // *DEV-NOTE* change default value to production before deployment
}: StaticRoutesDependencies): express.Router {
	const logger = setupLogger({
		logLevel,
		logDirectory,
		serviceName,
		isProduction
	});

	// middleware to log static asset access
	router.use((req: Request, res: Response, next: NextFunction) => {
		const assetTypes = ['css', '/mjs', 'js', '/fonts', '/icons', '/images'];
		if (assetTypes.some(type => req.url.startsWith(type))) {
			logger.info(`GET request received at ${req.url}`);
		}
		next();
	});

	// serve root HTML files
	router.get('/:page', (req: Request, res: Response) => {
		const page = req.params.page;
		const filePath = path.join(staticRootPath, `${page}.html`);
		res.sendFile(filePath, err => {
			if (err instanceof Error) {
				logger.error(`Failed to send ${page}.html`, {
					stack: err.stack
				});
				res.status(404).json({ error: `Page ${page}.html not found` });
			} else {
				logger.info(`${page}.html was accessed`);
			}
		});
	});

	// serve static directories using Optional Chaining
	const staticDirectories = {
		css: path.join(staticRootPath, 'assets/css'),
		mjs: path.join(staticRootPath, 'assets/mjs'),
		js: path.join(staticRootPath, 'assets/js'),
		fonts: path.join(staticRootPath, 'assets/fonts'),
		icons: path.join(staticRootPath, 'assets/icons'),
		images: path.join(staticRootPath, 'assets/images')
	};

	Object.entries(staticDirectories).forEach(([route, dirPath]) => {
		router.use(`/${route}`, express.static(dirPath));
	});

	// serve specific static files
	const staticFiles = [
		{ route: '/app.js', filePath: appJsPath },
		{ route: '/secrets.json.gpg', filePath: secretsPath },
		{ route: '/browserconfig.xml', filePath: browserConfigXmlPath },
		{ route: '/humans.md', filePath: humansMdPath },
		{ route: '/robots.txt', filePath: robotsTxtPath }
	];

	staticFiles.forEach(file => {
		router.get(
			file.route,
			(_req: Request, res: Response, next: NextFunction) => {
				logger.info(`GET request received at ${file.route}`);

				if (!file.filePath) {
					logger.error(`File path for ${file.route} is undefined.`);
					return res
						.status(500)
						.json({ error: `Internal server error` });
				}

				res.sendFile(file.filePath, err => {
					if (err) {
						logger.error(
							`Failed to send ${file.route}: ${err instanceof Error ? err.message : 'Unknown error'}`,
							err instanceof Error ? { stack: err.stack } : {}
						);
						return next(new Error(`File ${file.route} not found`));
					}

					logger.info(`${file.route} was accessed`);
					return res.end();
				});
				logger.warn(
					'This should not be reached. Static route returning undefined.'
				);
				return undefined;
			}
		);
	});

	// 404 handler for unmatched routes
	router.use((req: Request, res: Response) => {
		logger.info(`404 - ${req.url} was not found`);
		const notFoundFilePath = path.join(staticRootPath, 'not-found.html');
		res.sendFile(notFoundFilePath, err => {
			if (err instanceof Error) {
				logger.error(`Failed to send not-found.html`, {
					stack: err.stack
				});
				res.status(500).json({ error: 'Internal server error' });
			} else {
				logger.info(`not-found.html was accessed for ${req.url}`);
			}
		});
	});

	// general error handler for uncaught errors in the router
	router.use((err: Error, req: Request, res: Response) => {
		logger.error(`Unexpected error: ${err.message}`, {
			stack: err.stack
		});
		res.status(500).json({ error: 'Internal server error' });
	});

	return router;
}

// Initialize the static routes
export function initializeStaticRoutes(
	app: express.Application,
	staticRootPath: string
): void {
	const router = setupStaticRoutes({
		staticRootPath,
		appJsPath: environmentVariables.frontendAppJsPath!,
		secretsPath: environmentVariables.frontendSecretsPath!,
		browserConfigXmlPath:
			environmentVariables.frontendBrowserConfigXmlPath!,
		humansMdPath: environmentVariables.frontendHumansMdPath!,
		robotsTxtPath: environmentVariables.frontendRobotsTxtPath!,
		logLevel: environmentVariables.logLevel!,
		logDirectory: environmentVariables.serverLogPath!,
		serviceName: environmentVariables.serviceName!,
		isProduction: environmentVariables.nodeEnv === 'production'
	});
	app.use('/', router);
}
