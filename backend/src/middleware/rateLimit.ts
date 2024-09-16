import { NextFunction, Request, Response } from 'express';
import { RateLimiterMemory, RateLimiterRes } from 'rate-limiter-flexible';
import { AppError, errorClasses, ErrorSeverity } from '../errors/errorClasses';
import { expressErrorHandler } from '../errors/processError';
import { Logger } from '../utils/logger';
import { validateDependencies } from '../utils/validateDependencies';

const MAX_RECOVERABLE_LIMITS: number = 5;
const recoverableLimitCounts = new Map<string, number>();

const {
	RateLimitErrorFatal,
	RateLimitErrorRecoverable,
	RateLimitErrorWarning
} = errorClasses;

export interface RateLimitMiddlewareDependencies {
	logger: Logger;
	points?: number;
	duration?: number;
}

export const initializeRateLimitMiddleware = ({
	logger,
	points = 10, // # of requests
	duration = 1 // seconds/IP
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
		const ip = req.ip || 'unknown';

		try {
			const rateLimitInfo = await rateLimiter.get(ip);
			if (
				rateLimitInfo &&
				rateLimitInfo.remainingPoints !== undefined &&
				rateLimitInfo.remainingPoints <= 2 &&
				rateLimitInfo.remainingPoints > 0
			) {
				logger.info(
					`Rate limit warning for IP ${ip}. Remaining points: ${rateLimitInfo.remainingPoints}`
				);
				next(
					new RateLimitErrorWarning(
						Math.ceil(rateLimitInfo.msBeforeNext / 1000)
					)
				);
				return;
			}

			await rateLimiter.consume(ip);
			next();
		} catch (error: unknown) {
			if (error instanceof RateLimiterRes) {
				const currentCount = recoverableLimitCounts.get(ip) || 0;

				if (currentCount >= MAX_RECOVERABLE_LIMITS) {
					logger.error(`Fatal rate limit exceeded for IP ${ip}`);
					recoverableLimitCounts.delete(ip);
					next(
						new RateLimitErrorFatal(
							Math.ceil(error.msBeforeNext / 1000)
						)
					);
				} else {
					recoverableLimitCounts.set(ip, currentCount + 1);
					logger.warn(
						`Rate limit exceeded for IP ${ip}. Remaining points: ${error.remainingPoints}`
					);
					next(
						new RateLimitErrorRecoverable(
							Math.ceil(error.msBeforeNext / 1000)
						)
					);
				}
			} else {
				const middleware = 'initializeRateLimitMiddleware()';
				const expressMiddlewareError = new AppError(
					`Fatal error occurred in ${middleware}: ${error instanceof Error ? error.message : 'Unknown error'}`,
					500,
					ErrorSeverity.FATAL,
					'RATE_LIMIT_INTERNAL_ERROR'
				);

				expressErrorHandler({ logger })(
					expressMiddlewareError,
					req,
					res
				);
			}
		}
	};
};
