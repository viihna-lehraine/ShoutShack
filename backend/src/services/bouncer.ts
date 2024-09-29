import fs from 'fs';
import path from 'path';
import { Request, Response, NextFunction } from 'express';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import {
	BouncerServiceInterface,
	ConfigServiceInterface,
	SlowdownSessionInterface
} from '../index/interfaces';
import { ServiceFactory } from '../index/factory';

export class BouncerService implements BouncerServiceInterface {
	private static instance: BouncerService | null = null;
	private static configService: ConfigServiceInterface;

	private readonly RATE_LIMIT_BASE_POINTS = Number(
		BouncerService.configService.getEnvVariable('rateLimiterBasePoints')
	)!;
	private readonly RATE_LIMIT_BASE_DURATION = Number(
		BouncerService.configService.getEnvVariable('rateLimiterBaseDuration')
	)!;
	private readonly SYNC_INTERVAL =
		Number(
			BouncerService.configService.getEnvVariable('blacklistSyncInterval')
		) || 3600000;

	private logger = ServiceFactory.getLoggerService();
	private errorLogger = ServiceFactory.getErrorLoggerService();
	private errorHandler = ServiceFactory.getErrorHandlerService();
	private cacheService = ServiceFactory.getCacheService();
	private redisService = ServiceFactory.getRedisService();
	private resourceManager = ServiceFactory.getResourceManager();
	private rateLimiter: RateLimiterMemory;
	private blacklistKey = 'ipBlacklist';
	private rateLimitPrefix = 'rateLimit_';
	private blacklist: string[] = [];
	private whitelist: string[] = [];
	private globalRateLimitStats: Map<string, number> = new Map();

	private constructor() {
		this.rateLimiter = new RateLimiterMemory({
			points: this.RATE_LIMIT_BASE_POINTS,
			duration: this.RATE_LIMIT_BASE_DURATION
		});

		this.preInitIpBlacklist();
		this.resourceManager = ServiceFactory.getResourceManager();

		setInterval(
			() => this.syncBlacklistFromRedisToFile(),
			this.SYNC_INTERVAL
		);
	}

	public static getInstance(): BouncerService {
		if (!BouncerService.instance) {
			BouncerService.instance = new BouncerService();
		}
		return BouncerService.instance;
	}

	public async dynamicRateLimiter(): Promise<void> {
		const cpuUsage = this.calculateCpuUsage();
		const memoryUsage = this.resourceManager.getMemoryUsage()
			.heapUsedPercentage as number;

		const adjustedPoints = this.adjustRateLimitBasedOnResources(
			cpuUsage,
			memoryUsage
		);
		this.rateLimiter.points = adjustedPoints;
	}

	private updateGlobalRateLimitStats(
		ip: string,
		remainingPoints: number
	): void {
		this.globalRateLimitStats.set(ip, remainingPoints);
	}

	private resetGlobalRateLimitStats(): void {
		setInterval(() => this.globalRateLimitStats.clear(), 60000);
		this.logger.info('Global rate limit stats reset.');
	}

	private calculateCpuUsage(): number {
		const cpuUsages = this.resourceManager
			.getCpuUsage()
			.map(cpu => parseFloat(cpu.usage));
		return cpuUsages.reduce((a, b) => a + b, 0) / cpuUsages.length;
	}

	private adjustRateLimitBasedOnResources(
		cpu: number,
		memory: number
	): number {
		if (cpu > 80 || memory > 80) {
			this.logger.warn(
				`High resource usage detected. CPU: ${cpu}%, Memory: ${memory}%`
			);
			return Math.max(1, this.RATE_LIMIT_BASE_POINTS / 2);
		}
		return this.RATE_LIMIT_BASE_POINTS;
	}

