import { NextFunction, Request, Response } from 'express';
import path from 'path';
import { BaseRouter } from './BaseRouter';
import { validateDependencies } from '../utils/helpers';

export class StaticRouter extends BaseRouter {
	private static instance: StaticRouter | null = null;
	private staticRootPath: string;

	private constructor() {
		super();
		this.staticRootPath = this.envConfig.getEnvVariable('staticRootPath');
		this.validateConfiguration();
		this.setUpRoutes();
	}

	public static getInstance(): StaticRouter {
		if (!StaticRouter.instance) {
			StaticRouter.instance = new StaticRouter();
		}
		return StaticRouter.instance;
	}

	private validateConfiguration(): void {
		validateDependencies(
			[{ name: 'staticRootPath', instance: this.staticRootPath }],
			this.logger
		);

		if (!this.staticRootPath || typeof this.staticRootPath !== 'string') {
			throw new this.errorHandler.ErrorClasses.ConfigurationError(
				'Invalid staticRootPath: must be a non-empty string',
				{ exposeToClient: false }
			);
		}
	}

	private setUpRoutes(): void {
		this.router.get('/:page', this.serveHtmlFile.bind(this));
	}

	private serveHtmlFile(
		req: Request,
		res: Response,
		next: NextFunction
	): void {
		const page = req.params.page;
		const filePath = path.join(this.staticRootPath, `${page}.html`);
		this.serveStaticFile(filePath, `/${page}.html`, req, res, next);
	}

	private serveStaticFile(
		filePath: string,
		route: string,
		req: Request,
		res: Response,
		next: NextFunction
	): void {
		res.sendFile(filePath, error => {
			if (error) {
				this.errorLogger.logError(
					`Error serving static file ${route}: ${error instanceof Error ? error.message : 'Unknown error'}`
				);
				this.errorHandler.sendClientErrorResponse({
					message: `${filePath} not found`,
					statusCode: 404,
					res
				});
				next(error);
			} else {
				this.logger.debug(`Served static file: ${route}`);
				next();
			}
		});
	}
}
