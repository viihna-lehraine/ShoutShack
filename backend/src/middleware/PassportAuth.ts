import { Request, RequestHandler, Response, NextFunction } from 'express';
import {
	PassportAuthMiddlewareServiceInterface,
	PassportAuthMiddlewareServiceDeps
} from '../index/interfaces';
import { ServiceFactory } from '../index/factory';

export class PassportAuthMiddlewareService
	implements PassportAuthMiddlewareServiceInterface
{
	private static instance: PassportAuthMiddlewareService | null = null;
	private logger = ServiceFactory.getLoggerService();
	private errorLogger = ServiceFactory.getErrorLoggerService();
	private errorHandler = ServiceFactory.getErrorHandlerService();

	private constructor() {}

	public static getInstance(): PassportAuthMiddlewareService {
		if (!PassportAuthMiddlewareService.instance) {
			PassportAuthMiddlewareService.instance =
				new PassportAuthMiddlewareService();
		}
		return PassportAuthMiddlewareService.instance;
	}

	public initializePassportAuthMiddleware({
		passport,
		authenticateOptions,
		validateDependencies
	}: PassportAuthMiddlewareServiceDeps): RequestHandler {
		validateDependencies(
			[
				{ name: 'passport', instance: passport },
				{ name: 'authenticateOptions', instance: authenticateOptions }
			],
			this.logger
		);

		return (req: Request, res: Response, next: NextFunction): void => {
			try {
				passport.authenticate(
					'jwt',
					authenticateOptions,
					(err: Error | null, user: Express.User | false) => {
						if (err) {
							this.logger.error(
								`Passport authentication error: ${err.message}`
							);
							res.status(500).json({
								error: 'Internal Server Error'
							});
							return;
						}

						if (!user) {
							this.logger.warn('Unauthorized access attempt');
							res.status(401).json({ error: 'Unauthorized' });
							return;
						}

						req.user = user;
						return next();
					}
				)(req, res, next);
			} catch (expressError) {
				this.handleError(expressError, req, res, next);
			}
		};
	}

	private handleError(
		expressError: Error | unknown,
		req: Request,
		res: Response,
		next: NextFunction
	): void {
		const middleware: string = 'PassportMiddlewareService';
		const expressMiddlewareError =
			new this.errorHandler.ErrorClasses.ExpressError(
				`Fatal error: Execution of ${middleware} failed\nShutting down...\n${
					expressError instanceof Error
						? expressError.message
						: 'Unknown error'
				}`,
				{
					utility: middleware,
					originalError: expressError
				}
			);

		this.errorLogger.logError(expressMiddlewareError.message);
		this.errorHandler.expressErrorHandler()(
			expressMiddlewareError,
			req,
			res,
			next
		);
		res.status(500).json({ error: 'Internal Server Error' });
	}
}
