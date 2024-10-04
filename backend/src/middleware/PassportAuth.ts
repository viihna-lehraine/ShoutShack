import { Request, RequestHandler, Response, NextFunction } from 'express';
import {
	AppLoggerServiceInterface,
	ErrorHandlerServiceInterface,
	ErrorLoggerServiceInterface,
	PassportAuthMiddlewareServiceInterface
} from '../index/interfaces/services';
import { PassportAuthMiddlewareServiceDeps } from '../index/interfaces/serviceDeps';
import { ServiceFactory } from '../index/factory';

export class PassportAuthMiddlewareService
	implements PassportAuthMiddlewareServiceInterface
{
	private static instance: PassportAuthMiddlewareService | null = null;
	private logger: AppLoggerServiceInterface;
	private errorLogger: ErrorLoggerServiceInterface;
	private errorHandler: ErrorHandlerServiceInterface;

	private constructor(
		logger: AppLoggerServiceInterface,
		errorLogger: ErrorLoggerServiceInterface,
		errorHandler: ErrorHandlerServiceInterface
	) {
		this.logger = logger;
		this.errorLogger = errorLogger;
		this.errorHandler = errorHandler;
	}

	public static async getInstance(): Promise<PassportAuthMiddlewareService> {
		if (!PassportAuthMiddlewareService.instance) {
			const logger = await ServiceFactory.getLoggerService();
			const errorLogger = await ServiceFactory.getErrorLoggerService();
			const errorHandler = await ServiceFactory.getErrorHandlerService();

			PassportAuthMiddlewareService.instance =
				new PassportAuthMiddlewareService(
					logger,
					errorLogger,
					errorHandler
				);
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

	public async shutdown(): Promise<void> {
		try {
			this.logger.info('Shutting down Passport middleware service...');
			PassportAuthMiddlewareService.instance = null;
			this.logger.info('Passport middleware service has been shut down.');
		} catch (error) {
			this.errorLogger.logError(
				`Error shutting down Passport middleware service: ${
					error instanceof Error ? error.message : error
				}`
			);
		}
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
