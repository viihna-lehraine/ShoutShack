import { NextFunction, Request, Response } from 'express';
import { Session } from 'express-session';
import { ConfigService } from '../services/configService';
import { errorClasses, ErrorSeverity } from '../errors/errorClasses';
import { ErrorLogger } from '../services/errorLogger';
import { expressErrorHandler, processError } from '../errors/processError';
import { validateDependencies } from '../utils/helpers';

export const slowdownThreshold = 100; // in ms

interface SlowdownConfig {
	slowdownThreshold: number;
}

interface SlowdownSession extends Session {
	lastRequestTime?: number;
}

export function initializeSlowdownMiddleware({
	slowdownThreshold
}: SlowdownConfig) {
	const appLogger = ConfigService.getInstance().getLogger();

	try {
		validateDependencies(
			[{ name: 'slowdownThreshold', instance: slowdownThreshold }],
			appLogger || console
		);

		return function slowdownMiddleware(
			req: Request & { session: SlowdownSession },
			res: Response,
			next: NextFunction
		): void {
			const requestTime = Date.now();

			if (!req.session) {
				appLogger.warn(
					'Session is undefined; proceeding without slowdown'
				);
				next();
				return;
			}

			try {
				if (!req.session.lastRequestTime) {
					appLogger.info(
						`First request from IP: ${req.ip}, proceeding without delay`
					);
					req.session.lastRequestTime = requestTime;
					next();
				} else {
					const timeDiff = requestTime - req.session.lastRequestTime;

					if (timeDiff < slowdownThreshold) {
						const waitTime = slowdownThreshold - timeDiff;
						appLogger.warn(
							`Rapid request detected from IP: ${req.ip}. Delaying response by ${waitTime} ms`
						);
						setTimeout(() => {
							req.session.lastRequestTime = requestTime;
							appLogger.info(
								`Resuming delayed request from IP: ${req.ip}`
							);
							next();
						}, waitTime);
					} else {
						appLogger.info(
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
				ErrorLogger.logError(expressMiddlewareError);
				expressErrorHandler()(
					expressMiddlewareError,
					req,
					res,
					next,
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
		processError(dependencyError);
		throw dependencyError;
	}
}
