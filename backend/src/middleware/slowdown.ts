import { NextFunction, Request, Response } from 'express';
import { Session } from 'express-session';
import { Logger } from '../config/logger';
import { validateDependencies } from '../utils/validateDependencies';
import { processError } from '../utils/processError';

interface SlowdownConfig {
	slowdownThreshold: number;
	logger: Logger;
}

interface SlowdownSession extends Session {
	lastRequestTime?: number;
}

export function initializeSlowdownMiddleware({
	slowdownThreshold = 100, // in ms
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
			} catch (err) {
				processError(err, logger || console, req);
				next(err);
			}
		};
	} catch (error) {
		processError(error, logger || console);
		throw error;
	}
}
