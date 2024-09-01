import { NextFunction, Request, Response } from 'express';
import { RateLimiterMemory } from 'rate-limiter-flexible';

const rateLimiter = new RateLimiterMemory({
	points: 10, // 10 requests
	duration: 1 // per 1 second by IP
});

export const rateLimitMiddleware = (
	req: Request,
	res: Response,
	next: NextFunction
): void => {
	const ip = req.ip || 'unknown'; // provides fallback if req.ip is undefined

	rateLimiter
		.consume(ip)
		.then(() => {
			next();
		})
		.catch(() => {
			res.status(429).send('Too Many Requests');
		});
};

export default rateLimitMiddleware;
