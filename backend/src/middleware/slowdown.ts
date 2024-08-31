import { NextFunction, Request, Response } from 'express';
import '../../types/custom/express-session';

interface SlowdownConfig {
	slowdownThreshold: number;
}

export function createSlowdownMiddleware({
	slowdownThreshold = 100 // default threshold in ms, can be customized
}: SlowdownConfig) {
	return function slowdownMiddleware(
		req: Request,
		res: Response,
		next: NextFunction
	): void {
		const requestTime = Date.now();

		// check if request time has already been stored for this IP
		if (!req.session.lastRequestTime) {
			req.session.lastRequestTime = requestTime;
			next();
		} else {
			const timeDiff = requestTime - req.session.lastRequestTime;

			if (timeDiff < slowdownThreshold) {
				const waitTime = slowdownThreshold - timeDiff;
				setTimeout(() => {
					req.session.lastRequestTime = requestTime;
					next();
				}, waitTime);
			} else {
				req.session.lastRequestTime = requestTime;
				next();
			}
		}
	};
}

export default createSlowdownMiddleware;
