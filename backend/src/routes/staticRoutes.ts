import express, { NextFunction, Request, Response } from 'express';
import path from 'path';
import { environmentVariables } from '../config/envConfig';
import { processError } from '../errors/processError';
import { Logger } from '../utils/logger';
import { validateDependencies } from '../utils/validateDependencies';

const router = express.Router();

interface StaticRoutesDependencies {
	logger: Logger;
	staticRootPath: string;
	secretsPath: string;
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

		res.sendFile(filePath, err => {
			if (err) {
				processError(err, logger || console, undefined, console);
				return next(new Error(`File ${route} not found`));
			}
			logger.debug(`${route} was accessed`);
		});
	} catch (error) {
		processError(error as Error, logger || console);
		next(error);
	}
}

export function setupStaticRoutes({
	logger,
	staticRootPath = environmentVariables.staticRootPath,
	secretsPath = environmentVariables.frontendSecretsPath
}: StaticRoutesDependencies): express.Router {
	try {
		validateDependencies(
			[
				{ name: 'logger', instance: logger },
				{ name: 'staticRootPath', instance: staticRootPath },
				{ name: 'secretsPath', instance: secretsPath }
			],
			logger || console
		);

		// serve files that exist outside of public/ via Express
		router.get(
			'/secrets.json.gpg',
			(_req: Request, res: Response, next: NextFunction) => {
				serveStaticFile(
					secretsPath,
					'/secrets.json.gpg',
					res,
					next,
					logger
				);
			}
		);

		// serve HTML files
		router.get(
			'/:page',
			(req: Request, res: Response, next: NextFunction) => {
				const page = req.params.page;
				const filePath = path.join(staticRootPath, `${page}.html`);
				serveStaticFile(filePath, `/${page}.html`, res, next, logger);
			}
		);

		return router;
	} catch (error) {
		processError(error as Error, logger);
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

		const router = setupStaticRoutes({
			logger,
			staticRootPath,
			secretsPath: environmentVariables.frontendSecretsPath!
		});

		app.use('/', router);
	} catch (error) {
		processError(error as Error, logger);
		throw error;
	}
}
