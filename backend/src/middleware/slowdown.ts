import { NextFunction, Request, RequestHandler, Response } from 'express';
import { validateDependencies } from '../utils/helpers';
import {
	AppLoggerInterface,
	SlowdownSessionInterface
} from '../index/interfaces';

export function initializeSlowdownMiddleware(
	slowdownThreshold: number,
	logger: AppLoggerInterface,
	errorLogger: AppLoggerInterface,
	errorHandler: typeof import('../services/errorHandler').errorHandler
): RequestHandler {
	try {
		validateDependencies(
			[{ name: 'slowdownThreshold', instance: slowdownThreshold }],
			logger
		);

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
