import { NextFunction, Request, Response } from 'express';
import { RateLimiterMemory, RateLimiterRes } from 'rate-limiter-flexible';
import { Logger } from '../config/logger';
import AppError from '../errors/AppError';

export interface RateLimitMiddlewareDependencies {
	logger: Logger;
	points?: number;
	duration?: number;
}

export const createRateLimitMiddleware = ({
	logger,
	points = 10, // default to 10 requests
	duration = 1 // default to 1 second per IP
}: RateLimitMiddlewareDependencies) => {
	const rateLimiter = new RateLimiterMemory({
		points,
		duration
	});

	return async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<void> => {
		const ip = req.ip || 'unknown'; // fallback if req.ip is undefined

		try {
			await rateLimiter.consume(ip);
			next();
		} catch (err: unknown) {
			if (err instanceof RateLimiterRes) {
				logger.warn(
					`Rate limit exceeded for IP: ${ip} - Remaining points: ${err.remainingPoints}`
				);

				// passes an AppError to the error-handling middleware with retryAfter details
				next(
					new AppError(
						'Too Many Requests',
						429,
						'ERR_TOO_MANY_REQUESTS',
						{
							retryAfter: Math.ceil(err.msBeforeNext / 1000)
						}
					)
				);
			} else {
				logger.error(`Unexpected error during rate limiting:`, {
					error: err
				});
				next(new AppError('Internal Server Error', 500));
			}
		}
	};
};

export default createRateLimitMiddleware;
