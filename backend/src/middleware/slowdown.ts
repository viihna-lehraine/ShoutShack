import { NextFunction, Request, Response } from 'express';
import { Session } from 'express-session';
import { errorClasses, ErrorSeverity } from '../errors/errorClasses';
import { ErrorLogger } from '../errors/errorLogger';
import { expressErrorHandler, processError } from '../errors/processError';
import { Logger } from '../utils/logger';
import { validateDependencies } from '../utils/validateDependencies';

export const slowdownThreshold = 100; // in ms

interface SlowdownConfig {
	slowdownThreshold: number;
	logger: Logger;
}

interface SlowdownSession extends Session {
	lastRequestTime?: number;
}

export function initializeSlowdownMiddleware({
	slowdownThreshold,
	logger
}: SlowdownConfig) {
	try {
		validateDependencies(
			[
				{ name: 'slowdownThreshold', instance: slowdownThreshold },
				{ name: 'logger', instance: logger }
			],
			logger || console
		);

		return function slowdownMiddleware(
			req: Request & { session: SlowdownSession },
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
				const errorResponse = 'Internal Server Error';
				const expressMiddlewareError = new errorClasses.ExpressError(
					`Fatal error occured when attempting to execute ${middleware}: ${
						expressError instanceof Error
							? expressError.message
							: 'Unknown error'
					} ; Shutting down...`,
					{
						middleware,
						severity: ErrorSeverity.FATAL,
						exposeToClient: false
					}
				);
				ErrorLogger.logError(expressMiddlewareError, logger);
				expressErrorHandler({ logger })(
					expressMiddlewareError,
					req,
					res,
					errorResponse
				);
				next();
			}
		};
	} catch (depError) {
		const dependency: string = 'initializeSlowdownMiddleware()';
		const dependencyError = new errorClasses.DependencyErrorRecoverable(
			`Fatal error occured when attempting to execute ${dependency}: ${depError instanceof Error ? depError.message : 'Unknown error'};`,
			{ exposeToClient: false }
		);
		processError(dependencyError, logger || console);
		throw dependencyError;
	}
}
