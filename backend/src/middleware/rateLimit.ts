import { NextFunction, Request, Response } from 'express';
import { RateLimiterMemory, RateLimiterRes } from 'rate-limiter-flexible';
import { AppError, errorClasses } from '../errors/errorClasses';
import { Logger } from '../utils/logger';
import { processError } from '../utils/processError';
import { validateDependencies } from '../utils/validateDependencies';

const { RateLimitError } = errorClasses;

export interface RateLimitMiddlewareDependencies {
	logger: Logger;
	points?: number;
	duration?: number;
}

export const initializeRateLimitMiddleware = ({
	logger,
	points = 10, // 10 requests
	duration = 1 // 1 second per IP
}: RateLimitMiddlewareDependencies) => {
	validateDependencies(
		[
			{ name: 'logger', instance: logger },
			{ name: 'points', instance: points },
			{ name: 'duration', instance: duration }
		],
		logger || console
	);

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

				next(
					new RateLimitError(
						'Too Many Requests',
						Math.ceil(err.msBeforeNext / 1000)
					)
				);
			} else {
				processError(err, logger || console, req);
				next(new AppError('Internal Server Error', 500));
			}
		}
	};
};
