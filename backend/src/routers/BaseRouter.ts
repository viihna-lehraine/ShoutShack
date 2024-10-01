import express, {
	Application,
	NextFunction,
	Request,
	Response,
	Router
} from 'express';
import { ServiceFactory } from '../index/factory';
import { BaseRouterInterface } from '../index/interfaces';
import { sanitizeRequestBody } from '../utils/validator';
import compression from 'compression';
import hpp from 'hpp';
import passport from 'passport';
import xss from 'xss';

export class BaseRouter implements BaseRouterInterface {
	protected router: Router;
	protected logger = ServiceFactory.getLoggerService();
	protected errorLogger = ServiceFactory.getErrorLoggerService();
	protected errorHandler = ServiceFactory.getErrorHandlerService();
	protected envConfig = ServiceFactory.getEnvConfigService();
	protected cacheService = ServiceFactory.getCacheService();
	protected gatekeeperService = ServiceFactory.getGatekeeperService();
	protected helmetService = ServiceFactory.getHelmetMiddlewareService();
	protected JWTMiddleware = ServiceFactory.getJWTAuthMiddlewareService();
	protected passportMiddleware =
		ServiceFactory.getPassportAuthMiddlewareService();

	constructor() {
		this.router = express.Router();
		this.applyErrorHandler();
		this.applyMiddlewares();
	}

	public getRouter(): Router {
		return this.router;
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

	private applyMiddlewares(): void {
		this.applyErrorHandler();
		this.applySanitization();
		this.applyGatekeeper();
		this.applySecurityHeaders(app);
		this.applyCompression();
		this.applyPassportAndJWTAuth();
	}

	private applyCompression(): void {
		this.router.use(compression());
	}

	private applyGatekeeper(): void {
		this.router.use(this.gatekeeperService.rateLimitMiddleware());
		this.router.use(this.gatekeeperService.slowdownMiddleware());
		this.router.use(this.gatekeeperService.ipBlacklistMiddleware());
	}

	private applyPassportAndJWTAuth(): void {
		this.router.use(
			this.passportMiddleware.initializePassportAuthMiddleware()
		);
		this.router.use(passport.session());
		this.router.use(this.JWTMiddleware.initializeJWTAuthMiddleware());
	}

	private applySanitization(): void {
		this.router.use(
			async (req: Request, res: Response, next: NextFunction) => {
				req.body = await sanitizeRequestBody(req.body);

				for (const key in req.query) {
					if (req.query.hasOwnProperty(key)) {
						req.query[key] = xss(req.query[key] as string);
					}
				}

				for (const key in req.params) {
					if (req.params.hasOwnProperty(key)) {
						req.params[key] = xss(req.params[key]);
					}
				}
				next();
			}
		);
	}

	private applySecurityHeaders(app: Application): void {
		this.router.use(this.helmetService.initializeHelmetMiddleware(app));
		this.router.use(hpp());
	}

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
}
