import fs from 'fs';
import path from 'path';
import { Request, Response, NextFunction } from 'express';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import {
	BouncerServiceInterface,
	SlowdownSessionInterface
} from '../index/interfaces';
import { ServiceFactory } from '../index/factory';

export class BouncerService implements BouncerServiceInterface {
	private static instance: BouncerService | null = null;
	private logger = ServiceFactory.getLoggerService();
	private errorLogger = ServiceFactory.getErrorLoggerService();
	private errorHandler = ServiceFactory.getErrorHandlerService();
	private configService = ServiceFactory.getConfigService();
	private redisService = ServiceFactory.getRedisService();
	private rateLimiter: RateLimiterMemory;
	private blacklistKey = 'ipBlacklist';
	private rateLimitPrefix = 'rateLimit_';
	private blacklist: string[] = [];

	private constructor() {
		const points = this.configService.getEnvVariable(
			'rateLimiterBasePoints'
		)!;
		const duration = this.configService.getEnvVariable(
			'rateLimiterBaseDuration'
		)!;

		this.rateLimiter = new RateLimiterMemory({ points, duration });

		this.preInitIpBlacklist();

		const syncInterval =
			Number(
				this.configService.getEnvVariable('blacklistSyncInterval')
			) || 3600000;
		setInterval(() => this.syncBlacklistFromRedisToFile(), syncInterval);
	}

	public static getInstance(): BouncerService {
		if (!BouncerService.instance) {
			BouncerService.instance = new BouncerService();
		}

		return BouncerService.instance;
	}

	public rateLimitMiddleware() {
		return async (
			req: Request,
			res: Response,
			next: NextFunction
		): Promise<void> => {
			const ip = req.ip || 'unknown';
			const rateLimitKey = `${this.rateLimitPrefix}${ip}`;

			try {
				let rateLimitInfo =
					await this.redisService.get<number>(rateLimitKey);

				if (rateLimitInfo === null) {
					const rateLimitRes = await this.rateLimiter.consume(ip);
					rateLimitInfo = rateLimitRes.remainingPoints;
				}

				if (rateLimitInfo <= 2) {
					return this.triggerRateLimitWarning(
						ip,
						rateLimitInfo,
						next
					);
				}

				await this.incrementRateLimit(ip);
				next();
			} catch (error) {
				this.handleDependencyError(
					'rateLimitMiddleware',
					error,
					req,
					res,
					next
				);
			}
		};
	}

	private triggerRateLimitWarning(
		ip: string,
		points: number,
		next: NextFunction
	): void {
		this.logger.info(
			`Rate limit warning for IP ${ip}. Remaining points: ${points}`
		);
		next(new this.errorHandler.ErrorClasses.RateLimitErrorWarning(points));
	}

	private async incrementRateLimit(ip: string): Promise<void> {
		const rateLimitKey = `${this.rateLimitPrefix}${ip}`;
		const recoverableLimitKey = `recoverable_${ip}`; // Redis key for recoverable counts
		const points = Number(
			this.configService.getEnvVariable('rateLimiterBasePoints')
		);
		const duration = Number(
			this.configService.getEnvVariable('rateLimiterBaseDuration')
		);

		try {
			const currentPoints =
				(await this.redisService.get<number>(rateLimitKey)) ?? points;

			if (currentPoints > 0) {
				await this.redisService.set(
					rateLimitKey,
					currentPoints - 1,
					duration
				);
			} else {
				let recoverableCount =
					(await this.redisService.get<number>(
						recoverableLimitKey
					)) ?? 0;

				if (recoverableCount < 3) {
					recoverableCount++;
					await this.redisService.set(
						recoverableLimitKey,
						recoverableCount,
						duration
					);
					this.logger.info(
						`IP ${ip} is recoverable and has exceeded the rate limit ${recoverableCount} time(s).`
					);

					await this.redisService.set(rateLimitKey, points, duration);
				} else {
					this.errorLogger.logError(
						`Rate limit exceeded multiple times for IP ${ip}. Blacklisting IP.`
					);
					await this.addIpToBlacklist(ip);
				}
			}
		} catch (error) {
			this.logger.error(
				`Failed to increment rate limit for IP ${ip}: ${error}`
			);
		}
	}

	public slowdownMiddleware() {
		const slowdownThreshold = Number(
			this.configService.getEnvVariable('slowdownThreshold')
		);
		return (
			req: Request & { session: SlowdownSessionInterface },
			res: Response,
			next: NextFunction
		): void => {
			const requestTime = Date.now();
			this.handleSlowdown(req, res, next, requestTime, slowdownThreshold);
		};
	}

	private handleSlowdown(
		req: Request & { session: SlowdownSessionInterface },
		res: Response,
		next: NextFunction,
		requestTime: number,
		slowdownThreshold: number
	): void {
		if (!req.session) return next();

		const timeDiff = requestTime - (req.session.lastRequestTime || 0);
		req.session.lastRequestTime = requestTime;

		if (timeDiff < slowdownThreshold) {
			const waitTime = slowdownThreshold - timeDiff;
			this.logger.warn(
				`Rapid request detected from IP: ${req.ip}. Delaying response by ${waitTime} ms`
			);
			setTimeout(() => next(), waitTime);
		} else {
			next();
		}
	}

