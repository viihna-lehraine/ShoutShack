import { Request, Response, NextFunction } from 'express';
import { Session } from 'express-session';
import fs from 'fs';
import path from 'path';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { ServiceFactory } from '../index/factory';
import {
	AppLoggerServiceInterface,
	CacheServiceInterface,
	EnvConfigServiceInterface,
	ErrorLoggerServiceInterface,
	ErrorHandlerServiceInterface,
	GatekeeperServiceInterface,
	RedisServiceInterface,
	ResourceManagerInterface
} from '../index/interfaces/services';

export class GatekeeperService implements GatekeeperServiceInterface {
	private static instance: GatekeeperService | null = null;

	private logger: AppLoggerServiceInterface;
	private errorLogger: ErrorLoggerServiceInterface;
	private errorHandler: ErrorHandlerServiceInterface;
	private envConfig: EnvConfigServiceInterface;
	private cacheService: CacheServiceInterface;
	private redisService: RedisServiceInterface;
	private resourceManager: ResourceManagerInterface;

	private RATE_LIMIT_BASE_POINTS: number;
	private RATE_LIMIT_BASE_DURATION: number;
	private SYNC_INTERVAL: number;
	private rateLimiter: RateLimiterMemory | null;
	private blacklistKey = 'ipBlacklist';
	private whitelistKey = 'ipWhitelist';
	private rateLimitPrefix = 'rateLimit_';
	private blacklist: string[] = [];
	private whitelist: string[] = [];
	private globalRateLimitStats: Map<string, number> = new Map();

	private constructor(
		logger: AppLoggerServiceInterface,
		errorLogger: ErrorLoggerServiceInterface,
		errorHandler: ErrorHandlerServiceInterface,
		envConfig: EnvConfigServiceInterface,
		cacheService: CacheServiceInterface,
		redisService: RedisServiceInterface,
		resourceManager: ResourceManagerInterface
	) {
		this.logger = logger;
		this.errorLogger = errorLogger;
		this.errorHandler = errorHandler;
		this.envConfig = envConfig;
		this.cacheService = cacheService;
		this.redisService = redisService;
		this.resourceManager = resourceManager;

		this.RATE_LIMIT_BASE_POINTS = Number(
			this.envConfig.getEnvVariable('rateLimiterBasePoints')
		);
		this.RATE_LIMIT_BASE_DURATION = Number(
			this.envConfig.getEnvVariable('rateLimiterBaseDuration')
		);
		this.SYNC_INTERVAL =
			Number(this.envConfig.getEnvVariable('blacklistSyncInterval')) ||
			3600000;

		this.rateLimiter = new RateLimiterMemory({
			points: this.RATE_LIMIT_BASE_POINTS,
			duration: this.RATE_LIMIT_BASE_DURATION
		});
		this.preInitIpBlacklist();
		this.preInitIpWhitelist();

		setInterval(
			() => this.syncBlacklistFromRedisToFile(),
			this.SYNC_INTERVAL
		);
	}

	public static async getInstance(): Promise<GatekeeperService> {
		if (!GatekeeperService.instance) {
			const logger = await ServiceFactory.getLoggerService();
			const errorLogger = await ServiceFactory.getErrorLoggerService();
			const errorHandler = await ServiceFactory.getErrorHandlerService();
			const envConfig = await ServiceFactory.getEnvConfigService();
			const cacheService = await ServiceFactory.getCacheService();
			const redisService = await ServiceFactory.getRedisService();
			const resourceManager = await ServiceFactory.getResourceManager();

			GatekeeperService.instance = new GatekeeperService(
				logger,
				errorLogger,
				errorHandler,
				envConfig,
				cacheService,
				redisService,
				resourceManager
			);
		}

		return GatekeeperService.instance;
	}

	public async initialize(): Promise<void> {
		await Promise.all([this.loadIpBlacklist(), this.loadWhitelist()]);
		this.resetGlobalRateLimitStats();
		await this.syncBlacklistFromRedisToFile();
	}

