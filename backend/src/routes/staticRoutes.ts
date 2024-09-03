import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { environmentVariables } from '../config/environmentConfig';
import { setupLogger } from '../config/logger';

const router = express.Router();

interface StaticRoutesDependencies {
	logLevel: string;
	logDirectory: string;
	serviceName?: string;
	isProduction?: boolean;
	staticRootPath: string;
	appJsPath: string;
	secretsPath: string;
	browserConfigXmlPath: string;
	humansMdPath: string;
	robotsTxtPath: string;
}

// Helper function to serve static files and handle errors (added to reduce code redundancy)
function serveStaticFile(
	filePath: string,
	route: string,
	res: Response,
	next: NextFunction,
	logger: ReturnType<typeof setupLogger>
): void {
	if (!filePath) {
		logger.error(`File path for ${route} is undefined.`);
		res.status(500).json({ error: `Internal server error` });
		return;
	}

	res.sendFile(filePath, err => {
		if (err) {
			if (err instanceof Error) {
				logger.error(`Failed to send ${route}: ${err.message}`, {
					stack: err.stack
				});
			} else {
				logger.error(`Unknown error sending ${route}`, {
					error: err
				});
			}
			return next(new Error(`File ${route} not found`));
		}
		logger.debug(`${route} was accessed`);
	});
}

// Set up static routes
export function setupStaticRoutes({
	staticRootPath = environmentVariables.staticRootPath,
	appJsPath = environmentVariables.frontendAppJsPath,
	secretsPath = environmentVariables.frontendSecretsPath,
	browserConfigXmlPath = environmentVariables.frontendBrowserConfigXmlPath,
	humansMdPath = environmentVariables.frontendHumansMdPath,
	robotsTxtPath = environmentVariables.frontendRobotsTxtPath,
	logLevel = environmentVariables.logLevel,
	logDirectory = environmentVariables.serverLogPath,
	serviceName = 'StaticRouter',
	isProduction = environmentVariables.nodeEnv === 'production'
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
			logger.debug(`GET request received at ${req.url}`);
		}
		next();
	});

	// serve root HTML files
	router.get('/:page', (req: Request, res: Response, next: NextFunction) => {
		const page = req.params.page;
		const filePath = path.join(staticRootPath, `${page}.html`);
		res.sendFile(filePath, err => {
			if (err) {
				if (err instanceof Error) {
					logger.error(`Failed to send ${page}.html`, {
						stack: err.stack
					});
				} else {
					logger.error(`Unknown error sending ${page}.html`, {
						error: err
					});
				}
				res.status(404).json({ error: `Page ${page}.html not found` });
				return next(err);
			} else {
				logger.debug(`${page}.html was accessed`);
			}
		});
	});

	// serve static directories using optional chaining
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

	// serve static files using helper function
	staticFiles.forEach(file => {
		router.get(
			file.route,
			(_req: Request, res: Response, next: NextFunction) => {
				logger.debug(`GET request received at ${file.route}`);
				try {
					serveStaticFile(
						file.filePath,
						file.route,
						res,
						next,
						logger
					);
					logger.debug(`${file.route} was accessed`);
				} catch (err) {
					if (err instanceof Error) {
						logger.error(
							`Failed to send ${file.route}: ${err.message}`,
							{ stack: err.stack }
						);
					} else {
						logger.error(`Unknown error sending ${file.route}`, {
							error: err
						});
					}
				}
			}
		);
	});

	// 404 handler for unmatched routes
	router.use((req: Request, res: Response, next: NextFunction) => {
		logger.info(`404 - ${req.url} was not found`);
		const notFoundFilePath = path.join(staticRootPath, 'not-found.html');
		res.sendFile(notFoundFilePath, err => {
			if (err) {
				if (err instanceof Error) {
					logger.error(`Failed to send not-found.html`, {
						stack: err.stack
					});
				} else {
					logger.error(`Unknown error sending not-found.html`, {
						error: err
					});
				}
				res.status(500).json({ error: 'Internal server error' });
				return next(err);
			} else {
				logger.debug(`not-found.html was accessed for ${req.url}`);
			}
		});
	});

	// general error handler for uncaught errors in the router
	router.use((err: unknown, req: Request, res: Response) => {
		if (err instanceof Error) {
			logger.error(`Unexpected error: ${err.message}`, {
				stack: err.stack
			});
		} else {
			logger.error(`Unexpected non-error thrown: `, { error: err });
		}
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
