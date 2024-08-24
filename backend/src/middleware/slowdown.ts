import { NextFunction, Request, Response } from 'express';
import '../../types/custom/express-session';

function slowdownMiddleware(
	req: Request,
	res: Response,
	next: NextFunction
): void {
	const requestTime = new Date().getTime();

	// Check if we already stored a request time for this IP
	if (!req.session.lastRequestTime) {
		req.session.lastRequestTime = requestTime;
		next();
	} else {
		const timeDiff = requestTime - req.session.lastRequestTime;
		const slowdownThreshold = 100; // *DEV-NOTE* Adjust this value as needed (in ms)

		if (timeDiff < slowdownThreshold) {
			const waitTime = slowdownThreshold - timeDiff;
			setTimeout(next, waitTime);
		} else {
			req.session.lastRequestTime = requestTime;
			next();
		}
	}
}

export default slowdownMiddleware;
