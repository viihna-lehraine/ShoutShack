import { NextFunction, Request, Response } from 'express';
import { RateLimiterMemory, RateLimiterRes } from 'rate-limiter-flexible';
import { ConfigService } from 'src/config/configService';
import { errorClasses, ErrorSeverity } from '../errors/errorClasses';
import { expressErrorHandler } from '../errors/processError';
import { ensureSecrets } from '../utils/ensureSecrets';

const MAX_RECOVERABLE_LIMITS: number = 5;
const recoverableLimitCounts = new Map<string, number>();

const {
	RateLimitErrorFatal,
	RateLimitErrorRecoverable,
	RateLimitErrorWarning
} = errorClasses;

export const initializeRateLimitMiddleware = () => {
	const appLogger = ConfigService.getInstance().getLogger();
	const secrets = ensureSecrets({
		subSecrets: ['rateLimiterBasePoints', 'rateLimiterBaseDuration']
	});
	const points = secrets.rateLimiterBasePoints;
	const duration = secrets.rateLimiterBaseDuration;
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
				appLogger.info(
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
					appLogger.error(`Fatal rate limit exceeded for IP ${ip}`);
					recoverableLimitCounts.delete(ip);
					next(
						new RateLimitErrorFatal(
							Math.ceil(error.msBeforeNext / 1000)
						)
					);
				} else {
					recoverableLimitCounts.set(ip, currentCount + 1);
					appLogger.warn(
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
				const expressMiddlewareError =
					new errorClasses.DependencyErrorFatal(
						`Fatal error occurred when executing 'initializeRateLimitMiddleware()': Unable to initialize ${middleware}:\n${error instanceof Error ? error.message : 'Unknown error'}`,
						{
							dependency: middleware,
							originalError: error,
							statusCode: 500,
							severity: ErrorSeverity.FATAL,
							exposeToClient: false
						}
					);

				expressErrorHandler()(expressMiddlewareError, req, res);
			}
		}
	};
};
