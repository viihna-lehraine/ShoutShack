import { NextFunction, Request, Response } from "express";
import { RateLimiterMemory } from 'rate-limiter-flexible';

const rateLimiter = new RateLimiterMemory({
	points: 100, // 100 requests
	duration: 60, // per 60 seconds, by IP
	keyPrefix: 'rateLimiter', // useful for distinguishing rate limiters in logs or in distributed setups
  });

export const rateLimitMiddleware = (req: Request, res: Response, next: NextFunction) => {
	const ip = req.ip || 'unknown'; // provides fallback if req.ip is undefined

	rateLimiter.consume(ip)
		.then(() => {
		next();
		})
		.catch(() => {
			res.status(429).send('Too many requests');
		});
};
