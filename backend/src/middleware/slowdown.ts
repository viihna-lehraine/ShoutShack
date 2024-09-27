import { NextFunction, Request, RequestHandler, Response } from 'express';
import { SlowdownSessionInterface } from '../index/interfaces';
import { ServiceFactory } from '../index/factory';

export function initializeSlowdownMiddleware(): RequestHandler {
	const logger = ServiceFactory.getLoggerService();
	const errorLogger = ServiceFactory.getErrorLoggerService();
	const errorHandler = ServiceFactory.getErrorHandlerService();
	const slowdownThreshold =
		ServiceFactory.getConfigService().getEnvVariable('slowdownThreshold');

	try {
		if (typeof slowdownThreshold !== 'number') {
			const configError =
				new errorHandler.ErrorClasses.ConfigurationError(
					`Invalid slowdown threshold configuration: ${slowdownThreshold}`,
					{
						configuration: 'slowdownThreshold',
						originalError: 'Invalid configuration value'
					}
				);
			errorLogger.logError(configError.message);
			errorHandler.handleError({ error: configError });
			throw configError;
		}

		return function slowdownMiddleware(
			req: Request & { session: SlowdownSessionInterface },
			res: Response,
			next: NextFunction
		): void {
			const requestTime = Date.now();

			if (!req.session) {
				logger.warn(
					'Session is undefined; proceeding without slowdown'
				);
				next();
				return;
			}

			try {
				if (!req.session.lastRequestTime) {
					logger.info(
						`First request from IP: ${req.ip}, proceeding without delay`
					);
					req.session.lastRequestTime = requestTime;
					next();
				} else {
					const timeDiff = requestTime - req.session.lastRequestTime;

					if (timeDiff < slowdownThreshold) {
						const waitTime = slowdownThreshold - timeDiff;
						logger.warn(
							`Rapid request detected from IP: ${req.ip}. Delaying response by ${waitTime} ms`
						);
						setTimeout(() => {
							req.session.lastRequestTime = requestTime;
							logger.info(
								`Resuming delayed request from IP: ${req.ip}`
							);
							next();
						}, waitTime);
					} else {
						logger.info(
							`Request from IP: ${req.ip} within acceptable time frame. Proceeding`
						);
						req.session.lastRequestTime = requestTime;
						next();
					}
				}
			} catch (expressError) {
				const middleware = 'slowdownMiddleware()';
				const expressMiddlewareError =
					new errorHandler.ErrorClasses.ExpressError(
						`Fatal error occured when attempting to execute ${middleware}: ${
							expressError instanceof Error
								? expressError.message
								: 'Unknown error'
						} ; Shutting down...`,
						{
							middleware,
							exposeToClient: false
						}
					);
				errorLogger.logError(expressMiddlewareError.message);
				errorHandler.expressErrorHandler()(
					expressMiddlewareError,
					req,
					res,
					next
				);
				next();
			}
		};
	} catch (depError) {
		const dependency: string = 'initializeSlowdownMiddleware()';
		const dependencyError =
			new errorHandler.ErrorClasses.DependencyErrorRecoverable(
				`Fatal error occured when attempting to execute ${dependency}: ${depError instanceof Error ? depError.message : 'Unknown error'};`,
				{ exposeToClient: false }
			);
		errorHandler.handleError({ error: dependencyError });
		throw dependencyError;
	}
}
