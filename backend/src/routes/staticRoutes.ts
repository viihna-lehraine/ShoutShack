import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { environmentVariables } from '../config/environmentConfig';
import { Logger } from '../config/logger';
import {
	handleGeneralError,
	validateDependencies
} from '../middleware/errorHandler';

const router = express.Router();

interface StaticRoutesDependencies {
	logger: Logger;
	staticRootPath: string;
	appJsPath: string;
	secretsPath: string;
	browserConfigXmlPath: string;
	humansMdPath: string;
	robotsTxtPath: string;
}

// Helper function to serve static files and handle errors
function serveStaticFile(
	filePath: string,
	route: string,
	res: Response,
	next: NextFunction,
	logger: Logger
): void {
	try {
		validateDependencies(
			[
				{ name: 'filePath', instance: filePath },
				{ name: 'route', instance: route },
				{ name: 'res', instance: res },
				{ name: 'next', instance: next },
				{ name: 'logger', instance: logger }
			],
			logger || console
		);

		if (!filePath) {
			logger.error(`File path for ${route} is undefined.`);
			res.status(500).json({ error: `Internal server error` });
			return;
		}

		res.sendFile(filePath, err => {
			if (err) {
				handleGeneralError(err, logger || console, undefined, console);
				return next(new Error(`File ${route} not found`));
			}
			logger.debug(`${route} was accessed`);
		});
	} catch (error) {
		handleGeneralError(error as Error, logger || console);
		next(error);
	}
}

export function setupStaticRoutes({
	logger,
	staticRootPath = environmentVariables.staticRootPath,
	appJsPath = environmentVariables.frontendAppJsPath,
	secretsPath = environmentVariables.frontendSecretsPath,
	browserConfigXmlPath = environmentVariables.frontendBrowserConfigXmlPath,
	humansMdPath = environmentVariables.frontendHumansMdPath,
	robotsTxtPath = environmentVariables.frontendRobotsTxtPath
}: StaticRoutesDependencies): express.Router {
	try {
		validateDependencies(
			[
				{ name: 'logger', instance: logger },
				{ name: 'staticRootPath', instance: staticRootPath },
				{ name: 'appJsPath', instance: appJsPath },
				{ name: 'secretsPath', instance: secretsPath },
				{
					name: 'browserConfigXmlPath',
					instance: browserConfigXmlPath
				},
				{ name: 'humansMdPath', instance: humansMdPath },
				{ name: 'robotsTxtPath', instance: robotsTxtPath }
			],
			logger || console
		);

		// middleware to log static asset access
		router.use((req: Request, res: Response, next: NextFunction) => {
			try {
				validateDependencies(
					[
						{ name: 'req', instance: req },
						{ name: 'res', instance: res },
						{ name: 'next', instance: next },
						{ name: 'logger', instance: logger }
					],
					logger
				);

				const assetTypes = [
					'css',
					'/mjs',
					'js',
					'/fonts',
					'/icons',
					'/images'
				];

				if (assetTypes.some(type => req.url.startsWith(type))) {
					logger.debug(`GET request received at ${req.url}`);
				}

				next();
			} catch (error) {
				handleGeneralError(error, logger);
				next(error);
			}
		});

		// serve root HTML files
		router.get(
			'/:page',
			(req: Request, res: Response, next: NextFunction) => {
				try {
					validateDependencies(
						[
							{ name: 'req', instance: req },
							{ name: 'res', instance: res },
							{ name: 'next', instance: next },
							{
								name: 'staticRootPath',
								instance: staticRootPath
							},
							{ name: 'logger', instance: logger }
						],
						logger
					);

					const page = req.params.page;
					const filePath = path.join(staticRootPath, `${page}.html`);

					serveStaticFile(
						filePath,
						`/${page}.html`,
						res,
						next,
						logger
					);
				} catch (error) {
					handleGeneralError(error as Error, logger, req);
					next(error);
				}
			}
		);

		// serve static directories
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
					try {
						validateDependencies(
							[
								{ name: 'filePath', instance: file.filePath },
								{ name: 'route', instance: file.route },
								{ name: 'res', instance: res },
								{ name: 'next', instance: next },
								{ name: 'logger', instance: logger }
							],
							logger
						);

						logger.debug(`GET request received at ${file.route}`);

						serveStaticFile(
							file.filePath,
							file.route,
							res,
							next,
							logger
						);
					} catch (error) {
						handleGeneralError(error as Error, logger);
						next(error);
					}
				}
			);
		});

		// 404 handler for unmatched routes
		router.use((req: Request, res: Response, next: NextFunction) => {
			try {
				validateDependencies(
					[
						{ name: 'req', instance: req },
						{ name: 'res', instance: res },
						{ name: 'next', instance: next },
						{ name: 'staticRootPath', instance: staticRootPath },
						{ name: 'logger', instance: logger }
					],
					logger
				);

				logger.info(`404 - ${req.url} was not found`);

				const notFoundFilePath = path.join(
					staticRootPath,
					'not-found.html'
				);

				// attempt to send the 404 file
				res.sendFile(notFoundFilePath, err => {
					if (err) {
						handleGeneralError(err, logger, req);
						res.status(500).json({
							error: 'Internal server error'
						});

						return next(err);
					} else {
						logger.debug(
							`not-found.html was accessed for ${req.url}`
						);
					}
				});
			} catch (error) {
				handleGeneralError(error as Error, logger, req);
				next(error);
			}
		});

		return router;
	} catch (error) {
		handleGeneralError(error as Error, logger);
		throw error;
	}
}

export function initializeStaticRoutes(
	app: express.Application,
	staticRootPath: string,
	logger: Logger
): void {
	try {
		validateDependencies(
			[
				{ name: 'app', instance: app },
				{ name: 'staticRootPath', instance: staticRootPath },
				{ name: 'logger', instance: logger }
			],
			logger
		);

		// set up the static routes
		const router = setupStaticRoutes({
			logger,
			staticRootPath,
			appJsPath: environmentVariables.frontendAppJsPath!,
			secretsPath: environmentVariables.frontendSecretsPath!,
			browserConfigXmlPath:
				environmentVariables.frontendBrowserConfigXmlPath!,
			humansMdPath: environmentVariables.frontendHumansMdPath!,
			robotsTxtPath: environmentVariables.frontendRobotsTxtPath!
		});

		app.use('/', router);
	} catch (error) {
		handleGeneralError(error as Error, logger);
		throw error;
	}
}
