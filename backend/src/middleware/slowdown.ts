import { NextFunction, Request, Response } from 'express';
import { Session } from 'express-session';
import { Logger } from '../config/logger';
import '../../types/custom/express-session';

interface SlowdownConfig {
	slowdownThreshold: number;
	logger: Logger;
}

interface SlowdownSession extends Session {
	lastRequestTime?: number;
}

export function createSlowdownMiddleware({
	slowdownThreshold = 100, // default threshold in ms, can be customized
	logger
}: SlowdownConfig) {
	return function slowdownMiddleware(
		req: Request & { session: SlowdownSession },
		res: Response,
		next: NextFunction
	): void {
		const requestTime = Date.now();

		// if session handling fails or doesn't exist, proceed without slowdown
		if (!req.session) {
			logger.warn('Session is undefined; proceeding without slowdown');
			next();
			return;
		}

		// Log when there is no previous request time, indicating first request
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
			if (err instanceof Error) {
				logger.error(`Error occurred: ${err.message}`, {
					stack: err.stack
				});
			} else {
				logger.error(`Unknown error occurred: ${String(err)}`);
			}
		}
	};
}

export default createSlowdownMiddleware;
