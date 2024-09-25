import express, { NextFunction, Request, Response } from 'express';
import path from 'path';
import { configService } from '../services/configService';
import { errorHandler } from '../services/errorHandler';
import { validateDependencies } from '../utils/helpers';
import { StaticRoutesInterface } from '../index/interfaces';

const router = express.Router();
const logger = configService.getAppLogger();
const errorLogger = configService.getErrorLogger();
const envVariables = configService.getEnvVariables();

function serveStaticFile(
	filePath: string,
	route: string,
	req: Request,
	res: Response,
	next: NextFunction
): void {
	try {
		res.sendFile(filePath, error => {
			if (error) {
				const expressError = new errorHandler.ErrorClasses.ExpressError(
					`Error occurred when attempting to serve static file ${route}: ${error instanceof Error ? error.message : 'Unknown error'}`,
					{ exposeToClient: false }
				);
				errorLogger.logError(expressError.message);
				errorHandler.expressErrorHandler()(
					expressError,
					req,
					res,
					next
				);
				errorHandler.sendClientErrorResponse({
					message: `${filePath} not found`,
					statusCode: 404,
					res
				});
				next();
			}
			logger.debug(`${route} was accessed`);
		});
	} catch (expressError) {
		const expressRouterError = new errorHandler.ErrorClasses.ExpressError(
			`Error occurred when attempting to serve static file ${route}: ${expressError instanceof Error ? expressError.message : 'Unknown error'}`,
			{ exposeToClient: false }
		);
		errorLogger.logError(expressRouterError.message);
		errorHandler.expressErrorHandler()(expressRouterError, req, res, next);
		errorHandler.sendClientErrorResponse({
			message: 'File not found',
			statusCode: 404,
			res
		});
		next(expressError);
	}
}

export function setUpStaticRoutes({
	staticRootPath = envVariables.staticRootPath,
	secretsPath = envVariables.frontendSecretsPath
}: StaticRoutesInterface): express.Router {
	try {
		validateDependencies(
			[
				{ name: 'staticRootPath', instance: staticRootPath },
				{ name: 'secretsPath', instance: secretsPath }
			],
			logger
		);

		// serve files that exist outside of /frontend/public/ with Express
		router.get(
			'/secrets.json.gpg',
			(_req: Request, res: Response, next: NextFunction) => {
				serveStaticFile(
					secretsPath,
					'/secrets.json.gpg',
					_req,
					res,
					next
				);
			}
		);

		// serve HTML files
		router.get(
			'/:page',
			(req: Request, res: Response, next: NextFunction) => {
				const page = req.params.page;
				const filePath = path.join(staticRootPath, `${page}.html`);
				serveStaticFile(filePath, `/${page}.html`, req, res, next);
			}
		);

		return router;
	} catch (configError) {
		const configurationError =
			new errorHandler.ErrorClasses.ConfigurationError(
				`Fatal error occurred when attempting to set up Express static routes\n${configError instanceof Error ? configError.message : 'Unknown error'}`,
				{ exposeToClient: false }
			);
		errorLogger.logError(configurationError.message);
		errorHandler.handleError({
			error: configurationError || configError || Error || 'Unknown error'
		});
		throw configurationError;
	}
}

export function initializeStaticRoutes(
	app: express.Application,
	staticRootPath: string
): void {
	try {
		validateDependencies(
			[
				{ name: 'app', instance: app },
				{ name: 'staticRootPath', instance: staticRootPath }
			],
			logger
		);

		const router = setUpStaticRoutes({
			staticRootPath,
			secretsPath: envVariables.frontendSecretsPath,
			configService,
			logger,
			errorLogger,
			errorHandler,
			validateDependencies
		});

		app.use('/', router);
	} catch (configError) {
		const configurationError =
			new errorHandler.ErrorClasses.ConfigurationError(
				`Fatal error occurred when attempting to initialize Express static routes using initializeStaticRoutes(): ${configError instanceof Error ? configError.message : 'Unknown error'}`,
				{ exposeToClient: false }
			);
		errorLogger.logError(configurationError.message);
		errorHandler.handleError({
			error: configurationError || configError || Error || 'Unknown error'
		});
		throw configurationError;
	}
}
