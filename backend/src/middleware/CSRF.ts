import { CSRFMiddlewareServiceInterface } from '../index/interfaces/services';
import { ServiceFactory } from '../index/factory';
import { Request, Response, NextFunction } from 'express';
import Tokens, { Options as CSRFOptions } from 'csrf';

export class CSRFMiddlewareService implements CSRFMiddlewareServiceInterface {
	private static instance: CSRFMiddlewareService | null = null;
	private csrfProtection: Tokens;
	private logger = ServiceFactory.getLoggerService();
	private errorLogger = ServiceFactory.getErrorLoggerService();
	private errorHandler = ServiceFactory.getErrorHandlerService();

	private constructor(options?: CSRFOptions) {
		this.csrfProtection = new Tokens(options);
	}

	public static getInstance(options?: CSRFOptions): CSRFMiddlewareService {
		if (!CSRFMiddlewareService.instance) {
			CSRFMiddlewareService.instance = new CSRFMiddlewareService(options);
		}

		return CSRFMiddlewareService.instance;
	}

	public initializeCSRFMiddleware() {
		return async (
			req: Request,
			res: Response,
			next: NextFunction
		): Promise<void> => {
			try {
				this.logger.info('CSRF middleware enabled');
				const sessionID = req.sessionID || '';
				const csrfToken = this.csrfProtection.create(sessionID);
				res.locals.csrfToken = csrfToken;

				if (this.isWhitelistedRoute(req.path)) {
					this.logger.debug(
						`Route ${req.path} is whitelisted from CSRF`
					);
					return next();
				}

				if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
					const token =
						req.body.csrfToken ||
						(req.headers['x-xsrf-token'] as string);
					if (!token) {
						this.logger.debug('No CSRF token provided');
						res.status(403).json({
							error: 'No CSRF token provided'
						});
						return;
					}
					if (!this.csrfProtection.verify(sessionID, token)) {
						this.logger.debug(
							`Invalid CSRF token for session ID: ${sessionID}`
						);
						res.status(403).json({ error: 'Invalid CSRF token' });
						return;
					}
					this.logger.debug('CSRF token validated successfully');
				}

				next();
			} catch (expressError) {
				const expressMiddlewareError =
					new this.errorHandler.ErrorClasses.ExpressError(
						`Error occurred in CSRF middleware\n${expressError instanceof Error ? expressError.message : String(expressError)}`,
						{ originalError: expressError }
					);
				this.errorLogger.logError(expressMiddlewareError.message);
				this.errorHandler.expressErrorHandler()(
					expressMiddlewareError,
					req,
					res,
					next
				);
			}
		};
	}

	private isWhitelistedRoute(path: string): boolean {
		const whitelistedRoutes = ['/api/webhook', '/api/special'];
		return whitelistedRoutes.includes(path);
	}

	public async shutdown(): Promise<void> {
		try {
			this.logger.info('Shutting down CSRF Middleware Service...');
			CSRFMiddlewareService.instance = null;
			this.logger.info('CSRF Middleware Service has been shut down.');
		} catch (error) {
			this.errorLogger.logError(
				`Error shutting down CSRF Middleware service: ${error instanceof Error ? error.message : error}`
			);
		}
	}
}
