import express, { NextFunction, Request, Response, Router } from 'express';
import { ServiceFactory } from '../index/factory';
import { BaseRouterInterface } from '../index/interfaces';

export class BaseRouter implements BaseRouterInterface {
	protected router: Router;
	protected logger = ServiceFactory.getLoggerService();
	protected errorLogger = ServiceFactory.getErrorLoggerService();
	protected errorHandler = ServiceFactory.getErrorHandlerService();
	protected configService = ServiceFactory.getConfigService();

	constructor() {
		this.router = express.Router();
		this.applyErrorHandler();
	}

	protected asyncHandler = (
		fn: (
			req: Request,
			res: Response,
			next: NextFunction
		) => Promise<void | Response>
	): ((req: Request, res: Response, next: NextFunction) => void) => {
		return (req: Request, res: Response, next: NextFunction) => {
			fn(req, res, next).catch(next);
		};
	};

	protected handleRouteError(
		error: unknown,
		req: Request,
		res: Response,
		next: NextFunction
	): void {
		const expressError = new this.errorHandler.ErrorClasses.ExpressError(
			`Route error: ${error instanceof Error ? error.message : 'Unknown error'}`,
			{ exposeToClient: false }
		);
		this.errorLogger.logError(expressError.message);
		this.errorHandler.expressErrorHandler()(expressError, req, res, next);
	}

	private applyErrorHandler(): void {
		this.router.use(
			(err: unknown, req: Request, res: Response, next: NextFunction) => {
				this.errorHandler.expressErrorHandler()(
					err as Error,
					req,
					res,
					next
				);
			}
		);
	}

	public getRouter(): Router {
		return this.router;
	}
}