	public async dynamicRateLimiter(): Promise<void> {
		if (!this.rateLimiter) {
			this.rateLimiter = new RateLimiterMemory({
				points: this.RATE_LIMIT_BASE_POINTS,
				duration: this.RATE_LIMIT_BASE_DURATION
			});
		}

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

			if (!this.rateLimiter) {
				this.rateLimiter = new RateLimiterMemory({
					points: this.RATE_LIMIT_BASE_POINTS,
					duration: this.RATE_LIMIT_BASE_DURATION
				});
			}

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
			this.envConfig.getEnvVariable('rateLimiterBasePoints')
		);
		const baseDuration = Number(
			this.envConfig.getEnvVariable('rateLimiterBaseDuration')
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
			this.envConfig.getEnvVariable('slowdownThreshold')
		);
		return (
			req: Request & { session: Session & { lastRequestTime?: number } },
			res: Response,
			next: NextFunction
		): void => {
			const requestTime = Date.now();
			this.handleSlowdown(req, res, next, requestTime, slowdownThreshold);
		};
	}

	private handleSlowdown(
		req: Request & { session: Session & { lastRequestTime?: number } },
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
				res.status(500).json({ error: 'Bad request' });
				return;
			}

			if (this.whitelist.includes(clientIp)) {
				return next();
			}

			try {
				if (await this.isTemporarilyBlacklisted(clientIp)) {
					this.logger.info(
						`Temporarily blocked request from IP: ${clientIp}`
					);

					res.status(403).json({
						error: 'Access temporarily denied.'
					});
					return;
				}

				if (this.blacklist.includes(clientIp)) {
					this.logger.info(
						`Blocked request from blacklisted IP: ${clientIp}`
					);
					res.status(403).json({ error: 'Access denied' });
					return;
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
		this.whitelist = this.envConfig
			.getEnvVariable('ipWhitelistPath')
			.split(',');
		this.logger.info(
			`Whitelist initialized with ${this.whitelist.length} IPs.`
		);
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

	public async isBlacklisted(ip: string): Promise<boolean> {
		try {
			await this.loadIpBlacklist();

			return this.blacklist.includes(ip);
		} catch (error) {
			this.logger.error(
				`Error checking if IP ${ip} is blacklisted: ${error}`
			);
			return false;
		}
	}

	public async isBlacklistedOrTemporarilyBlacklisted(ip: string): Promise<{
		isBlacklisted: boolean;
		isTemporarilyBlacklisted: boolean;
	}> {
		try {
			const isBlacklisted = await this.isBlacklisted(ip);
			const isTemporarilyBlacklisted =
				await this.isTemporarilyBlacklisted(ip);
			return { isBlacklisted, isTemporarilyBlacklisted };
		} catch (error) {
			this.logger.error(
				`Error checking if IP ${ip} is blacklisted or temporarily blacklisted: ${error}`
			);
			return { isBlacklisted: false, isTemporarilyBlacklisted: false };
		}
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
			const cachedWhitelist = await this.cacheService.get<string[]>(
				this.whitelistKey,
				'gatekeeperService'
			);

			if (!cachedWhitelist) {
				this.logger.info(
					'IP whitelist not found in cache, loading from configuration...'
				);

				await this.loadWhitelist();
				await this.cacheService.set(
					this.whitelistKey,
					this.whitelist,
					'gatekeeperService',
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

	private async syncBlacklistFromRedisToFile(): Promise<void> {
		try {
			const blacklist = await this.redisService.get<string[]>(
				this.blacklistKey
			);

			if (blacklist) {
				this.blacklist = blacklist;
				await this.cacheService.set(
					this.blacklistKey,
					this.blacklist,
					'gatekeeperService',
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
			this.envConfig.getEnvVariable(envVariable)
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

	public async shutdown(): Promise<void> {
		try {
			this.logger.info('Shutting down GatekeeperService...');

			if (this.SYNC_INTERVAL) {
				clearInterval(this.SYNC_INTERVAL);
				this.logger.info('Stopped IP blacklist sync interval.');
			}

			this.globalRateLimitStats.clear();
			this.logger.info('Cleared global rate limit stats.');

			this.rateLimiter = null;
			this.logger.info('Rate limiter memory cleared.');

			GatekeeperService.instance = null;
			this.logger.info('GatekeeperService shutdown completed.');
		} catch (error) {
			const shutdownError =
				new this.errorHandler.ErrorClasses.UtilityErrorRecoverable(
					`Error during GatekeeperService shutdown: ${error instanceof Error ? error.message : 'Unknown error'}`
				);
			this.errorLogger.logError(shutdownError.message);
			this.errorHandler.handleError({ error: shutdownError });
		}
	}
}