	public rateLimitMiddleware() {
		return async (
			req: Request,
			res: Response,
			next: NextFunction
		): Promise<void> => {
			const ip = req.ip || 'unknown';
			const rateLimitKey = `${this.rateLimitPrefix}${ip}`;

			if (this.whitelist.includes(ip)) {
				return next();
			}

			try {
				let rateLimitInfo = await this.cacheService.get<number>(
					rateLimitKey,
					'bouncerService'
				);

				if (rateLimitInfo === null) {
					rateLimitInfo =
						await this.redisService.get<number>(rateLimitKey);
				}

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

				await this.cacheService.set(
					rateLimitKey,
					rateLimitInfo,
					'bouncerService',
					60
				);
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
		const basePoints = Number(
			BouncerService.configService.getEnvVariable('rateLimiterBasePoints')
		);
		const baseDuration = Number(
			BouncerService.configService.getEnvVariable(
				'rateLimiterBaseDuration'
			)
		);

		try {
			let currentPoints = await this.cacheService.get<number>(
				rateLimitKey,
				'bouncerService'
			);

			if (currentPoints === null) {
				currentPoints =
					(await this.redisService.get<number>(rateLimitKey)) ??
					basePoints;
			}

			if (currentPoints > 0) {
				currentPoints -= 1;
				await this.redisService.set(
					rateLimitKey,
					currentPoints,
					baseDuration
				);
				await this.cacheService.set(
					rateLimitKey,
					currentPoints,
					'bouncerService',
					60
				);
			} else {
				const backoffMultiplier =
					(await this.redisService.get<number>(`backoff_${ip}`)) || 1;
				const newDuration = baseDuration * backoffMultiplier;
				await this.redisService.set(
					rateLimitKey,
					basePoints,
					newDuration
				);
				await this.cacheService.set(
					rateLimitKey,
					basePoints,
					'bouncerService',
					60
				);
				await this.redisService.set(
					`backoff_${ip}`,
					backoffMultiplier + 1
				);
				this.logger.info(
					`Exponential backoff applied for IP ${ip}: ${newDuration} ms`
				);
			}

			this.updateGlobalRateLimitStats(ip, currentPoints);
		} catch (error) {
			this.logger.error(
				`Failed to increment rate limit for IP ${ip}: ${error}`
			);
		}
	}

	public slowdownMiddleware() {
		const slowdownThreshold = Number(
			BouncerService.configService.getEnvVariable('slowdownThreshold')
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

	public throttleRequests(): (
		req: Request,
		res: Response,
		next: NextFunction
	) => Promise<void | Response> {
		return async (req: Request, res: Response, next: NextFunction) => {
			try {
				const tooBusy = (await import('toobusy-js')).default;
				if (tooBusy()) {
					this.logger.warn(
						`Server too busy, blocking request from ${req.ip}`
					);
					return res
						.status(503)
						.json({ error: 'Server too busy, try again later.' });
				}
				return next();
			} catch (error) {
				this.handleDependencyError(
					'throttleRequests',
					error,
					req,
					res,
					next
				);
			}
		};
	}

	public ipBlacklistMiddleware(): (
		req: Request,
		res: Response,
		next: NextFunction
	) => Promise<void> {
		return async (
			req: Request,
			res: Response,
			next: NextFunction
		): Promise<void> => {
			const clientIp = req.ip;

			if (!clientIp) {
				return res.status(500).json({ error: 'Bad request' });
			}

			if (this.whitelist.includes(clientIp)) {
				return next();
			}

			try {
				if (await this.isTemporarilyBlacklisted(clientIp)) {
					this.logger.info(
						`Temporarily blocked request from IP: ${clientIp}`
					);
					return res
						.status(403)
						.json({ error: 'Access temporarily denied.' });
				}

				if (this.blacklist.includes(clientIp)) {
					this.logger.info(
						`Blocked request from blacklisted IP: ${clientIp}`
					);
					return res.status(403).json({ error: 'Access denied' });
				}

				next();
			} catch (error) {
				this.logger.error(`Error in IP blacklist middleware: ${error}`);
				res.status(500).json({ error: 'Internal server error' });
			}
		};
	}

	public async loadIpBlacklist(): Promise<void> {
		try {
			let cachedBlacklist = await this.cacheService.get<string[]>(
				this.blacklistKey,
				'bouncerService'
			);

			if (!cachedBlacklist) {
				this.logger.info(
					'IP blacklist not found in cache, retrieving from Redis...'
				);
				cachedBlacklist = await this.redisService.get<string[]>(
					this.blacklistKey
				);

				if (!cachedBlacklist) {
					this.logger.info(
						'IP blacklist not found in Redis, loading from file...'
					);
					await this.loadIpBlacklistFromFile();
				} else {
					await this.cacheService.set(
						this.blacklistKey,
						cachedBlacklist,
						'bouncerService',
						3600
					);
					this.blacklist = cachedBlacklist;
				}
			} else {
				this.blacklist = cachedBlacklist;
			}
		} catch (error) {
			this.logger.error(
				`Error loading IP blacklist: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
			await this.loadIpBlacklistFromFile();
		}
	}

	private async loadWhitelist(): Promise<void> {
		this.whitelist = BouncerService.configService
			.getEnvVariable('ipWhitelistPath')
			.split(',');
	}

	private async saveIpBlacklist(): Promise<void> {
		try {
			await this.redisService.set(this.blacklistKey, this.blacklist);
			await this.cacheService.set(
				this.blacklistKey,
				this.blacklist,
				'bouncerService',
				3600
			);
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

	public async temporaryBlacklist(ip: string): Promise<void> {
		const temporaryBlacklistKey = `temporaryBlacklist_${ip}`;
		await this.redisService.set(temporaryBlacklistKey, true, 3600);
		this.logger.info(`IP ${ip} temporarily blacklisted for 1 hour.`);
	}

	public async isTemporarilyBlacklisted(ip: string): Promise<boolean> {
		const temporaryBlacklistKey = `temporaryBlacklist_${ip}`;
		return !!(await this.redisService.get<boolean>(temporaryBlacklistKey));
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

	private async preInitIpWhitelist(): Promise<void> {
		try {
			let cachedWhitelist = await this.cacheService.get<string[]>(
				this.whitelistKey,
				'bouncerService'
			);

			if (!cachedWhitelist) {
				this.logger.info(
					'IP whitelist not found in cache, loading from configuration...'
				);
				this.whitelist = BouncerService.configService
					.getEnvVariable('ipWhitelistPath')
					.split(',');
				await this.cacheService.set(
					this.whitelistKey,
					this.whitelist,
					'bouncerService',
					3600
				);
			} else {
				this.whitelist = cachedWhitelist;
			}
		} catch (error) {
			this.logger.error(
				`Error initializing IP whitelist: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	public async syncBlacklistFromRedisToFile(): Promise<void> {
		try {
			const blacklist = await this.redisService.get<string[]>(
				this.blacklistKey
			);

			if (blacklist) {
				this.blacklist = blacklist;
				await this.cacheService.set(
					this.blacklistKey,
					this.blacklist,
					'bouncerService',
					3600
				);
				await this.saveIpBlacklistToFile();
				this.logger.info(
					'IP blacklist successfully synced from Redis to file and cache.'
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
			BouncerService.configService.getEnvVariable(envVariable)
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
