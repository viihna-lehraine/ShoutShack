import { NextFunction, Request, Response } from 'express';
import { RateLimiterMemory, RateLimiterRes } from 'rate-limiter-flexible';
import { ServiceFactory } from '../index/factory';

const MAX_RECOVERABLE_LIMITS: number = 5;
const recoverableLimitCounts = new Map<string, number>();

export const initializeRateLimitMiddleware = () => {
	const logger = ServiceFactory.getLoggerService();
	const errorLogger = ServiceFactory.getErrorLoggerService();
	const errorHandler = ServiceFactory.getErrorHandlerService();
	const configService = ServiceFactory.getConfigService();
	const points = configService.getEnvVariable('rateLimiterBasePoints');
	const duration = configService.getEnvVariable('rateLimiterBaseDuration');

	if (typeof points !== 'number' || typeof duration !== 'number') {
		const errorMessage = `Invalid rate limiter configuration: points: ${points}, duration: ${duration}`;
		const configError = new errorHandler.ErrorClasses.ConfigurationError(
			errorMessage,
			{
				configuration: 'rateLimiterBasePoints, rateLimiterBaseDuration',
				originalError: errorMessage
			}
		);
		errorLogger.logError(configError.message);
		errorHandler.handleError({ error: configError });
		throw configError;
	}

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
					new errorHandler.ErrorClasses.RateLimitErrorWarning(
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
						new errorHandler.ErrorClasses.RateLimitErrorFatal(
							Math.ceil(error.msBeforeNext / 1000)
						)
					);
				} else {
					recoverableLimitCounts.set(ip, currentCount + 1);
					logger.warn(
						`Rate limit exceeded for IP ${ip}. Remaining points: ${error.remainingPoints}`
					);
					next(
						new errorHandler.ErrorClasses.RateLimitErrorRecoverable(
							Math.ceil(error.msBeforeNext / 1000)
						)
					);
				}
			} else {
				const middleware = 'initializeRateLimitMiddleware()';
				const expressMiddlewareError =
					new errorHandler.ErrorClasses.DependencyErrorFatal(
						`Fatal error occurred when executing 'initializeRateLimitMiddleware()': Unable to initialize ${middleware}:\n${error instanceof Error ? error.message : 'Unknown error'}`,
						{
							dependency: middleware,
							originalError: error
						}
					);

				errorHandler.expressErrorHandler()(
					expressMiddlewareError,
					req,
					res,
					next
				);
			}
		}
	};
};
