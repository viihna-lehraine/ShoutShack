import { NextFunction, Request, Response } from 'express';
import { RateLimiterAbstract } from 'rate-limiter-flexible';

interface RateLimitDependencies {
	rateLimiter: RateLimiterAbstract;
}

export const rateLimitMiddleware = ({ rateLimiter }: RateLimitDependencies) => {
	return (req: Request, res: Response, next: NextFunction): void => {
		const ip = req.ip || 'unknown'; // provides fallback if req.ip is undefined

		rateLimiter
			.consume(ip)
			.then(() => {
				next();
			})
			.catch(() => {
				res.status(429).send('Too many requests');
			});
	};
};