	public ipBlacklistMiddleware() {
		return async (
			req: Request,
			res: Response,
			next: NextFunction
		): Promise<void> => {
			const clientIp = req.ip;
			if (!clientIp) {
				res.status(500).json({ error: 'Bad request' });
				return;
			}

			const isBlacklisted = await this.redisService.get<boolean>(
				`${this.blacklistKey}_${clientIp}`
			);
			if (isBlacklisted) {
				this.logger.info(
					`Blocked request from blacklisted IP: ${clientIp}`
				);
				res.status(403).json({ error: 'Access denied' });
				return;
			} else {
				next();
			}
		};
	}

	private async loadIpBlacklist(): Promise<void> {
		try {
			this.blacklist =
				(await this.redisService.get<string[]>(this.blacklistKey)) ||
				[];
			if (!this.blacklist.length) await this.loadIpBlacklistFromFile();
		} catch (error) {
			this.logger.error(
				`Error loading IP blacklist from Redis: ${error}`
			);
			await this.loadIpBlacklistFromFile();
		}
	}

	private async saveIpBlacklist(): Promise<void> {
		try {
			await this.redisService.set(this.blacklistKey, this.blacklist);
		} catch (error) {
			this.logger.error(`Error saving IP blacklist to Redis: ${error}`);
		}
		await this.saveIpBlacklistToFile();
	}

	private async loadIpBlacklistFromFile(): Promise<void> {
		const filePath = this.getFilePath('serverDataFilePath1');
		await this.concurrentFileAccessSafety(async () => {
			try {
				if (fs.existsSync(filePath)) {
					this.blacklist = JSON.parse(
						fs.readFileSync(filePath, 'utf8')
					);
				}
			} catch (error) {
				this.logger.error(
					`Error loading IP blacklist from file: ${error}`
				);
			}
		});
	}

	private async saveIpBlacklistToFile(): Promise<void> {
		const filePath = this.getFilePath('serverDataFilePath2');
		await this.concurrentFileAccessSafety(async () => {
			try {
				fs.writeFileSync(filePath, JSON.stringify(this.blacklist));
			} catch (error) {
				this.logger.error(
					`Error saving IP blacklist to file: ${error}`
				);
			}
		});
	}

	public async addIpToBlacklist(ip: string): Promise<void> {
		if (!this.blacklist.includes(ip)) {
			this.blacklist.push(ip);
			await this.saveIpBlacklist();
			this.logger.info(`IP ${ip} added to blacklist.`);
		}
	}

	public async removeIpFromBlacklist(ip: string): Promise<void> {
		this.blacklist = this.blacklist.filter(
			blacklistedIp => blacklistedIp !== ip
		);
		await this.saveIpBlacklist();
		this.logger.info(`IP ${ip} removed from blacklist.`);
	}

	public async preInitIpBlacklist(): Promise<void> {
		try {
			const blacklistInRedis = await this.redisService.get<string[]>(
				this.blacklistKey
			);
			if (!blacklistInRedis) {
				this.logger.info(
					'IP blacklist not found in Redis, loading from file...'
				);
				await this.loadIpBlacklist();
				await this.saveIpBlacklist();
				this.logger.info(
					'IP blacklist loaded from file and saved to Redis.'
				);
			} else {
				this.blacklist = blacklistInRedis;
				this.logger.info('IP blacklist initialized from Redis.');
			}
		} catch (error) {
			this.errorLogger.logWarn(
				`Failed to load IP blacklist from Redis or file.\n${String(error)}`
			);
			await this.loadIpBlacklist();
		}
	}

	private async syncBlacklistFromRedisToFile(): Promise<void> {
		try {
			const blacklist = await this.redisService.get<string[]>(
				this.blacklistKey
			);

			if (blacklist) {
				this.blacklist = blacklist;
				await this.saveIpBlacklistToFile();
				this.logger.info(
					'IP blacklist successfully synced from Redis to file.'
				);
			} else {
				this.logger.warn('No IP blacklist found in Redis during sync.');
			}
		} catch (error) {
			this.logger.error(
				`Error syncing IP blacklist from Redis to file: ${error}`
			);
		}
	}

	private handleDependencyError(
		middleware: string,
		error: unknown,
		req: Request,
		res: Response,
		next: NextFunction
	): void {
		const expressMiddlewareError =
			new this.errorHandler.ErrorClasses.DependencyErrorFatal(
				`Fatal error occurred while executing '${middleware}': ${error instanceof Error ? error.message : 'Unknown error'}`,
				{ dependency: middleware }
			);
		this.errorLogger.logError(expressMiddlewareError.message);
		this.errorHandler.expressErrorHandler()(
			expressMiddlewareError,
			req,
			res,
			next
		);
	}

	private getFilePath(
		envVariable:
			| 'serverDataFilePath1'
			| 'serverDataFilePath2'
			| 'serverDataFilePath3'
			| 'serverDataFilePath4'
	): string {
		return path.resolve(
			__dirname,
			this.configService.getEnvVariable(envVariable)
		);
	}

	private async concurrentFileAccessSafety(
		fileOperation: () => Promise<void>
	): Promise<void> {
		try {
			await fileOperation();
		} catch (error) {
			this.logger.error('Error during concurrent file access.');
			throw error;
		}
	}
}
