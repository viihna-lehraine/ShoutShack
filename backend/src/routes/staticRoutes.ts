import express, { NextFunction, Request, Response } from 'express';
import path from 'path';
import { envVariables } from '../environment/envVars';
import { errorClasses, ErrorSeverity } from '../errors/errorClasses';
import { ErrorLogger } from '../errors/errorLogger';
import { expressErrorHandler, processError } from '../errors/processError';
import { Logger } from '../utils/appLogger';
import { validateDependencies } from '../utils/validateDependencies';

const router = express.Router();

interface StaticRoutesDependencies {
	logger: Logger;
	staticRootPath: string;
	secretsPath: string;
}

// serve static files and handle errors
function serveStaticFile(
	filePath: string,
	route: string,
	req: Request,
	res: Response,
	next: NextFunction,
	logger: Logger
): void {
	try {
		validateDependencies(
			[
				{ name: 'filePath', instance: filePath },
				{ name: 'route', instance: route },
				{ name: 'req', instance: req },
				{ name: 'res', instance: res },
				{ name: 'next', instance: next },
				{ name: 'logger', instance: logger }
			],
			logger || console
		);

		res.sendFile(filePath, error => {
			if (error) {
				const errorResponse: string = `${filePath} not found`;
				const expressError = new errorClasses.ExpressError(
					`Error occurred when attempting to serve static file ${route}: ${error instanceof Error ? error.message : 'Unknown error'}`,
					{
						statusCode: 404,
						severity: ErrorSeverity.RECOVERABLE,
						exposeToClient: false
					}
				);
				ErrorLogger.logError(expressError, logger);
				expressErrorHandler({ logger })(
					expressError,
					req,
					res,
					errorResponse
				);
				next();
			}
			logger.debug(`${route} was accessed`);
		});
	} catch (expressError) {
		const errorResponse = 'Internal Server Error';
		const expressRouterError = new errorClasses.ExpressError(
			`Error occurred when attempting to serve static file ${route}: ${expressError instanceof Error ? expressError.message : 'Unknown error'}`,
			{
				statusCode: 500,
				severity: ErrorSeverity.RECOVERABLE,
				exposeToClient: false
			}
		);
		ErrorLogger.logError(expressRouterError, logger);
		expressErrorHandler({ logger })(
			expressRouterError,
			req,
			res,
			errorResponse
		);
		next(expressError);
	}
}

export function setupStaticRoutes({
	logger,
	staticRootPath = envVariables.staticRootPath,
	secretsPath = envVariables.frontendSecretsPath
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
					_req,
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
				serveStaticFile(
					filePath,
					`/${page}.html`,
					req,
					res,
					next,
					logger
				);
			}
		);

		return router;
	} catch (configError) {
		const configurationError = new errorClasses.ConfigurationError(
			`Fatal error occurred when attempting to configure Express static routes using setupStaticRoutes(): ${configError instanceof Error ? configError.message : 'Unknown error'}`,
			{ exposeToClient: false }
		);
		ErrorLogger.logError(configurationError, logger || console);
		processError(configurationError, logger || console);
		throw configurationError;
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
			secretsPath: envVariables.frontendSecretsPath!
		});

		app.use('/', router);
	} catch (configError) {
		const configurationError = new errorClasses.ConfigurationError(
			`Fatal error occurred when attempting to initialize Express static routes using initializeStaticRoutes(): ${configError instanceof Error ? configError.message : 'Unknown error'}`,
			{ exposeToClient: false }
		);
		ErrorLogger.logError(configurationError, logger || console);
		processError(configurationError, logger || console);
		throw configurationError;
	}
}
