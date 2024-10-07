import fs from 'fs';
import path from 'path';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { LoggerServiceFactory } from '../index/factory/subfactories/LoggerServiceFactory.mjs';
import { ErrorHandlerServiceFactory } from '../index/factory/subfactories/ErrorHandlerServiceFactory.mjs';
import { CacheLayerServiceFactory } from '../index/factory/subfactories/CacheLayerServiceFactory.mjs';
import { EnvConfigServiceFactory } from '../index/factory/subfactories/EnvConfigServiceFactory.mjs';
import { ResourceManagerFactory } from '../index/factory/subfactories/ResourceManagerFactory.mjs';
export class GatekeeperService {
	static instance = null;
	logger;
	errorLogger;
	errorHandler;
	envConfig;
	cacheService;
	redisService;
	resourceManager;
	RATE_LIMIT_BASE_POINTS;
	RATE_LIMIT_BASE_DURATION;
	SYNC_INTERVAL;
	rateLimiter;
	blacklistKey = 'ipBlacklist';
	whitelistKey = 'ipWhitelist';
	rateLimitPrefix = 'rateLimit_';
	blacklist = [];
	whitelist = [];
	globalRateLimitStats = new Map();
	constructor(
		logger,
		errorLogger,
		errorHandler,
		envConfig,
		cacheService,
		redisService,
		resourceManager
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
	static async getInstance() {
		if (!GatekeeperService.instance) {
			const logger = await LoggerServiceFactory.getLoggerService();
			const errorLogger =
				await LoggerServiceFactory.getErrorLoggerService();
			const errorHandler =
				await ErrorHandlerServiceFactory.getErrorHandlerService();
			const envConfig =
				await EnvConfigServiceFactory.getEnvConfigService();
			const cacheService =
				await CacheLayerServiceFactory.getCacheService();
			const redisService =
				await CacheLayerServiceFactory.getRedisService();
			const resourceManager =
				await ResourceManagerFactory.getResourceManager();
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
	async initialize() {
		await Promise.all([this.loadIpBlacklist(), this.loadWhitelist()]);
		this.resetGlobalRateLimitStats();
		await this.syncBlacklistFromRedisToFile();
	}
	async dynamicRateLimiter() {
		if (!this.rateLimiter) {
			this.rateLimiter = new RateLimiterMemory({
				points: this.RATE_LIMIT_BASE_POINTS,
				duration: this.RATE_LIMIT_BASE_DURATION
			});
		}
		const cpuUsage = this.calculateCpuUsage();
		const memoryUsage =
			this.resourceManager.getMemoryUsage().heapUsedPercentage;
		const adjustedPoints = this.adjustRateLimitBasedOnResources(
			cpuUsage,
			memoryUsage
		);
		this.rateLimiter.points = adjustedPoints;
	}
	updateGlobalRateLimitStats(ip, remainingPoints) {
		this.globalRateLimitStats.set(ip, remainingPoints);
	}
	resetGlobalRateLimitStats() {
		setInterval(() => this.globalRateLimitStats.clear(), 60000);
		this.logger.info('Global rate limit stats reset.');
	}
	calculateCpuUsage() {
		const cpuUsages = this.resourceManager
			.getCpuUsage()
			.map(cpu => parseFloat(cpu.usage));
		return cpuUsages.reduce((a, b) => a + b, 0) / cpuUsages.length;
	}
	adjustRateLimitBasedOnResources(cpu, memory) {
		if (cpu > 80 || memory > 80) {
			this.logger.warn(
				`High resource usage detected. CPU: ${cpu}%, Memory: ${memory}%`
			);
			return Math.max(1, this.RATE_LIMIT_BASE_POINTS / 2);
		}
		return this.RATE_LIMIT_BASE_POINTS;
	}
	rateLimitMiddleware() {
		return async (req, res, next) => {
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
				let rateLimitInfo = await this.cacheService.get(
					rateLimitKey,
					'bouncerService'
				);
				if (rateLimitInfo === null) {
					rateLimitInfo = await this.redisService.get(rateLimitKey);
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
	triggerRateLimitWarning(ip, points, next) {
		this.logger.info(
			`Rate limit warning for IP ${ip}. Remaining points: ${points}`
		);
		next(new this.errorHandler.ErrorClasses.RateLimitErrorWarning(points));
	}
	async incrementRateLimit(ip) {
		const rateLimitKey = `${this.rateLimitPrefix}${ip}`;
		const basePoints = Number(
			this.envConfig.getEnvVariable('rateLimiterBasePoints')
		);
		const baseDuration = Number(
			this.envConfig.getEnvVariable('rateLimiterBaseDuration')
		);
		try {
			let currentPoints = await this.cacheService.get(
				rateLimitKey,
				'bouncerService'
			);
			if (currentPoints === null) {
				currentPoints =
					(await this.redisService.get(rateLimitKey)) ?? basePoints;
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
					(await this.redisService.get(`backoff_${ip}`)) || 1;
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
	slowdownMiddleware() {
		const slowdownThreshold = Number(
			this.envConfig.getEnvVariable('slowdownThreshold')
		);
		return (req, res, next) => {
			const requestTime = Date.now();
			this.handleSlowdown(req, res, next, requestTime, slowdownThreshold);
		};
	}
	handleSlowdown(req, res, next, requestTime, slowdownThreshold) {
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
	throttleRequests() {
		return async (req, res, next) => {
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
	ipBlacklistMiddleware() {
		return async (req, res, next) => {
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
	async loadIpBlacklist() {
		try {
			let cachedBlacklist = await this.cacheService.get(
				this.blacklistKey,
				'bouncerService'
			);
			if (!cachedBlacklist) {
				this.logger.info(
					'IP blacklist not found in cache, retrieving from Redis...'
				);
				cachedBlacklist = await this.redisService.get(
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
	async loadWhitelist() {
		this.whitelist = this.envConfig
			.getEnvVariable('ipWhitelistPath')
			.split(',');
		this.logger.info(
			`Whitelist initialized with ${this.whitelist.length} IPs.`
		);
	}
	async saveIpBlacklist() {
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
	async loadIpBlacklistFromFile() {
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
	async saveIpBlacklistToFile() {
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
	async addIpToBlacklist(ip) {
		if (!this.blacklist.includes(ip)) {
			this.blacklist.push(ip);
			await this.saveIpBlacklist();
			this.logger.info(`IP ${ip} added to blacklist.`);
		}
	}
	async removeIpFromBlacklist(ip) {
		this.blacklist = this.blacklist.filter(
			blacklistedIp => blacklistedIp !== ip
		);
		await this.saveIpBlacklist();
		this.logger.info(`IP ${ip} removed from blacklist.`);
	}
	async temporaryBlacklist(ip) {
		const temporaryBlacklistKey = `temporaryBlacklist_${ip}`;
		await this.redisService.set(temporaryBlacklistKey, true, 3600);
		this.logger.info(`IP ${ip} temporarily blacklisted for 1 hour.`);
	}
	async isTemporarilyBlacklisted(ip) {
		const temporaryBlacklistKey = `temporaryBlacklist_${ip}`;
		return !!(await this.redisService.get(temporaryBlacklistKey));
	}
	async isBlacklisted(ip) {
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
	async isBlacklistedOrTemporarilyBlacklisted(ip) {
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
	async preInitIpBlacklist() {
		try {
			const blacklistInRedis = await this.redisService.get(
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
	async preInitIpWhitelist() {
		try {
			const cachedWhitelist = await this.cacheService.get(
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
	async syncBlacklistFromRedisToFile() {
		try {
			const blacklist = await this.redisService.get(this.blacklistKey);
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
	handleDependencyError(middleware, error, req, res, next) {
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
	getFilePath(envVariable) {
		return path.resolve(
			__dirname,
			this.envConfig.getEnvVariable(envVariable)
		);
	}
	async concurrentFileAccessSafety(fileOperation) {
		try {
			await fileOperation();
		} catch (error) {
			this.logger.error('Error during concurrent file access.');
			throw error;
		}
	}
	async shutdown() {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiR2F0ZWtlZXBlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9zZXJ2aWNlcy9HYXRla2VlcGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUVBLE9BQU8sRUFBRSxNQUFNLElBQUksQ0FBQztBQUNwQixPQUFPLElBQUksTUFBTSxNQUFNLENBQUM7QUFDeEIsT0FBTyxFQUFFLGlCQUFpQixFQUFFLE1BQU0sdUJBQXVCLENBQUM7QUFXMUQsT0FBTyxFQUFFLG9CQUFvQixFQUFFLE1BQU0sb0RBQW9ELENBQUM7QUFDMUYsT0FBTyxFQUFFLDBCQUEwQixFQUFFLE1BQU0sMERBQTBELENBQUM7QUFDdEcsT0FBTyxFQUFFLHdCQUF3QixFQUFFLE1BQU0sd0RBQXdELENBQUM7QUFDbEcsT0FBTyxFQUFFLHVCQUF1QixFQUFFLE1BQU0sdURBQXVELENBQUM7QUFDaEcsT0FBTyxFQUFFLHNCQUFzQixFQUFFLE1BQU0sc0RBQXNELENBQUM7QUFFOUYsTUFBTSxPQUFPLGlCQUFpQjtJQUNyQixNQUFNLENBQUMsUUFBUSxHQUE2QixJQUFJLENBQUM7SUFFakQsTUFBTSxDQUE0QjtJQUNsQyxXQUFXLENBQThCO0lBQ3pDLFlBQVksQ0FBK0I7SUFDM0MsU0FBUyxDQUE0QjtJQUNyQyxZQUFZLENBQXdCO0lBQ3BDLFlBQVksQ0FBd0I7SUFDcEMsZUFBZSxDQUEyQjtJQUUxQyxzQkFBc0IsQ0FBUztJQUMvQix3QkFBd0IsQ0FBUztJQUNqQyxhQUFhLENBQVM7SUFDdEIsV0FBVyxDQUEyQjtJQUN0QyxZQUFZLEdBQUcsYUFBYSxDQUFDO0lBQzdCLFlBQVksR0FBRyxhQUFhLENBQUM7SUFDN0IsZUFBZSxHQUFHLFlBQVksQ0FBQztJQUMvQixTQUFTLEdBQWEsRUFBRSxDQUFDO0lBQ3pCLFNBQVMsR0FBYSxFQUFFLENBQUM7SUFDekIsb0JBQW9CLEdBQXdCLElBQUksR0FBRyxFQUFFLENBQUM7SUFFOUQsWUFDQyxNQUFpQyxFQUNqQyxXQUF3QyxFQUN4QyxZQUEwQyxFQUMxQyxTQUFvQyxFQUNwQyxZQUFtQyxFQUNuQyxZQUFtQyxFQUNuQyxlQUF5QztRQUV6QyxJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztRQUNyQixJQUFJLENBQUMsV0FBVyxHQUFHLFdBQVcsQ0FBQztRQUMvQixJQUFJLENBQUMsWUFBWSxHQUFHLFlBQVksQ0FBQztRQUNqQyxJQUFJLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQztRQUMzQixJQUFJLENBQUMsWUFBWSxHQUFHLFlBQVksQ0FBQztRQUNqQyxJQUFJLENBQUMsWUFBWSxHQUFHLFlBQVksQ0FBQztRQUNqQyxJQUFJLENBQUMsZUFBZSxHQUFHLGVBQWUsQ0FBQztRQUV2QyxJQUFJLENBQUMsc0JBQXNCLEdBQUcsTUFBTSxDQUNuQyxJQUFJLENBQUMsU0FBUyxDQUFDLGNBQWMsQ0FBQyx1QkFBdUIsQ0FBQyxDQUN0RCxDQUFDO1FBQ0YsSUFBSSxDQUFDLHdCQUF3QixHQUFHLE1BQU0sQ0FDckMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxjQUFjLENBQUMseUJBQXlCLENBQUMsQ0FDeEQsQ0FBQztRQUNGLElBQUksQ0FBQyxhQUFhO1lBQ2pCLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLGNBQWMsQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDO2dCQUM5RCxPQUFPLENBQUM7UUFFVCxJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksaUJBQWlCLENBQUM7WUFDeEMsTUFBTSxFQUFFLElBQUksQ0FBQyxzQkFBc0I7WUFDbkMsUUFBUSxFQUFFLElBQUksQ0FBQyx3QkFBd0I7U0FDdkMsQ0FBQyxDQUFDO1FBQ0gsSUFBSSxDQUFDLGtCQUFrQixFQUFFLENBQUM7UUFDMUIsSUFBSSxDQUFDLGtCQUFrQixFQUFFLENBQUM7UUFFMUIsV0FBVyxDQUNWLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyw0QkFBNEIsRUFBRSxFQUN6QyxJQUFJLENBQUMsYUFBYSxDQUNsQixDQUFDO0lBQ0gsQ0FBQztJQUVNLE1BQU0sQ0FBQyxLQUFLLENBQUMsV0FBVztRQUM5QixJQUFJLENBQUMsaUJBQWlCLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDakMsTUFBTSxNQUFNLEdBQUcsTUFBTSxvQkFBb0IsQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO1lBQzdELE1BQU0sV0FBVyxHQUNoQixNQUFNLG9CQUFvQixDQUFDLHFCQUFxQixFQUFFLENBQUM7WUFDcEQsTUFBTSxZQUFZLEdBQ2pCLE1BQU0sMEJBQTBCLENBQUMsc0JBQXNCLEVBQUUsQ0FBQztZQUMzRCxNQUFNLFNBQVMsR0FDZCxNQUFNLHVCQUF1QixDQUFDLG1CQUFtQixFQUFFLENBQUM7WUFDckQsTUFBTSxZQUFZLEdBQ2pCLE1BQU0sd0JBQXdCLENBQUMsZUFBZSxFQUFFLENBQUM7WUFDbEQsTUFBTSxZQUFZLEdBQ2pCLE1BQU0sd0JBQXdCLENBQUMsZUFBZSxFQUFFLENBQUM7WUFDbEQsTUFBTSxlQUFlLEdBQ3BCLE1BQU0sc0JBQXNCLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztZQUVuRCxpQkFBaUIsQ0FBQyxRQUFRLEdBQUcsSUFBSSxpQkFBaUIsQ0FDakQsTUFBTSxFQUNOLFdBQVcsRUFDWCxZQUFZLEVBQ1osU0FBUyxFQUNULFlBQVksRUFDWixZQUFZLEVBQ1osZUFBZSxDQUNmLENBQUM7UUFDSCxDQUFDO1FBRUQsT0FBTyxpQkFBaUIsQ0FBQyxRQUFRLENBQUM7SUFDbkMsQ0FBQztJQUVNLEtBQUssQ0FBQyxVQUFVO1FBQ3RCLE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxlQUFlLEVBQUUsRUFBRSxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ2xFLElBQUksQ0FBQyx5QkFBeUIsRUFBRSxDQUFDO1FBQ2pDLE1BQU0sSUFBSSxDQUFDLDRCQUE0QixFQUFFLENBQUM7SUFDM0MsQ0FBQztJQUVNLEtBQUssQ0FBQyxrQkFBa0I7UUFDOUIsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUN2QixJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksaUJBQWlCLENBQUM7Z0JBQ3hDLE1BQU0sRUFBRSxJQUFJLENBQUMsc0JBQXNCO2dCQUNuQyxRQUFRLEVBQUUsSUFBSSxDQUFDLHdCQUF3QjthQUN2QyxDQUFDLENBQUM7UUFDSixDQUFDO1FBRUQsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixFQUFFLENBQUM7UUFDMUMsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxjQUFjLEVBQUU7YUFDdkQsa0JBQTRCLENBQUM7UUFFL0IsTUFBTSxjQUFjLEdBQUcsSUFBSSxDQUFDLCtCQUErQixDQUMxRCxRQUFRLEVBQ1IsV0FBVyxDQUNYLENBQUM7UUFFRixJQUFJLENBQUMsV0FBVyxDQUFDLE1BQU0sR0FBRyxjQUFjLENBQUM7SUFDMUMsQ0FBQztJQUVPLDBCQUEwQixDQUNqQyxFQUFVLEVBQ1YsZUFBdUI7UUFFdkIsSUFBSSxDQUFDLG9CQUFvQixDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsZUFBZSxDQUFDLENBQUM7SUFDcEQsQ0FBQztJQUVPLHlCQUF5QjtRQUNoQyxXQUFXLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLEtBQUssRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQzVELElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLGdDQUFnQyxDQUFDLENBQUM7SUFDcEQsQ0FBQztJQUVPLGlCQUFpQjtRQUN4QixNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsZUFBZTthQUNwQyxXQUFXLEVBQUU7YUFDYixHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFDcEMsT0FBTyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxTQUFTLENBQUMsTUFBTSxDQUFDO0lBQ2hFLENBQUM7SUFFTywrQkFBK0IsQ0FDdEMsR0FBVyxFQUNYLE1BQWM7UUFFZCxJQUFJLEdBQUcsR0FBRyxFQUFFLElBQUksTUFBTSxHQUFHLEVBQUUsRUFBRSxDQUFDO1lBQzdCLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUNmLHNDQUFzQyxHQUFHLGNBQWMsTUFBTSxHQUFHLENBQ2hFLENBQUM7WUFDRixPQUFPLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxzQkFBc0IsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUNyRCxDQUFDO1FBQ0QsT0FBTyxJQUFJLENBQUMsc0JBQXNCLENBQUM7SUFDcEMsQ0FBQztJQUVNLG1CQUFtQjtRQUN6QixPQUFPLEtBQUssRUFDWCxHQUFZLEVBQ1osR0FBYSxFQUNiLElBQWtCLEVBQ0YsRUFBRTtZQUNsQixNQUFNLEVBQUUsR0FBRyxHQUFHLENBQUMsRUFBRSxJQUFJLFNBQVMsQ0FBQztZQUMvQixNQUFNLFlBQVksR0FBRyxHQUFHLElBQUksQ0FBQyxlQUFlLEdBQUcsRUFBRSxFQUFFLENBQUM7WUFFcEQsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztnQkFDdkIsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLGlCQUFpQixDQUFDO29CQUN4QyxNQUFNLEVBQUUsSUFBSSxDQUFDLHNCQUFzQjtvQkFDbkMsUUFBUSxFQUFFLElBQUksQ0FBQyx3QkFBd0I7aUJBQ3ZDLENBQUMsQ0FBQztZQUNKLENBQUM7WUFFRCxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUM7Z0JBQ2pDLE9BQU8sSUFBSSxFQUFFLENBQUM7WUFDZixDQUFDO1lBRUQsSUFBSSxDQUFDO2dCQUNKLElBQUksYUFBYSxHQUFHLE1BQU0sSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQzlDLFlBQVksRUFDWixnQkFBZ0IsQ0FDaEIsQ0FBQztnQkFFRixJQUFJLGFBQWEsS0FBSyxJQUFJLEVBQUUsQ0FBQztvQkFDNUIsYUFBYTt3QkFDWixNQUFNLElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFTLFlBQVksQ0FBQyxDQUFDO2dCQUNwRCxDQUFDO2dCQUVELElBQUksYUFBYSxLQUFLLElBQUksRUFBRSxDQUFDO29CQUM1QixNQUFNLFlBQVksR0FBRyxNQUFNLElBQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDO29CQUN4RCxhQUFhLEdBQUcsWUFBWSxDQUFDLGVBQWUsQ0FBQztnQkFDOUMsQ0FBQztnQkFFRCxJQUFJLGFBQWEsSUFBSSxDQUFDLEVBQUUsQ0FBQztvQkFDeEIsT0FBTyxJQUFJLENBQUMsdUJBQXVCLENBQ2xDLEVBQUUsRUFDRixhQUFhLEVBQ2IsSUFBSSxDQUNKLENBQUM7Z0JBQ0gsQ0FBQztnQkFFRCxNQUFNLElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUMxQixZQUFZLEVBQ1osYUFBYSxFQUNiLGdCQUFnQixFQUNoQixFQUFFLENBQ0YsQ0FBQztnQkFDRixNQUFNLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFDbEMsSUFBSSxFQUFFLENBQUM7WUFDUixDQUFDO1lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztnQkFDaEIsSUFBSSxDQUFDLHFCQUFxQixDQUN6QixxQkFBcUIsRUFDckIsS0FBSyxFQUNMLEdBQUcsRUFDSCxHQUFHLEVBQ0gsSUFBSSxDQUNKLENBQUM7WUFDSCxDQUFDO1FBQ0YsQ0FBQyxDQUFDO0lBQ0gsQ0FBQztJQUVPLHVCQUF1QixDQUM5QixFQUFVLEVBQ1YsTUFBYyxFQUNkLElBQWtCO1FBRWxCLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUNmLDZCQUE2QixFQUFFLHVCQUF1QixNQUFNLEVBQUUsQ0FDOUQsQ0FBQztRQUNGLElBQUksQ0FBQyxJQUFJLElBQUksQ0FBQyxZQUFZLENBQUMsWUFBWSxDQUFDLHFCQUFxQixDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7SUFDeEUsQ0FBQztJQUVPLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxFQUFVO1FBQzFDLE1BQU0sWUFBWSxHQUFHLEdBQUcsSUFBSSxDQUFDLGVBQWUsR0FBRyxFQUFFLEVBQUUsQ0FBQztRQUNwRCxNQUFNLFVBQVUsR0FBRyxNQUFNLENBQ3hCLElBQUksQ0FBQyxTQUFTLENBQUMsY0FBYyxDQUFDLHVCQUF1QixDQUFDLENBQ3RELENBQUM7UUFDRixNQUFNLFlBQVksR0FBRyxNQUFNLENBQzFCLElBQUksQ0FBQyxTQUFTLENBQUMsY0FBYyxDQUFDLHlCQUF5QixDQUFDLENBQ3hELENBQUM7UUFFRixJQUFJLENBQUM7WUFDSixJQUFJLGFBQWEsR0FBRyxNQUFNLElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUM5QyxZQUFZLEVBQ1osZ0JBQWdCLENBQ2hCLENBQUM7WUFFRixJQUFJLGFBQWEsS0FBSyxJQUFJLEVBQUUsQ0FBQztnQkFDNUIsYUFBYTtvQkFDWixDQUFDLE1BQU0sSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQVMsWUFBWSxDQUFDLENBQUM7d0JBQ25ELFVBQVUsQ0FBQztZQUNiLENBQUM7WUFFRCxJQUFJLGFBQWEsR0FBRyxDQUFDLEVBQUUsQ0FBQztnQkFDdkIsYUFBYSxJQUFJLENBQUMsQ0FBQztnQkFDbkIsTUFBTSxJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FDMUIsWUFBWSxFQUNaLGFBQWEsRUFDYixZQUFZLENBQ1osQ0FBQztnQkFDRixNQUFNLElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUMxQixZQUFZLEVBQ1osYUFBYSxFQUNiLGdCQUFnQixFQUNoQixFQUFFLENBQ0YsQ0FBQztZQUNILENBQUM7aUJBQU0sQ0FBQztnQkFDUCxNQUFNLGlCQUFpQixHQUN0QixDQUFDLE1BQU0sSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQVMsV0FBVyxFQUFFLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUM3RCxNQUFNLFdBQVcsR0FBRyxZQUFZLEdBQUcsaUJBQWlCLENBQUM7Z0JBQ3JELE1BQU0sSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQzFCLFlBQVksRUFDWixVQUFVLEVBQ1YsV0FBVyxDQUNYLENBQUM7Z0JBQ0YsTUFBTSxJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FDMUIsWUFBWSxFQUNaLFVBQVUsRUFDVixnQkFBZ0IsRUFDaEIsRUFBRSxDQUNGLENBQUM7Z0JBQ0YsTUFBTSxJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FDMUIsV0FBVyxFQUFFLEVBQUUsRUFDZixpQkFBaUIsR0FBRyxDQUFDLENBQ3JCLENBQUM7Z0JBQ0YsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQ2Ysc0NBQXNDLEVBQUUsS0FBSyxXQUFXLEtBQUssQ0FDN0QsQ0FBQztZQUNILENBQUM7WUFFRCxJQUFJLENBQUMsMEJBQTBCLENBQUMsRUFBRSxFQUFFLGFBQWEsQ0FBQyxDQUFDO1FBQ3BELENBQUM7UUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO1lBQ2hCLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUNoQix5Q0FBeUMsRUFBRSxLQUFLLEtBQUssRUFBRSxDQUN2RCxDQUFDO1FBQ0gsQ0FBQztJQUNGLENBQUM7SUFFTSxrQkFBa0I7UUFDeEIsTUFBTSxpQkFBaUIsR0FBRyxNQUFNLENBQy9CLElBQUksQ0FBQyxTQUFTLENBQUMsY0FBYyxDQUFDLG1CQUFtQixDQUFDLENBQ2xELENBQUM7UUFDRixPQUFPLENBQ04sR0FBa0UsRUFDbEUsR0FBYSxFQUNiLElBQWtCLEVBQ1gsRUFBRTtZQUNULE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztZQUMvQixJQUFJLENBQUMsY0FBYyxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLFdBQVcsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO1FBQ3JFLENBQUMsQ0FBQztJQUNILENBQUM7SUFFTyxjQUFjLENBQ3JCLEdBQWtFLEVBQ2xFLEdBQWEsRUFDYixJQUFrQixFQUNsQixXQUFtQixFQUNuQixpQkFBeUI7UUFFekIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFPO1lBQUUsT0FBTyxJQUFJLEVBQUUsQ0FBQztRQUVoQyxNQUFNLFFBQVEsR0FBRyxXQUFXLEdBQUcsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLGVBQWUsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUNsRSxHQUFHLENBQUMsT0FBTyxDQUFDLGVBQWUsR0FBRyxXQUFXLENBQUM7UUFFMUMsSUFBSSxRQUFRLEdBQUcsaUJBQWlCLEVBQUUsQ0FBQztZQUNsQyxNQUFNLFFBQVEsR0FBRyxpQkFBaUIsR0FBRyxRQUFRLENBQUM7WUFDOUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQ2YsbUNBQW1DLEdBQUcsQ0FBQyxFQUFFLDBCQUEwQixRQUFRLEtBQUssQ0FDaEYsQ0FBQztZQUNGLFVBQVUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLEVBQUUsRUFBRSxRQUFRLENBQUMsQ0FBQztRQUNwQyxDQUFDO2FBQU0sQ0FBQztZQUNQLElBQUksRUFBRSxDQUFDO1FBQ1IsQ0FBQztJQUNGLENBQUM7SUFFTSxnQkFBZ0I7UUFLdEIsT0FBTyxLQUFLLEVBQUUsR0FBWSxFQUFFLEdBQWEsRUFBRSxJQUFrQixFQUFFLEVBQUU7WUFDaEUsSUFBSSxDQUFDO2dCQUNKLE1BQU0sT0FBTyxHQUFHLENBQUMsTUFBTSxNQUFNLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUM7Z0JBQ3JELElBQUksT0FBTyxFQUFFLEVBQUUsQ0FBQztvQkFDZixJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FDZiwwQ0FBMEMsR0FBRyxDQUFDLEVBQUUsRUFBRSxDQUNsRCxDQUFDO29CQUNGLE9BQU8sR0FBRzt5QkFDUixNQUFNLENBQUMsR0FBRyxDQUFDO3lCQUNYLElBQUksQ0FBQyxFQUFFLEtBQUssRUFBRSxtQ0FBbUMsRUFBRSxDQUFDLENBQUM7Z0JBQ3hELENBQUM7Z0JBQ0QsT0FBTyxJQUFJLEVBQUUsQ0FBQztZQUNmLENBQUM7WUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO2dCQUNoQixJQUFJLENBQUMscUJBQXFCLENBQ3pCLGtCQUFrQixFQUNsQixLQUFLLEVBQ0wsR0FBRyxFQUNILEdBQUcsRUFDSCxJQUFJLENBQ0osQ0FBQztZQUNILENBQUM7UUFDRixDQUFDLENBQUM7SUFDSCxDQUFDO0lBRU0scUJBQXFCO1FBSzNCLE9BQU8sS0FBSyxFQUNYLEdBQVksRUFDWixHQUFhLEVBQ2IsSUFBa0IsRUFDRixFQUFFO1lBQ2xCLE1BQU0sUUFBUSxHQUFHLEdBQUcsQ0FBQyxFQUFFLENBQUM7WUFFeEIsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUNmLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsS0FBSyxFQUFFLGFBQWEsRUFBRSxDQUFDLENBQUM7Z0JBQy9DLE9BQU87WUFDUixDQUFDO1lBRUQsSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDO2dCQUN2QyxPQUFPLElBQUksRUFBRSxDQUFDO1lBQ2YsQ0FBQztZQUVELElBQUksQ0FBQztnQkFDSixJQUFJLE1BQU0sSUFBSSxDQUFDLHdCQUF3QixDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7b0JBQ25ELElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUNmLHdDQUF3QyxRQUFRLEVBQUUsQ0FDbEQsQ0FBQztvQkFFRixHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQzt3QkFDcEIsS0FBSyxFQUFFLDRCQUE0QjtxQkFDbkMsQ0FBQyxDQUFDO29CQUNILE9BQU87Z0JBQ1IsQ0FBQztnQkFFRCxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7b0JBQ3ZDLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUNmLHdDQUF3QyxRQUFRLEVBQUUsQ0FDbEQsQ0FBQztvQkFDRixHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLEtBQUssRUFBRSxlQUFlLEVBQUUsQ0FBQyxDQUFDO29CQUNqRCxPQUFPO2dCQUNSLENBQUM7Z0JBRUQsSUFBSSxFQUFFLENBQUM7WUFDUixDQUFDO1lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztnQkFDaEIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMscUNBQXFDLEtBQUssRUFBRSxDQUFDLENBQUM7Z0JBQ2hFLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsS0FBSyxFQUFFLHVCQUF1QixFQUFFLENBQUMsQ0FBQztZQUMxRCxDQUFDO1FBQ0YsQ0FBQyxDQUFDO0lBQ0gsQ0FBQztJQUVNLEtBQUssQ0FBQyxlQUFlO1FBQzNCLElBQUksQ0FBQztZQUNKLElBQUksZUFBZSxHQUFHLE1BQU0sSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQ2hELElBQUksQ0FBQyxZQUFZLEVBQ2pCLGdCQUFnQixDQUNoQixDQUFDO1lBRUYsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO2dCQUN0QixJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FDZiwyREFBMkQsQ0FDM0QsQ0FBQztnQkFDRixlQUFlLEdBQUcsTUFBTSxJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FDNUMsSUFBSSxDQUFDLFlBQVksQ0FDakIsQ0FBQztnQkFFRixJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7b0JBQ3RCLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUNmLHVEQUF1RCxDQUN2RCxDQUFDO29CQUNGLE1BQU0sSUFBSSxDQUFDLHVCQUF1QixFQUFFLENBQUM7Z0JBQ3RDLENBQUM7cUJBQU0sQ0FBQztvQkFDUCxNQUFNLElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUMxQixJQUFJLENBQUMsWUFBWSxFQUNqQixlQUFlLEVBQ2YsZ0JBQWdCLEVBQ2hCLElBQUksQ0FDSixDQUFDO29CQUNGLElBQUksQ0FBQyxTQUFTLEdBQUcsZUFBZSxDQUFDO2dCQUNsQyxDQUFDO1lBQ0YsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLElBQUksQ0FBQyxTQUFTLEdBQUcsZUFBZSxDQUFDO1lBQ2xDLENBQUM7UUFDRixDQUFDO1FBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztZQUNoQixJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FDaEIsK0JBQStCLEtBQUssWUFBWSxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUN6RixDQUFDO1lBQ0YsTUFBTSxJQUFJLENBQUMsdUJBQXVCLEVBQUUsQ0FBQztRQUN0QyxDQUFDO0lBQ0YsQ0FBQztJQUVPLEtBQUssQ0FBQyxhQUFhO1FBQzFCLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLFNBQVM7YUFDN0IsY0FBYyxDQUFDLGlCQUFpQixDQUFDO2FBQ2pDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNiLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUNmLDhCQUE4QixJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sT0FBTyxDQUMxRCxDQUFDO0lBQ0gsQ0FBQztJQUVPLEtBQUssQ0FBQyxlQUFlO1FBQzVCLElBQUksQ0FBQztZQUNKLE1BQU0sSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDL0QsTUFBTSxJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FDMUIsSUFBSSxDQUFDLFlBQVksRUFDakIsSUFBSSxDQUFDLFNBQVMsRUFDZCxnQkFBZ0IsRUFDaEIsSUFBSSxDQUNKLENBQUM7UUFDSCxDQUFDO1FBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztZQUNoQixJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyx1Q0FBdUMsS0FBSyxFQUFFLENBQUMsQ0FBQztRQUNuRSxDQUFDO1FBQ0QsTUFBTSxJQUFJLENBQUMscUJBQXFCLEVBQUUsQ0FBQztJQUNwQyxDQUFDO0lBRU8sS0FBSyxDQUFDLHVCQUF1QjtRQUNwQyxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLHFCQUFxQixDQUFDLENBQUM7UUFDekQsTUFBTSxJQUFJLENBQUMsMEJBQTBCLENBQUMsS0FBSyxJQUFJLEVBQUU7WUFDaEQsSUFBSSxDQUFDO2dCQUNKLElBQUksRUFBRSxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDO29CQUM3QixJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQzFCLEVBQUUsQ0FBQyxZQUFZLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxDQUNqQyxDQUFDO2dCQUNILENBQUM7WUFDRixDQUFDO1lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztnQkFDaEIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQ2hCLHlDQUF5QyxLQUFLLEVBQUUsQ0FDaEQsQ0FBQztZQUNILENBQUM7UUFDRixDQUFDLENBQUMsQ0FBQztJQUNKLENBQUM7SUFFTyxLQUFLLENBQUMscUJBQXFCO1FBQ2xDLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMscUJBQXFCLENBQUMsQ0FBQztRQUN6RCxNQUFNLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxLQUFLLElBQUksRUFBRTtZQUNoRCxJQUFJLENBQUM7Z0JBQ0osRUFBRSxDQUFDLGFBQWEsQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztZQUM1RCxDQUFDO1lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztnQkFDaEIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQ2hCLHNDQUFzQyxLQUFLLEVBQUUsQ0FDN0MsQ0FBQztZQUNILENBQUM7UUFDRixDQUFDLENBQUMsQ0FBQztJQUNKLENBQUM7SUFFTSxLQUFLLENBQUMsZ0JBQWdCLENBQUMsRUFBVTtRQUN2QyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQztZQUNsQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUN4QixNQUFNLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztZQUM3QixJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsc0JBQXNCLENBQUMsQ0FBQztRQUNsRCxDQUFDO0lBQ0YsQ0FBQztJQUVNLEtBQUssQ0FBQyxxQkFBcUIsQ0FBQyxFQUFVO1FBQzVDLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQ3JDLGFBQWEsQ0FBQyxFQUFFLENBQUMsYUFBYSxLQUFLLEVBQUUsQ0FDckMsQ0FBQztRQUNGLE1BQU0sSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO1FBQzdCLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSwwQkFBMEIsQ0FBQyxDQUFDO0lBQ3RELENBQUM7SUFFTSxLQUFLLENBQUMsa0JBQWtCLENBQUMsRUFBVTtRQUN6QyxNQUFNLHFCQUFxQixHQUFHLHNCQUFzQixFQUFFLEVBQUUsQ0FBQztRQUN6RCxNQUFNLElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLHFCQUFxQixFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztRQUMvRCxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsc0NBQXNDLENBQUMsQ0FBQztJQUNsRSxDQUFDO0lBRU0sS0FBSyxDQUFDLHdCQUF3QixDQUFDLEVBQVU7UUFDL0MsTUFBTSxxQkFBcUIsR0FBRyxzQkFBc0IsRUFBRSxFQUFFLENBQUM7UUFDekQsT0FBTyxDQUFDLENBQUMsQ0FBQyxNQUFNLElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFVLHFCQUFxQixDQUFDLENBQUMsQ0FBQztJQUN4RSxDQUFDO0lBRU0sS0FBSyxDQUFDLGFBQWEsQ0FBQyxFQUFVO1FBQ3BDLElBQUksQ0FBQztZQUNKLE1BQU0sSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO1lBRTdCLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDcEMsQ0FBQztRQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7WUFDaEIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQ2hCLHdCQUF3QixFQUFFLG9CQUFvQixLQUFLLEVBQUUsQ0FDckQsQ0FBQztZQUNGLE9BQU8sS0FBSyxDQUFDO1FBQ2QsQ0FBQztJQUNGLENBQUM7SUFFTSxLQUFLLENBQUMscUNBQXFDLENBQUMsRUFBVTtRQUk1RCxJQUFJLENBQUM7WUFDSixNQUFNLGFBQWEsR0FBRyxNQUFNLElBQUksQ0FBQyxhQUFhLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDbkQsTUFBTSx3QkFBd0IsR0FDN0IsTUFBTSxJQUFJLENBQUMsd0JBQXdCLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDekMsT0FBTyxFQUFFLGFBQWEsRUFBRSx3QkFBd0IsRUFBRSxDQUFDO1FBQ3BELENBQUM7UUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO1lBQ2hCLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUNoQix3QkFBd0IsRUFBRSwrQ0FBK0MsS0FBSyxFQUFFLENBQ2hGLENBQUM7WUFDRixPQUFPLEVBQUUsYUFBYSxFQUFFLEtBQUssRUFBRSx3QkFBd0IsRUFBRSxLQUFLLEVBQUUsQ0FBQztRQUNsRSxDQUFDO0lBQ0YsQ0FBQztJQUVNLEtBQUssQ0FBQyxrQkFBa0I7UUFDOUIsSUFBSSxDQUFDO1lBQ0osTUFBTSxnQkFBZ0IsR0FBRyxNQUFNLElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUNuRCxJQUFJLENBQUMsWUFBWSxDQUNqQixDQUFDO1lBQ0YsSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7Z0JBQ3ZCLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUNmLHVEQUF1RCxDQUN2RCxDQUFDO2dCQUNGLE1BQU0sSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO2dCQUM3QixNQUFNLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztnQkFDN0IsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQ2YsbURBQW1ELENBQ25ELENBQUM7WUFDSCxDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsSUFBSSxDQUFDLFNBQVMsR0FBRyxnQkFBZ0IsQ0FBQztnQkFDbEMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsc0NBQXNDLENBQUMsQ0FBQztZQUMxRCxDQUFDO1FBQ0YsQ0FBQztRQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7WUFDaEIsSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQ3ZCLG9EQUFvRCxNQUFNLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FDbkUsQ0FBQztZQUNGLE1BQU0sSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO1FBQzlCLENBQUM7SUFDRixDQUFDO0lBRU8sS0FBSyxDQUFDLGtCQUFrQjtRQUMvQixJQUFJLENBQUM7WUFDSixNQUFNLGVBQWUsR0FBRyxNQUFNLElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUNsRCxJQUFJLENBQUMsWUFBWSxFQUNqQixtQkFBbUIsQ0FDbkIsQ0FBQztZQUVGLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztnQkFDdEIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQ2YsZ0VBQWdFLENBQ2hFLENBQUM7Z0JBRUYsTUFBTSxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7Z0JBQzNCLE1BQU0sSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQzFCLElBQUksQ0FBQyxZQUFZLEVBQ2pCLElBQUksQ0FBQyxTQUFTLEVBQ2QsbUJBQW1CLEVBQ25CLElBQUksQ0FDSixDQUFDO1lBQ0gsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLElBQUksQ0FBQyxTQUFTLEdBQUcsZUFBZSxDQUFDO1lBQ2xDLENBQUM7UUFDRixDQUFDO1FBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztZQUNoQixJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FDaEIsb0NBQW9DLEtBQUssWUFBWSxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUM5RixDQUFDO1FBQ0gsQ0FBQztJQUNGLENBQUM7SUFFTyxLQUFLLENBQUMsNEJBQTRCO1FBQ3pDLElBQUksQ0FBQztZQUNKLE1BQU0sU0FBUyxHQUFHLE1BQU0sSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQzVDLElBQUksQ0FBQyxZQUFZLENBQ2pCLENBQUM7WUFFRixJQUFJLFNBQVMsRUFBRSxDQUFDO2dCQUNmLElBQUksQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFDO2dCQUMzQixNQUFNLElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUMxQixJQUFJLENBQUMsWUFBWSxFQUNqQixJQUFJLENBQUMsU0FBUyxFQUNkLG1CQUFtQixFQUNuQixJQUFJLENBQ0osQ0FBQztnQkFDRixNQUFNLElBQUksQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO2dCQUNuQyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FDZixnRUFBZ0UsQ0FDaEUsQ0FBQztZQUNILENBQUM7aUJBQU0sQ0FBQztnQkFDUCxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyw2Q0FBNkMsQ0FBQyxDQUFDO1lBQ2pFLENBQUM7UUFDRixDQUFDO1FBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztZQUNoQixJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FDaEIsa0RBQWtELEtBQUssRUFBRSxDQUN6RCxDQUFDO1FBQ0gsQ0FBQztJQUNGLENBQUM7SUFFTyxxQkFBcUIsQ0FDNUIsVUFBa0IsRUFDbEIsS0FBYyxFQUNkLEdBQVksRUFDWixHQUFhLEVBQ2IsSUFBa0I7UUFFbEIsTUFBTSxzQkFBc0IsR0FDM0IsSUFBSSxJQUFJLENBQUMsWUFBWSxDQUFDLFlBQVksQ0FBQyxvQkFBb0IsQ0FDdEQseUNBQXlDLFVBQVUsTUFBTSxLQUFLLFlBQVksS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxlQUFlLEVBQUUsRUFDbkgsRUFBRSxVQUFVLEVBQUUsVUFBVSxFQUFFLENBQzFCLENBQUM7UUFDSCxJQUFJLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxzQkFBc0IsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUMxRCxJQUFJLENBQUMsWUFBWSxDQUFDLG1CQUFtQixFQUFFLENBQ3RDLHNCQUFzQixFQUN0QixHQUFHLEVBQ0gsR0FBRyxFQUNILElBQUksQ0FDSixDQUFDO0lBQ0gsQ0FBQztJQUVPLFdBQVcsQ0FDbEIsV0FJd0I7UUFFeEIsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUNsQixTQUFTLEVBQ1QsSUFBSSxDQUFDLFNBQVMsQ0FBQyxjQUFjLENBQUMsV0FBVyxDQUFDLENBQzFDLENBQUM7SUFDSCxDQUFDO0lBRU8sS0FBSyxDQUFDLDBCQUEwQixDQUN2QyxhQUFrQztRQUVsQyxJQUFJLENBQUM7WUFDSixNQUFNLGFBQWEsRUFBRSxDQUFDO1FBQ3ZCLENBQUM7UUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO1lBQ2hCLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLHNDQUFzQyxDQUFDLENBQUM7WUFDMUQsTUFBTSxLQUFLLENBQUM7UUFDYixDQUFDO0lBQ0YsQ0FBQztJQUVNLEtBQUssQ0FBQyxRQUFRO1FBQ3BCLElBQUksQ0FBQztZQUNKLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLG9DQUFvQyxDQUFDLENBQUM7WUFFdkQsSUFBSSxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7Z0JBQ3hCLGFBQWEsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUM7Z0JBQ2xDLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLHFDQUFxQyxDQUFDLENBQUM7WUFDekQsQ0FBQztZQUVELElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUNsQyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxrQ0FBa0MsQ0FBQyxDQUFDO1lBRXJELElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDO1lBQ3hCLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLDhCQUE4QixDQUFDLENBQUM7WUFFakQsaUJBQWlCLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQztZQUNsQyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyx1Q0FBdUMsQ0FBQyxDQUFDO1FBQzNELENBQUM7UUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO1lBQ2hCLE1BQU0sYUFBYSxHQUNsQixJQUFJLElBQUksQ0FBQyxZQUFZLENBQUMsWUFBWSxDQUFDLHVCQUF1QixDQUN6RCw0Q0FBNEMsS0FBSyxZQUFZLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQ3RHLENBQUM7WUFDSCxJQUFJLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDakQsSUFBSSxDQUFDLFlBQVksQ0FBQyxXQUFXLENBQUMsRUFBRSxLQUFLLEVBQUUsYUFBYSxFQUFFLENBQUMsQ0FBQztRQUN6RCxDQUFDO0lBQ0YsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFJlcXVlc3QsIFJlc3BvbnNlLCBOZXh0RnVuY3Rpb24gfSBmcm9tICdleHByZXNzJztcbmltcG9ydCB7IFNlc3Npb24gfSBmcm9tICdleHByZXNzLXNlc3Npb24nO1xuaW1wb3J0IGZzIGZyb20gJ2ZzJztcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgUmF0ZUxpbWl0ZXJNZW1vcnkgfSBmcm9tICdyYXRlLWxpbWl0ZXItZmxleGlibGUnO1xuaW1wb3J0IHtcblx0QXBwTG9nZ2VyU2VydmljZUludGVyZmFjZSxcblx0Q2FjaGVTZXJ2aWNlSW50ZXJmYWNlLFxuXHRFbnZDb25maWdTZXJ2aWNlSW50ZXJmYWNlLFxuXHRFcnJvckxvZ2dlclNlcnZpY2VJbnRlcmZhY2UsXG5cdEVycm9ySGFuZGxlclNlcnZpY2VJbnRlcmZhY2UsXG5cdEdhdGVrZWVwZXJTZXJ2aWNlSW50ZXJmYWNlLFxuXHRSZWRpc1NlcnZpY2VJbnRlcmZhY2UsXG5cdFJlc291cmNlTWFuYWdlckludGVyZmFjZVxufSBmcm9tICcuLi9pbmRleC9pbnRlcmZhY2VzL21haW4nO1xuaW1wb3J0IHsgTG9nZ2VyU2VydmljZUZhY3RvcnkgfSBmcm9tICcuLi9pbmRleC9mYWN0b3J5L3N1YmZhY3Rvcmllcy9Mb2dnZXJTZXJ2aWNlRmFjdG9yeSc7XG5pbXBvcnQgeyBFcnJvckhhbmRsZXJTZXJ2aWNlRmFjdG9yeSB9IGZyb20gJy4uL2luZGV4L2ZhY3Rvcnkvc3ViZmFjdG9yaWVzL0Vycm9ySGFuZGxlclNlcnZpY2VGYWN0b3J5JztcbmltcG9ydCB7IENhY2hlTGF5ZXJTZXJ2aWNlRmFjdG9yeSB9IGZyb20gJy4uL2luZGV4L2ZhY3Rvcnkvc3ViZmFjdG9yaWVzL0NhY2hlTGF5ZXJTZXJ2aWNlRmFjdG9yeSc7XG5pbXBvcnQgeyBFbnZDb25maWdTZXJ2aWNlRmFjdG9yeSB9IGZyb20gJy4uL2luZGV4L2ZhY3Rvcnkvc3ViZmFjdG9yaWVzL0VudkNvbmZpZ1NlcnZpY2VGYWN0b3J5JztcbmltcG9ydCB7IFJlc291cmNlTWFuYWdlckZhY3RvcnkgfSBmcm9tICcuLi9pbmRleC9mYWN0b3J5L3N1YmZhY3Rvcmllcy9SZXNvdXJjZU1hbmFnZXJGYWN0b3J5JztcblxuZXhwb3J0IGNsYXNzIEdhdGVrZWVwZXJTZXJ2aWNlIGltcGxlbWVudHMgR2F0ZWtlZXBlclNlcnZpY2VJbnRlcmZhY2Uge1xuXHRwcml2YXRlIHN0YXRpYyBpbnN0YW5jZTogR2F0ZWtlZXBlclNlcnZpY2UgfCBudWxsID0gbnVsbDtcblxuXHRwcml2YXRlIGxvZ2dlcjogQXBwTG9nZ2VyU2VydmljZUludGVyZmFjZTtcblx0cHJpdmF0ZSBlcnJvckxvZ2dlcjogRXJyb3JMb2dnZXJTZXJ2aWNlSW50ZXJmYWNlO1xuXHRwcml2YXRlIGVycm9ySGFuZGxlcjogRXJyb3JIYW5kbGVyU2VydmljZUludGVyZmFjZTtcblx0cHJpdmF0ZSBlbnZDb25maWc6IEVudkNvbmZpZ1NlcnZpY2VJbnRlcmZhY2U7XG5cdHByaXZhdGUgY2FjaGVTZXJ2aWNlOiBDYWNoZVNlcnZpY2VJbnRlcmZhY2U7XG5cdHByaXZhdGUgcmVkaXNTZXJ2aWNlOiBSZWRpc1NlcnZpY2VJbnRlcmZhY2U7XG5cdHByaXZhdGUgcmVzb3VyY2VNYW5hZ2VyOiBSZXNvdXJjZU1hbmFnZXJJbnRlcmZhY2U7XG5cblx0cHJpdmF0ZSBSQVRFX0xJTUlUX0JBU0VfUE9JTlRTOiBudW1iZXI7XG5cdHByaXZhdGUgUkFURV9MSU1JVF9CQVNFX0RVUkFUSU9OOiBudW1iZXI7XG5cdHByaXZhdGUgU1lOQ19JTlRFUlZBTDogbnVtYmVyO1xuXHRwcml2YXRlIHJhdGVMaW1pdGVyOiBSYXRlTGltaXRlck1lbW9yeSB8IG51bGw7XG5cdHByaXZhdGUgYmxhY2tsaXN0S2V5ID0gJ2lwQmxhY2tsaXN0Jztcblx0cHJpdmF0ZSB3aGl0ZWxpc3RLZXkgPSAnaXBXaGl0ZWxpc3QnO1xuXHRwcml2YXRlIHJhdGVMaW1pdFByZWZpeCA9ICdyYXRlTGltaXRfJztcblx0cHJpdmF0ZSBibGFja2xpc3Q6IHN0cmluZ1tdID0gW107XG5cdHByaXZhdGUgd2hpdGVsaXN0OiBzdHJpbmdbXSA9IFtdO1xuXHRwcml2YXRlIGdsb2JhbFJhdGVMaW1pdFN0YXRzOiBNYXA8c3RyaW5nLCBudW1iZXI+ID0gbmV3IE1hcCgpO1xuXG5cdHByaXZhdGUgY29uc3RydWN0b3IoXG5cdFx0bG9nZ2VyOiBBcHBMb2dnZXJTZXJ2aWNlSW50ZXJmYWNlLFxuXHRcdGVycm9yTG9nZ2VyOiBFcnJvckxvZ2dlclNlcnZpY2VJbnRlcmZhY2UsXG5cdFx0ZXJyb3JIYW5kbGVyOiBFcnJvckhhbmRsZXJTZXJ2aWNlSW50ZXJmYWNlLFxuXHRcdGVudkNvbmZpZzogRW52Q29uZmlnU2VydmljZUludGVyZmFjZSxcblx0XHRjYWNoZVNlcnZpY2U6IENhY2hlU2VydmljZUludGVyZmFjZSxcblx0XHRyZWRpc1NlcnZpY2U6IFJlZGlzU2VydmljZUludGVyZmFjZSxcblx0XHRyZXNvdXJjZU1hbmFnZXI6IFJlc291cmNlTWFuYWdlckludGVyZmFjZVxuXHQpIHtcblx0XHR0aGlzLmxvZ2dlciA9IGxvZ2dlcjtcblx0XHR0aGlzLmVycm9yTG9nZ2VyID0gZXJyb3JMb2dnZXI7XG5cdFx0dGhpcy5lcnJvckhhbmRsZXIgPSBlcnJvckhhbmRsZXI7XG5cdFx0dGhpcy5lbnZDb25maWcgPSBlbnZDb25maWc7XG5cdFx0dGhpcy5jYWNoZVNlcnZpY2UgPSBjYWNoZVNlcnZpY2U7XG5cdFx0dGhpcy5yZWRpc1NlcnZpY2UgPSByZWRpc1NlcnZpY2U7XG5cdFx0dGhpcy5yZXNvdXJjZU1hbmFnZXIgPSByZXNvdXJjZU1hbmFnZXI7XG5cblx0XHR0aGlzLlJBVEVfTElNSVRfQkFTRV9QT0lOVFMgPSBOdW1iZXIoXG5cdFx0XHR0aGlzLmVudkNvbmZpZy5nZXRFbnZWYXJpYWJsZSgncmF0ZUxpbWl0ZXJCYXNlUG9pbnRzJylcblx0XHQpO1xuXHRcdHRoaXMuUkFURV9MSU1JVF9CQVNFX0RVUkFUSU9OID0gTnVtYmVyKFxuXHRcdFx0dGhpcy5lbnZDb25maWcuZ2V0RW52VmFyaWFibGUoJ3JhdGVMaW1pdGVyQmFzZUR1cmF0aW9uJylcblx0XHQpO1xuXHRcdHRoaXMuU1lOQ19JTlRFUlZBTCA9XG5cdFx0XHROdW1iZXIodGhpcy5lbnZDb25maWcuZ2V0RW52VmFyaWFibGUoJ2JsYWNrbGlzdFN5bmNJbnRlcnZhbCcpKSB8fFxuXHRcdFx0MzYwMDAwMDtcblxuXHRcdHRoaXMucmF0ZUxpbWl0ZXIgPSBuZXcgUmF0ZUxpbWl0ZXJNZW1vcnkoe1xuXHRcdFx0cG9pbnRzOiB0aGlzLlJBVEVfTElNSVRfQkFTRV9QT0lOVFMsXG5cdFx0XHRkdXJhdGlvbjogdGhpcy5SQVRFX0xJTUlUX0JBU0VfRFVSQVRJT05cblx0XHR9KTtcblx0XHR0aGlzLnByZUluaXRJcEJsYWNrbGlzdCgpO1xuXHRcdHRoaXMucHJlSW5pdElwV2hpdGVsaXN0KCk7XG5cblx0XHRzZXRJbnRlcnZhbChcblx0XHRcdCgpID0+IHRoaXMuc3luY0JsYWNrbGlzdEZyb21SZWRpc1RvRmlsZSgpLFxuXHRcdFx0dGhpcy5TWU5DX0lOVEVSVkFMXG5cdFx0KTtcblx0fVxuXG5cdHB1YmxpYyBzdGF0aWMgYXN5bmMgZ2V0SW5zdGFuY2UoKTogUHJvbWlzZTxHYXRla2VlcGVyU2VydmljZT4ge1xuXHRcdGlmICghR2F0ZWtlZXBlclNlcnZpY2UuaW5zdGFuY2UpIHtcblx0XHRcdGNvbnN0IGxvZ2dlciA9IGF3YWl0IExvZ2dlclNlcnZpY2VGYWN0b3J5LmdldExvZ2dlclNlcnZpY2UoKTtcblx0XHRcdGNvbnN0IGVycm9yTG9nZ2VyID1cblx0XHRcdFx0YXdhaXQgTG9nZ2VyU2VydmljZUZhY3RvcnkuZ2V0RXJyb3JMb2dnZXJTZXJ2aWNlKCk7XG5cdFx0XHRjb25zdCBlcnJvckhhbmRsZXIgPVxuXHRcdFx0XHRhd2FpdCBFcnJvckhhbmRsZXJTZXJ2aWNlRmFjdG9yeS5nZXRFcnJvckhhbmRsZXJTZXJ2aWNlKCk7XG5cdFx0XHRjb25zdCBlbnZDb25maWcgPVxuXHRcdFx0XHRhd2FpdCBFbnZDb25maWdTZXJ2aWNlRmFjdG9yeS5nZXRFbnZDb25maWdTZXJ2aWNlKCk7XG5cdFx0XHRjb25zdCBjYWNoZVNlcnZpY2UgPVxuXHRcdFx0XHRhd2FpdCBDYWNoZUxheWVyU2VydmljZUZhY3RvcnkuZ2V0Q2FjaGVTZXJ2aWNlKCk7XG5cdFx0XHRjb25zdCByZWRpc1NlcnZpY2UgPVxuXHRcdFx0XHRhd2FpdCBDYWNoZUxheWVyU2VydmljZUZhY3RvcnkuZ2V0UmVkaXNTZXJ2aWNlKCk7XG5cdFx0XHRjb25zdCByZXNvdXJjZU1hbmFnZXIgPVxuXHRcdFx0XHRhd2FpdCBSZXNvdXJjZU1hbmFnZXJGYWN0b3J5LmdldFJlc291cmNlTWFuYWdlcigpO1xuXG5cdFx0XHRHYXRla2VlcGVyU2VydmljZS5pbnN0YW5jZSA9IG5ldyBHYXRla2VlcGVyU2VydmljZShcblx0XHRcdFx0bG9nZ2VyLFxuXHRcdFx0XHRlcnJvckxvZ2dlcixcblx0XHRcdFx0ZXJyb3JIYW5kbGVyLFxuXHRcdFx0XHRlbnZDb25maWcsXG5cdFx0XHRcdGNhY2hlU2VydmljZSxcblx0XHRcdFx0cmVkaXNTZXJ2aWNlLFxuXHRcdFx0XHRyZXNvdXJjZU1hbmFnZXJcblx0XHRcdCk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIEdhdGVrZWVwZXJTZXJ2aWNlLmluc3RhbmNlO1xuXHR9XG5cblx0cHVibGljIGFzeW5jIGluaXRpYWxpemUoKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0YXdhaXQgUHJvbWlzZS5hbGwoW3RoaXMubG9hZElwQmxhY2tsaXN0KCksIHRoaXMubG9hZFdoaXRlbGlzdCgpXSk7XG5cdFx0dGhpcy5yZXNldEdsb2JhbFJhdGVMaW1pdFN0YXRzKCk7XG5cdFx0YXdhaXQgdGhpcy5zeW5jQmxhY2tsaXN0RnJvbVJlZGlzVG9GaWxlKCk7XG5cdH1cblxuXHRwdWJsaWMgYXN5bmMgZHluYW1pY1JhdGVMaW1pdGVyKCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdGlmICghdGhpcy5yYXRlTGltaXRlcikge1xuXHRcdFx0dGhpcy5yYXRlTGltaXRlciA9IG5ldyBSYXRlTGltaXRlck1lbW9yeSh7XG5cdFx0XHRcdHBvaW50czogdGhpcy5SQVRFX0xJTUlUX0JBU0VfUE9JTlRTLFxuXHRcdFx0XHRkdXJhdGlvbjogdGhpcy5SQVRFX0xJTUlUX0JBU0VfRFVSQVRJT05cblx0XHRcdH0pO1xuXHRcdH1cblxuXHRcdGNvbnN0IGNwdVVzYWdlID0gdGhpcy5jYWxjdWxhdGVDcHVVc2FnZSgpO1xuXHRcdGNvbnN0IG1lbW9yeVVzYWdlID0gdGhpcy5yZXNvdXJjZU1hbmFnZXIuZ2V0TWVtb3J5VXNhZ2UoKVxuXHRcdFx0LmhlYXBVc2VkUGVyY2VudGFnZSBhcyBudW1iZXI7XG5cblx0XHRjb25zdCBhZGp1c3RlZFBvaW50cyA9IHRoaXMuYWRqdXN0UmF0ZUxpbWl0QmFzZWRPblJlc291cmNlcyhcblx0XHRcdGNwdVVzYWdlLFxuXHRcdFx0bWVtb3J5VXNhZ2Vcblx0XHQpO1xuXG5cdFx0dGhpcy5yYXRlTGltaXRlci5wb2ludHMgPSBhZGp1c3RlZFBvaW50cztcblx0fVxuXG5cdHByaXZhdGUgdXBkYXRlR2xvYmFsUmF0ZUxpbWl0U3RhdHMoXG5cdFx0aXA6IHN0cmluZyxcblx0XHRyZW1haW5pbmdQb2ludHM6IG51bWJlclxuXHQpOiB2b2lkIHtcblx0XHR0aGlzLmdsb2JhbFJhdGVMaW1pdFN0YXRzLnNldChpcCwgcmVtYWluaW5nUG9pbnRzKTtcblx0fVxuXG5cdHByaXZhdGUgcmVzZXRHbG9iYWxSYXRlTGltaXRTdGF0cygpOiB2b2lkIHtcblx0XHRzZXRJbnRlcnZhbCgoKSA9PiB0aGlzLmdsb2JhbFJhdGVMaW1pdFN0YXRzLmNsZWFyKCksIDYwMDAwKTtcblx0XHR0aGlzLmxvZ2dlci5pbmZvKCdHbG9iYWwgcmF0ZSBsaW1pdCBzdGF0cyByZXNldC4nKTtcblx0fVxuXG5cdHByaXZhdGUgY2FsY3VsYXRlQ3B1VXNhZ2UoKTogbnVtYmVyIHtcblx0XHRjb25zdCBjcHVVc2FnZXMgPSB0aGlzLnJlc291cmNlTWFuYWdlclxuXHRcdFx0LmdldENwdVVzYWdlKClcblx0XHRcdC5tYXAoY3B1ID0+IHBhcnNlRmxvYXQoY3B1LnVzYWdlKSk7XG5cdFx0cmV0dXJuIGNwdVVzYWdlcy5yZWR1Y2UoKGEsIGIpID0+IGEgKyBiLCAwKSAvIGNwdVVzYWdlcy5sZW5ndGg7XG5cdH1cblxuXHRwcml2YXRlIGFkanVzdFJhdGVMaW1pdEJhc2VkT25SZXNvdXJjZXMoXG5cdFx0Y3B1OiBudW1iZXIsXG5cdFx0bWVtb3J5OiBudW1iZXJcblx0KTogbnVtYmVyIHtcblx0XHRpZiAoY3B1ID4gODAgfHwgbWVtb3J5ID4gODApIHtcblx0XHRcdHRoaXMubG9nZ2VyLndhcm4oXG5cdFx0XHRcdGBIaWdoIHJlc291cmNlIHVzYWdlIGRldGVjdGVkLiBDUFU6ICR7Y3B1fSUsIE1lbW9yeTogJHttZW1vcnl9JWBcblx0XHRcdCk7XG5cdFx0XHRyZXR1cm4gTWF0aC5tYXgoMSwgdGhpcy5SQVRFX0xJTUlUX0JBU0VfUE9JTlRTIC8gMik7XG5cdFx0fVxuXHRcdHJldHVybiB0aGlzLlJBVEVfTElNSVRfQkFTRV9QT0lOVFM7XG5cdH1cblxuXHRwdWJsaWMgcmF0ZUxpbWl0TWlkZGxld2FyZSgpIHtcblx0XHRyZXR1cm4gYXN5bmMgKFxuXHRcdFx0cmVxOiBSZXF1ZXN0LFxuXHRcdFx0cmVzOiBSZXNwb25zZSxcblx0XHRcdG5leHQ6IE5leHRGdW5jdGlvblxuXHRcdCk6IFByb21pc2U8dm9pZD4gPT4ge1xuXHRcdFx0Y29uc3QgaXAgPSByZXEuaXAgfHwgJ3Vua25vd24nO1xuXHRcdFx0Y29uc3QgcmF0ZUxpbWl0S2V5ID0gYCR7dGhpcy5yYXRlTGltaXRQcmVmaXh9JHtpcH1gO1xuXG5cdFx0XHRpZiAoIXRoaXMucmF0ZUxpbWl0ZXIpIHtcblx0XHRcdFx0dGhpcy5yYXRlTGltaXRlciA9IG5ldyBSYXRlTGltaXRlck1lbW9yeSh7XG5cdFx0XHRcdFx0cG9pbnRzOiB0aGlzLlJBVEVfTElNSVRfQkFTRV9QT0lOVFMsXG5cdFx0XHRcdFx0ZHVyYXRpb246IHRoaXMuUkFURV9MSU1JVF9CQVNFX0RVUkFUSU9OXG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAodGhpcy53aGl0ZWxpc3QuaW5jbHVkZXMoaXApKSB7XG5cdFx0XHRcdHJldHVybiBuZXh0KCk7XG5cdFx0XHR9XG5cblx0XHRcdHRyeSB7XG5cdFx0XHRcdGxldCByYXRlTGltaXRJbmZvID0gYXdhaXQgdGhpcy5jYWNoZVNlcnZpY2UuZ2V0PG51bWJlcj4oXG5cdFx0XHRcdFx0cmF0ZUxpbWl0S2V5LFxuXHRcdFx0XHRcdCdib3VuY2VyU2VydmljZSdcblx0XHRcdFx0KTtcblxuXHRcdFx0XHRpZiAocmF0ZUxpbWl0SW5mbyA9PT0gbnVsbCkge1xuXHRcdFx0XHRcdHJhdGVMaW1pdEluZm8gPVxuXHRcdFx0XHRcdFx0YXdhaXQgdGhpcy5yZWRpc1NlcnZpY2UuZ2V0PG51bWJlcj4ocmF0ZUxpbWl0S2V5KTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmIChyYXRlTGltaXRJbmZvID09PSBudWxsKSB7XG5cdFx0XHRcdFx0Y29uc3QgcmF0ZUxpbWl0UmVzID0gYXdhaXQgdGhpcy5yYXRlTGltaXRlci5jb25zdW1lKGlwKTtcblx0XHRcdFx0XHRyYXRlTGltaXRJbmZvID0gcmF0ZUxpbWl0UmVzLnJlbWFpbmluZ1BvaW50cztcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmIChyYXRlTGltaXRJbmZvIDw9IDIpIHtcblx0XHRcdFx0XHRyZXR1cm4gdGhpcy50cmlnZ2VyUmF0ZUxpbWl0V2FybmluZyhcblx0XHRcdFx0XHRcdGlwLFxuXHRcdFx0XHRcdFx0cmF0ZUxpbWl0SW5mbyxcblx0XHRcdFx0XHRcdG5leHRcblx0XHRcdFx0XHQpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0YXdhaXQgdGhpcy5jYWNoZVNlcnZpY2Uuc2V0KFxuXHRcdFx0XHRcdHJhdGVMaW1pdEtleSxcblx0XHRcdFx0XHRyYXRlTGltaXRJbmZvLFxuXHRcdFx0XHRcdCdib3VuY2VyU2VydmljZScsXG5cdFx0XHRcdFx0NjBcblx0XHRcdFx0KTtcblx0XHRcdFx0YXdhaXQgdGhpcy5pbmNyZW1lbnRSYXRlTGltaXQoaXApO1xuXHRcdFx0XHRuZXh0KCk7XG5cdFx0XHR9IGNhdGNoIChlcnJvcikge1xuXHRcdFx0XHR0aGlzLmhhbmRsZURlcGVuZGVuY3lFcnJvcihcblx0XHRcdFx0XHQncmF0ZUxpbWl0TWlkZGxld2FyZScsXG5cdFx0XHRcdFx0ZXJyb3IsXG5cdFx0XHRcdFx0cmVxLFxuXHRcdFx0XHRcdHJlcyxcblx0XHRcdFx0XHRuZXh0XG5cdFx0XHRcdCk7XG5cdFx0XHR9XG5cdFx0fTtcblx0fVxuXG5cdHByaXZhdGUgdHJpZ2dlclJhdGVMaW1pdFdhcm5pbmcoXG5cdFx0aXA6IHN0cmluZyxcblx0XHRwb2ludHM6IG51bWJlcixcblx0XHRuZXh0OiBOZXh0RnVuY3Rpb25cblx0KTogdm9pZCB7XG5cdFx0dGhpcy5sb2dnZXIuaW5mbyhcblx0XHRcdGBSYXRlIGxpbWl0IHdhcm5pbmcgZm9yIElQICR7aXB9LiBSZW1haW5pbmcgcG9pbnRzOiAke3BvaW50c31gXG5cdFx0KTtcblx0XHRuZXh0KG5ldyB0aGlzLmVycm9ySGFuZGxlci5FcnJvckNsYXNzZXMuUmF0ZUxpbWl0RXJyb3JXYXJuaW5nKHBvaW50cykpO1xuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyBpbmNyZW1lbnRSYXRlTGltaXQoaXA6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuXHRcdGNvbnN0IHJhdGVMaW1pdEtleSA9IGAke3RoaXMucmF0ZUxpbWl0UHJlZml4fSR7aXB9YDtcblx0XHRjb25zdCBiYXNlUG9pbnRzID0gTnVtYmVyKFxuXHRcdFx0dGhpcy5lbnZDb25maWcuZ2V0RW52VmFyaWFibGUoJ3JhdGVMaW1pdGVyQmFzZVBvaW50cycpXG5cdFx0KTtcblx0XHRjb25zdCBiYXNlRHVyYXRpb24gPSBOdW1iZXIoXG5cdFx0XHR0aGlzLmVudkNvbmZpZy5nZXRFbnZWYXJpYWJsZSgncmF0ZUxpbWl0ZXJCYXNlRHVyYXRpb24nKVxuXHRcdCk7XG5cblx0XHR0cnkge1xuXHRcdFx0bGV0IGN1cnJlbnRQb2ludHMgPSBhd2FpdCB0aGlzLmNhY2hlU2VydmljZS5nZXQ8bnVtYmVyPihcblx0XHRcdFx0cmF0ZUxpbWl0S2V5LFxuXHRcdFx0XHQnYm91bmNlclNlcnZpY2UnXG5cdFx0XHQpO1xuXG5cdFx0XHRpZiAoY3VycmVudFBvaW50cyA9PT0gbnVsbCkge1xuXHRcdFx0XHRjdXJyZW50UG9pbnRzID1cblx0XHRcdFx0XHQoYXdhaXQgdGhpcy5yZWRpc1NlcnZpY2UuZ2V0PG51bWJlcj4ocmF0ZUxpbWl0S2V5KSkgPz9cblx0XHRcdFx0XHRiYXNlUG9pbnRzO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoY3VycmVudFBvaW50cyA+IDApIHtcblx0XHRcdFx0Y3VycmVudFBvaW50cyAtPSAxO1xuXHRcdFx0XHRhd2FpdCB0aGlzLnJlZGlzU2VydmljZS5zZXQoXG5cdFx0XHRcdFx0cmF0ZUxpbWl0S2V5LFxuXHRcdFx0XHRcdGN1cnJlbnRQb2ludHMsXG5cdFx0XHRcdFx0YmFzZUR1cmF0aW9uXG5cdFx0XHRcdCk7XG5cdFx0XHRcdGF3YWl0IHRoaXMuY2FjaGVTZXJ2aWNlLnNldChcblx0XHRcdFx0XHRyYXRlTGltaXRLZXksXG5cdFx0XHRcdFx0Y3VycmVudFBvaW50cyxcblx0XHRcdFx0XHQnYm91bmNlclNlcnZpY2UnLFxuXHRcdFx0XHRcdDYwXG5cdFx0XHRcdCk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRjb25zdCBiYWNrb2ZmTXVsdGlwbGllciA9XG5cdFx0XHRcdFx0KGF3YWl0IHRoaXMucmVkaXNTZXJ2aWNlLmdldDxudW1iZXI+KGBiYWNrb2ZmXyR7aXB9YCkpIHx8IDE7XG5cdFx0XHRcdGNvbnN0IG5ld0R1cmF0aW9uID0gYmFzZUR1cmF0aW9uICogYmFja29mZk11bHRpcGxpZXI7XG5cdFx0XHRcdGF3YWl0IHRoaXMucmVkaXNTZXJ2aWNlLnNldChcblx0XHRcdFx0XHRyYXRlTGltaXRLZXksXG5cdFx0XHRcdFx0YmFzZVBvaW50cyxcblx0XHRcdFx0XHRuZXdEdXJhdGlvblxuXHRcdFx0XHQpO1xuXHRcdFx0XHRhd2FpdCB0aGlzLmNhY2hlU2VydmljZS5zZXQoXG5cdFx0XHRcdFx0cmF0ZUxpbWl0S2V5LFxuXHRcdFx0XHRcdGJhc2VQb2ludHMsXG5cdFx0XHRcdFx0J2JvdW5jZXJTZXJ2aWNlJyxcblx0XHRcdFx0XHQ2MFxuXHRcdFx0XHQpO1xuXHRcdFx0XHRhd2FpdCB0aGlzLnJlZGlzU2VydmljZS5zZXQoXG5cdFx0XHRcdFx0YGJhY2tvZmZfJHtpcH1gLFxuXHRcdFx0XHRcdGJhY2tvZmZNdWx0aXBsaWVyICsgMVxuXHRcdFx0XHQpO1xuXHRcdFx0XHR0aGlzLmxvZ2dlci5pbmZvKFxuXHRcdFx0XHRcdGBFeHBvbmVudGlhbCBiYWNrb2ZmIGFwcGxpZWQgZm9yIElQICR7aXB9OiAke25ld0R1cmF0aW9ufSBtc2Bcblx0XHRcdFx0KTtcblx0XHRcdH1cblxuXHRcdFx0dGhpcy51cGRhdGVHbG9iYWxSYXRlTGltaXRTdGF0cyhpcCwgY3VycmVudFBvaW50cyk7XG5cdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdHRoaXMubG9nZ2VyLmVycm9yKFxuXHRcdFx0XHRgRmFpbGVkIHRvIGluY3JlbWVudCByYXRlIGxpbWl0IGZvciBJUCAke2lwfTogJHtlcnJvcn1gXG5cdFx0XHQpO1xuXHRcdH1cblx0fVxuXG5cdHB1YmxpYyBzbG93ZG93bk1pZGRsZXdhcmUoKSB7XG5cdFx0Y29uc3Qgc2xvd2Rvd25UaHJlc2hvbGQgPSBOdW1iZXIoXG5cdFx0XHR0aGlzLmVudkNvbmZpZy5nZXRFbnZWYXJpYWJsZSgnc2xvd2Rvd25UaHJlc2hvbGQnKVxuXHRcdCk7XG5cdFx0cmV0dXJuIChcblx0XHRcdHJlcTogUmVxdWVzdCAmIHsgc2Vzc2lvbjogU2Vzc2lvbiAmIHsgbGFzdFJlcXVlc3RUaW1lPzogbnVtYmVyIH0gfSxcblx0XHRcdHJlczogUmVzcG9uc2UsXG5cdFx0XHRuZXh0OiBOZXh0RnVuY3Rpb25cblx0XHQpOiB2b2lkID0+IHtcblx0XHRcdGNvbnN0IHJlcXVlc3RUaW1lID0gRGF0ZS5ub3coKTtcblx0XHRcdHRoaXMuaGFuZGxlU2xvd2Rvd24ocmVxLCByZXMsIG5leHQsIHJlcXVlc3RUaW1lLCBzbG93ZG93blRocmVzaG9sZCk7XG5cdFx0fTtcblx0fVxuXG5cdHByaXZhdGUgaGFuZGxlU2xvd2Rvd24oXG5cdFx0cmVxOiBSZXF1ZXN0ICYgeyBzZXNzaW9uOiBTZXNzaW9uICYgeyBsYXN0UmVxdWVzdFRpbWU/OiBudW1iZXIgfSB9LFxuXHRcdHJlczogUmVzcG9uc2UsXG5cdFx0bmV4dDogTmV4dEZ1bmN0aW9uLFxuXHRcdHJlcXVlc3RUaW1lOiBudW1iZXIsXG5cdFx0c2xvd2Rvd25UaHJlc2hvbGQ6IG51bWJlclxuXHQpOiB2b2lkIHtcblx0XHRpZiAoIXJlcS5zZXNzaW9uKSByZXR1cm4gbmV4dCgpO1xuXG5cdFx0Y29uc3QgdGltZURpZmYgPSByZXF1ZXN0VGltZSAtIChyZXEuc2Vzc2lvbi5sYXN0UmVxdWVzdFRpbWUgfHwgMCk7XG5cdFx0cmVxLnNlc3Npb24ubGFzdFJlcXVlc3RUaW1lID0gcmVxdWVzdFRpbWU7XG5cblx0XHRpZiAodGltZURpZmYgPCBzbG93ZG93blRocmVzaG9sZCkge1xuXHRcdFx0Y29uc3Qgd2FpdFRpbWUgPSBzbG93ZG93blRocmVzaG9sZCAtIHRpbWVEaWZmO1xuXHRcdFx0dGhpcy5sb2dnZXIud2Fybihcblx0XHRcdFx0YFJhcGlkIHJlcXVlc3QgZGV0ZWN0ZWQgZnJvbSBJUDogJHtyZXEuaXB9LiBEZWxheWluZyByZXNwb25zZSBieSAke3dhaXRUaW1lfSBtc2Bcblx0XHRcdCk7XG5cdFx0XHRzZXRUaW1lb3V0KCgpID0+IG5leHQoKSwgd2FpdFRpbWUpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRuZXh0KCk7XG5cdFx0fVxuXHR9XG5cblx0cHVibGljIHRocm90dGxlUmVxdWVzdHMoKTogKFxuXHRcdHJlcTogUmVxdWVzdCxcblx0XHRyZXM6IFJlc3BvbnNlLFxuXHRcdG5leHQ6IE5leHRGdW5jdGlvblxuXHQpID0+IFByb21pc2U8dm9pZCB8IFJlc3BvbnNlPiB7XG5cdFx0cmV0dXJuIGFzeW5jIChyZXE6IFJlcXVlc3QsIHJlczogUmVzcG9uc2UsIG5leHQ6IE5leHRGdW5jdGlvbikgPT4ge1xuXHRcdFx0dHJ5IHtcblx0XHRcdFx0Y29uc3QgdG9vQnVzeSA9IChhd2FpdCBpbXBvcnQoJ3Rvb2J1c3ktanMnKSkuZGVmYXVsdDtcblx0XHRcdFx0aWYgKHRvb0J1c3koKSkge1xuXHRcdFx0XHRcdHRoaXMubG9nZ2VyLndhcm4oXG5cdFx0XHRcdFx0XHRgU2VydmVyIHRvbyBidXN5LCBibG9ja2luZyByZXF1ZXN0IGZyb20gJHtyZXEuaXB9YFxuXHRcdFx0XHRcdCk7XG5cdFx0XHRcdFx0cmV0dXJuIHJlc1xuXHRcdFx0XHRcdFx0LnN0YXR1cyg1MDMpXG5cdFx0XHRcdFx0XHQuanNvbih7IGVycm9yOiAnU2VydmVyIHRvbyBidXN5LCB0cnkgYWdhaW4gbGF0ZXIuJyB9KTtcblx0XHRcdFx0fVxuXHRcdFx0XHRyZXR1cm4gbmV4dCgpO1xuXHRcdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdFx0dGhpcy5oYW5kbGVEZXBlbmRlbmN5RXJyb3IoXG5cdFx0XHRcdFx0J3Rocm90dGxlUmVxdWVzdHMnLFxuXHRcdFx0XHRcdGVycm9yLFxuXHRcdFx0XHRcdHJlcSxcblx0XHRcdFx0XHRyZXMsXG5cdFx0XHRcdFx0bmV4dFxuXHRcdFx0XHQpO1xuXHRcdFx0fVxuXHRcdH07XG5cdH1cblxuXHRwdWJsaWMgaXBCbGFja2xpc3RNaWRkbGV3YXJlKCk6IChcblx0XHRyZXE6IFJlcXVlc3QsXG5cdFx0cmVzOiBSZXNwb25zZSxcblx0XHRuZXh0OiBOZXh0RnVuY3Rpb25cblx0KSA9PiBQcm9taXNlPHZvaWQ+IHtcblx0XHRyZXR1cm4gYXN5bmMgKFxuXHRcdFx0cmVxOiBSZXF1ZXN0LFxuXHRcdFx0cmVzOiBSZXNwb25zZSxcblx0XHRcdG5leHQ6IE5leHRGdW5jdGlvblxuXHRcdCk6IFByb21pc2U8dm9pZD4gPT4ge1xuXHRcdFx0Y29uc3QgY2xpZW50SXAgPSByZXEuaXA7XG5cblx0XHRcdGlmICghY2xpZW50SXApIHtcblx0XHRcdFx0cmVzLnN0YXR1cyg1MDApLmpzb24oeyBlcnJvcjogJ0JhZCByZXF1ZXN0JyB9KTtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAodGhpcy53aGl0ZWxpc3QuaW5jbHVkZXMoY2xpZW50SXApKSB7XG5cdFx0XHRcdHJldHVybiBuZXh0KCk7XG5cdFx0XHR9XG5cblx0XHRcdHRyeSB7XG5cdFx0XHRcdGlmIChhd2FpdCB0aGlzLmlzVGVtcG9yYXJpbHlCbGFja2xpc3RlZChjbGllbnRJcCkpIHtcblx0XHRcdFx0XHR0aGlzLmxvZ2dlci5pbmZvKFxuXHRcdFx0XHRcdFx0YFRlbXBvcmFyaWx5IGJsb2NrZWQgcmVxdWVzdCBmcm9tIElQOiAke2NsaWVudElwfWBcblx0XHRcdFx0XHQpO1xuXG5cdFx0XHRcdFx0cmVzLnN0YXR1cyg0MDMpLmpzb24oe1xuXHRcdFx0XHRcdFx0ZXJyb3I6ICdBY2Nlc3MgdGVtcG9yYXJpbHkgZGVuaWVkLidcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAodGhpcy5ibGFja2xpc3QuaW5jbHVkZXMoY2xpZW50SXApKSB7XG5cdFx0XHRcdFx0dGhpcy5sb2dnZXIuaW5mbyhcblx0XHRcdFx0XHRcdGBCbG9ja2VkIHJlcXVlc3QgZnJvbSBibGFja2xpc3RlZCBJUDogJHtjbGllbnRJcH1gXG5cdFx0XHRcdFx0KTtcblx0XHRcdFx0XHRyZXMuc3RhdHVzKDQwMykuanNvbih7IGVycm9yOiAnQWNjZXNzIGRlbmllZCcgfSk7XG5cdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0bmV4dCgpO1xuXHRcdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdFx0dGhpcy5sb2dnZXIuZXJyb3IoYEVycm9yIGluIElQIGJsYWNrbGlzdCBtaWRkbGV3YXJlOiAke2Vycm9yfWApO1xuXHRcdFx0XHRyZXMuc3RhdHVzKDUwMCkuanNvbih7IGVycm9yOiAnSW50ZXJuYWwgc2VydmVyIGVycm9yJyB9KTtcblx0XHRcdH1cblx0XHR9O1xuXHR9XG5cblx0cHVibGljIGFzeW5jIGxvYWRJcEJsYWNrbGlzdCgpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHR0cnkge1xuXHRcdFx0bGV0IGNhY2hlZEJsYWNrbGlzdCA9IGF3YWl0IHRoaXMuY2FjaGVTZXJ2aWNlLmdldDxzdHJpbmdbXT4oXG5cdFx0XHRcdHRoaXMuYmxhY2tsaXN0S2V5LFxuXHRcdFx0XHQnYm91bmNlclNlcnZpY2UnXG5cdFx0XHQpO1xuXG5cdFx0XHRpZiAoIWNhY2hlZEJsYWNrbGlzdCkge1xuXHRcdFx0XHR0aGlzLmxvZ2dlci5pbmZvKFxuXHRcdFx0XHRcdCdJUCBibGFja2xpc3Qgbm90IGZvdW5kIGluIGNhY2hlLCByZXRyaWV2aW5nIGZyb20gUmVkaXMuLi4nXG5cdFx0XHRcdCk7XG5cdFx0XHRcdGNhY2hlZEJsYWNrbGlzdCA9IGF3YWl0IHRoaXMucmVkaXNTZXJ2aWNlLmdldDxzdHJpbmdbXT4oXG5cdFx0XHRcdFx0dGhpcy5ibGFja2xpc3RLZXlcblx0XHRcdFx0KTtcblxuXHRcdFx0XHRpZiAoIWNhY2hlZEJsYWNrbGlzdCkge1xuXHRcdFx0XHRcdHRoaXMubG9nZ2VyLmluZm8oXG5cdFx0XHRcdFx0XHQnSVAgYmxhY2tsaXN0IG5vdCBmb3VuZCBpbiBSZWRpcywgbG9hZGluZyBmcm9tIGZpbGUuLi4nXG5cdFx0XHRcdFx0KTtcblx0XHRcdFx0XHRhd2FpdCB0aGlzLmxvYWRJcEJsYWNrbGlzdEZyb21GaWxlKCk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0YXdhaXQgdGhpcy5jYWNoZVNlcnZpY2Uuc2V0KFxuXHRcdFx0XHRcdFx0dGhpcy5ibGFja2xpc3RLZXksXG5cdFx0XHRcdFx0XHRjYWNoZWRCbGFja2xpc3QsXG5cdFx0XHRcdFx0XHQnYm91bmNlclNlcnZpY2UnLFxuXHRcdFx0XHRcdFx0MzYwMFxuXHRcdFx0XHRcdCk7XG5cdFx0XHRcdFx0dGhpcy5ibGFja2xpc3QgPSBjYWNoZWRCbGFja2xpc3Q7XG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRoaXMuYmxhY2tsaXN0ID0gY2FjaGVkQmxhY2tsaXN0O1xuXHRcdFx0fVxuXHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHR0aGlzLmxvZ2dlci5lcnJvcihcblx0XHRcdFx0YEVycm9yIGxvYWRpbmcgSVAgYmxhY2tsaXN0OiAke2Vycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogJ1Vua25vd24gZXJyb3InfWBcblx0XHRcdCk7XG5cdFx0XHRhd2FpdCB0aGlzLmxvYWRJcEJsYWNrbGlzdEZyb21GaWxlKCk7XG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyBsb2FkV2hpdGVsaXN0KCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdHRoaXMud2hpdGVsaXN0ID0gdGhpcy5lbnZDb25maWdcblx0XHRcdC5nZXRFbnZWYXJpYWJsZSgnaXBXaGl0ZWxpc3RQYXRoJylcblx0XHRcdC5zcGxpdCgnLCcpO1xuXHRcdHRoaXMubG9nZ2VyLmluZm8oXG5cdFx0XHRgV2hpdGVsaXN0IGluaXRpYWxpemVkIHdpdGggJHt0aGlzLndoaXRlbGlzdC5sZW5ndGh9IElQcy5gXG5cdFx0KTtcblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgc2F2ZUlwQmxhY2tsaXN0KCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdHRyeSB7XG5cdFx0XHRhd2FpdCB0aGlzLnJlZGlzU2VydmljZS5zZXQodGhpcy5ibGFja2xpc3RLZXksIHRoaXMuYmxhY2tsaXN0KTtcblx0XHRcdGF3YWl0IHRoaXMuY2FjaGVTZXJ2aWNlLnNldChcblx0XHRcdFx0dGhpcy5ibGFja2xpc3RLZXksXG5cdFx0XHRcdHRoaXMuYmxhY2tsaXN0LFxuXHRcdFx0XHQnYm91bmNlclNlcnZpY2UnLFxuXHRcdFx0XHQzNjAwXG5cdFx0XHQpO1xuXHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHR0aGlzLmxvZ2dlci5lcnJvcihgRXJyb3Igc2F2aW5nIElQIGJsYWNrbGlzdCB0byBSZWRpczogJHtlcnJvcn1gKTtcblx0XHR9XG5cdFx0YXdhaXQgdGhpcy5zYXZlSXBCbGFja2xpc3RUb0ZpbGUoKTtcblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgbG9hZElwQmxhY2tsaXN0RnJvbUZpbGUoKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0Y29uc3QgZmlsZVBhdGggPSB0aGlzLmdldEZpbGVQYXRoKCdzZXJ2ZXJEYXRhRmlsZVBhdGgxJyk7XG5cdFx0YXdhaXQgdGhpcy5jb25jdXJyZW50RmlsZUFjY2Vzc1NhZmV0eShhc3luYyAoKSA9PiB7XG5cdFx0XHR0cnkge1xuXHRcdFx0XHRpZiAoZnMuZXhpc3RzU3luYyhmaWxlUGF0aCkpIHtcblx0XHRcdFx0XHR0aGlzLmJsYWNrbGlzdCA9IEpTT04ucGFyc2UoXG5cdFx0XHRcdFx0XHRmcy5yZWFkRmlsZVN5bmMoZmlsZVBhdGgsICd1dGY4Jylcblx0XHRcdFx0XHQpO1xuXHRcdFx0XHR9XG5cdFx0XHR9IGNhdGNoIChlcnJvcikge1xuXHRcdFx0XHR0aGlzLmxvZ2dlci5lcnJvcihcblx0XHRcdFx0XHRgRXJyb3IgbG9hZGluZyBJUCBibGFja2xpc3QgZnJvbSBmaWxlOiAke2Vycm9yfWBcblx0XHRcdFx0KTtcblx0XHRcdH1cblx0XHR9KTtcblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgc2F2ZUlwQmxhY2tsaXN0VG9GaWxlKCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdGNvbnN0IGZpbGVQYXRoID0gdGhpcy5nZXRGaWxlUGF0aCgnc2VydmVyRGF0YUZpbGVQYXRoMicpO1xuXHRcdGF3YWl0IHRoaXMuY29uY3VycmVudEZpbGVBY2Nlc3NTYWZldHkoYXN5bmMgKCkgPT4ge1xuXHRcdFx0dHJ5IHtcblx0XHRcdFx0ZnMud3JpdGVGaWxlU3luYyhmaWxlUGF0aCwgSlNPTi5zdHJpbmdpZnkodGhpcy5ibGFja2xpc3QpKTtcblx0XHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHRcdHRoaXMubG9nZ2VyLmVycm9yKFxuXHRcdFx0XHRcdGBFcnJvciBzYXZpbmcgSVAgYmxhY2tsaXN0IHRvIGZpbGU6ICR7ZXJyb3J9YFxuXHRcdFx0XHQpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHR9XG5cblx0cHVibGljIGFzeW5jIGFkZElwVG9CbGFja2xpc3QoaXA6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuXHRcdGlmICghdGhpcy5ibGFja2xpc3QuaW5jbHVkZXMoaXApKSB7XG5cdFx0XHR0aGlzLmJsYWNrbGlzdC5wdXNoKGlwKTtcblx0XHRcdGF3YWl0IHRoaXMuc2F2ZUlwQmxhY2tsaXN0KCk7XG5cdFx0XHR0aGlzLmxvZ2dlci5pbmZvKGBJUCAke2lwfSBhZGRlZCB0byBibGFja2xpc3QuYCk7XG5cdFx0fVxuXHR9XG5cblx0cHVibGljIGFzeW5jIHJlbW92ZUlwRnJvbUJsYWNrbGlzdChpcDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0dGhpcy5ibGFja2xpc3QgPSB0aGlzLmJsYWNrbGlzdC5maWx0ZXIoXG5cdFx0XHRibGFja2xpc3RlZElwID0+IGJsYWNrbGlzdGVkSXAgIT09IGlwXG5cdFx0KTtcblx0XHRhd2FpdCB0aGlzLnNhdmVJcEJsYWNrbGlzdCgpO1xuXHRcdHRoaXMubG9nZ2VyLmluZm8oYElQICR7aXB9IHJlbW92ZWQgZnJvbSBibGFja2xpc3QuYCk7XG5cdH1cblxuXHRwdWJsaWMgYXN5bmMgdGVtcG9yYXJ5QmxhY2tsaXN0KGlwOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHRjb25zdCB0ZW1wb3JhcnlCbGFja2xpc3RLZXkgPSBgdGVtcG9yYXJ5QmxhY2tsaXN0XyR7aXB9YDtcblx0XHRhd2FpdCB0aGlzLnJlZGlzU2VydmljZS5zZXQodGVtcG9yYXJ5QmxhY2tsaXN0S2V5LCB0cnVlLCAzNjAwKTtcblx0XHR0aGlzLmxvZ2dlci5pbmZvKGBJUCAke2lwfSB0ZW1wb3JhcmlseSBibGFja2xpc3RlZCBmb3IgMSBob3VyLmApO1xuXHR9XG5cblx0cHVibGljIGFzeW5jIGlzVGVtcG9yYXJpbHlCbGFja2xpc3RlZChpcDogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XG5cdFx0Y29uc3QgdGVtcG9yYXJ5QmxhY2tsaXN0S2V5ID0gYHRlbXBvcmFyeUJsYWNrbGlzdF8ke2lwfWA7XG5cdFx0cmV0dXJuICEhKGF3YWl0IHRoaXMucmVkaXNTZXJ2aWNlLmdldDxib29sZWFuPih0ZW1wb3JhcnlCbGFja2xpc3RLZXkpKTtcblx0fVxuXG5cdHB1YmxpYyBhc3luYyBpc0JsYWNrbGlzdGVkKGlwOiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+IHtcblx0XHR0cnkge1xuXHRcdFx0YXdhaXQgdGhpcy5sb2FkSXBCbGFja2xpc3QoKTtcblxuXHRcdFx0cmV0dXJuIHRoaXMuYmxhY2tsaXN0LmluY2x1ZGVzKGlwKTtcblx0XHR9IGNhdGNoIChlcnJvcikge1xuXHRcdFx0dGhpcy5sb2dnZXIuZXJyb3IoXG5cdFx0XHRcdGBFcnJvciBjaGVja2luZyBpZiBJUCAke2lwfSBpcyBibGFja2xpc3RlZDogJHtlcnJvcn1gXG5cdFx0XHQpO1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblx0fVxuXG5cdHB1YmxpYyBhc3luYyBpc0JsYWNrbGlzdGVkT3JUZW1wb3JhcmlseUJsYWNrbGlzdGVkKGlwOiBzdHJpbmcpOiBQcm9taXNlPHtcblx0XHRpc0JsYWNrbGlzdGVkOiBib29sZWFuO1xuXHRcdGlzVGVtcG9yYXJpbHlCbGFja2xpc3RlZDogYm9vbGVhbjtcblx0fT4ge1xuXHRcdHRyeSB7XG5cdFx0XHRjb25zdCBpc0JsYWNrbGlzdGVkID0gYXdhaXQgdGhpcy5pc0JsYWNrbGlzdGVkKGlwKTtcblx0XHRcdGNvbnN0IGlzVGVtcG9yYXJpbHlCbGFja2xpc3RlZCA9XG5cdFx0XHRcdGF3YWl0IHRoaXMuaXNUZW1wb3JhcmlseUJsYWNrbGlzdGVkKGlwKTtcblx0XHRcdHJldHVybiB7IGlzQmxhY2tsaXN0ZWQsIGlzVGVtcG9yYXJpbHlCbGFja2xpc3RlZCB9O1xuXHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHR0aGlzLmxvZ2dlci5lcnJvcihcblx0XHRcdFx0YEVycm9yIGNoZWNraW5nIGlmIElQICR7aXB9IGlzIGJsYWNrbGlzdGVkIG9yIHRlbXBvcmFyaWx5IGJsYWNrbGlzdGVkOiAke2Vycm9yfWBcblx0XHRcdCk7XG5cdFx0XHRyZXR1cm4geyBpc0JsYWNrbGlzdGVkOiBmYWxzZSwgaXNUZW1wb3JhcmlseUJsYWNrbGlzdGVkOiBmYWxzZSB9O1xuXHRcdH1cblx0fVxuXG5cdHB1YmxpYyBhc3luYyBwcmVJbml0SXBCbGFja2xpc3QoKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0dHJ5IHtcblx0XHRcdGNvbnN0IGJsYWNrbGlzdEluUmVkaXMgPSBhd2FpdCB0aGlzLnJlZGlzU2VydmljZS5nZXQ8c3RyaW5nW10+KFxuXHRcdFx0XHR0aGlzLmJsYWNrbGlzdEtleVxuXHRcdFx0KTtcblx0XHRcdGlmICghYmxhY2tsaXN0SW5SZWRpcykge1xuXHRcdFx0XHR0aGlzLmxvZ2dlci5pbmZvKFxuXHRcdFx0XHRcdCdJUCBibGFja2xpc3Qgbm90IGZvdW5kIGluIFJlZGlzLCBsb2FkaW5nIGZyb20gZmlsZS4uLidcblx0XHRcdFx0KTtcblx0XHRcdFx0YXdhaXQgdGhpcy5sb2FkSXBCbGFja2xpc3QoKTtcblx0XHRcdFx0YXdhaXQgdGhpcy5zYXZlSXBCbGFja2xpc3QoKTtcblx0XHRcdFx0dGhpcy5sb2dnZXIuaW5mbyhcblx0XHRcdFx0XHQnSVAgYmxhY2tsaXN0IGxvYWRlZCBmcm9tIGZpbGUgYW5kIHNhdmVkIHRvIFJlZGlzLidcblx0XHRcdFx0KTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRoaXMuYmxhY2tsaXN0ID0gYmxhY2tsaXN0SW5SZWRpcztcblx0XHRcdFx0dGhpcy5sb2dnZXIuaW5mbygnSVAgYmxhY2tsaXN0IGluaXRpYWxpemVkIGZyb20gUmVkaXMuJyk7XG5cdFx0XHR9XG5cdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdHRoaXMuZXJyb3JMb2dnZXIubG9nV2Fybihcblx0XHRcdFx0YEZhaWxlZCB0byBsb2FkIElQIGJsYWNrbGlzdCBmcm9tIFJlZGlzIG9yIGZpbGUuXFxuJHtTdHJpbmcoZXJyb3IpfWBcblx0XHRcdCk7XG5cdFx0XHRhd2FpdCB0aGlzLmxvYWRJcEJsYWNrbGlzdCgpO1xuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgcHJlSW5pdElwV2hpdGVsaXN0KCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdHRyeSB7XG5cdFx0XHRjb25zdCBjYWNoZWRXaGl0ZWxpc3QgPSBhd2FpdCB0aGlzLmNhY2hlU2VydmljZS5nZXQ8c3RyaW5nW10+KFxuXHRcdFx0XHR0aGlzLndoaXRlbGlzdEtleSxcblx0XHRcdFx0J2dhdGVrZWVwZXJTZXJ2aWNlJ1xuXHRcdFx0KTtcblxuXHRcdFx0aWYgKCFjYWNoZWRXaGl0ZWxpc3QpIHtcblx0XHRcdFx0dGhpcy5sb2dnZXIuaW5mbyhcblx0XHRcdFx0XHQnSVAgd2hpdGVsaXN0IG5vdCBmb3VuZCBpbiBjYWNoZSwgbG9hZGluZyBmcm9tIGNvbmZpZ3VyYXRpb24uLi4nXG5cdFx0XHRcdCk7XG5cblx0XHRcdFx0YXdhaXQgdGhpcy5sb2FkV2hpdGVsaXN0KCk7XG5cdFx0XHRcdGF3YWl0IHRoaXMuY2FjaGVTZXJ2aWNlLnNldChcblx0XHRcdFx0XHR0aGlzLndoaXRlbGlzdEtleSxcblx0XHRcdFx0XHR0aGlzLndoaXRlbGlzdCxcblx0XHRcdFx0XHQnZ2F0ZWtlZXBlclNlcnZpY2UnLFxuXHRcdFx0XHRcdDM2MDBcblx0XHRcdFx0KTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRoaXMud2hpdGVsaXN0ID0gY2FjaGVkV2hpdGVsaXN0O1xuXHRcdFx0fVxuXHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHR0aGlzLmxvZ2dlci5lcnJvcihcblx0XHRcdFx0YEVycm9yIGluaXRpYWxpemluZyBJUCB3aGl0ZWxpc3Q6ICR7ZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiAnVW5rbm93biBlcnJvcid9YFxuXHRcdFx0KTtcblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIHN5bmNCbGFja2xpc3RGcm9tUmVkaXNUb0ZpbGUoKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0dHJ5IHtcblx0XHRcdGNvbnN0IGJsYWNrbGlzdCA9IGF3YWl0IHRoaXMucmVkaXNTZXJ2aWNlLmdldDxzdHJpbmdbXT4oXG5cdFx0XHRcdHRoaXMuYmxhY2tsaXN0S2V5XG5cdFx0XHQpO1xuXG5cdFx0XHRpZiAoYmxhY2tsaXN0KSB7XG5cdFx0XHRcdHRoaXMuYmxhY2tsaXN0ID0gYmxhY2tsaXN0O1xuXHRcdFx0XHRhd2FpdCB0aGlzLmNhY2hlU2VydmljZS5zZXQoXG5cdFx0XHRcdFx0dGhpcy5ibGFja2xpc3RLZXksXG5cdFx0XHRcdFx0dGhpcy5ibGFja2xpc3QsXG5cdFx0XHRcdFx0J2dhdGVrZWVwZXJTZXJ2aWNlJyxcblx0XHRcdFx0XHQzNjAwXG5cdFx0XHRcdCk7XG5cdFx0XHRcdGF3YWl0IHRoaXMuc2F2ZUlwQmxhY2tsaXN0VG9GaWxlKCk7XG5cdFx0XHRcdHRoaXMubG9nZ2VyLmluZm8oXG5cdFx0XHRcdFx0J0lQIGJsYWNrbGlzdCBzdWNjZXNzZnVsbHkgc3luY2VkIGZyb20gUmVkaXMgdG8gZmlsZSBhbmQgY2FjaGUuJ1xuXHRcdFx0XHQpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dGhpcy5sb2dnZXIud2FybignTm8gSVAgYmxhY2tsaXN0IGZvdW5kIGluIFJlZGlzIGR1cmluZyBzeW5jLicpO1xuXHRcdFx0fVxuXHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHR0aGlzLmxvZ2dlci5lcnJvcihcblx0XHRcdFx0YEVycm9yIHN5bmNpbmcgSVAgYmxhY2tsaXN0IGZyb20gUmVkaXMgdG8gZmlsZTogJHtlcnJvcn1gXG5cdFx0XHQpO1xuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgaGFuZGxlRGVwZW5kZW5jeUVycm9yKFxuXHRcdG1pZGRsZXdhcmU6IHN0cmluZyxcblx0XHRlcnJvcjogdW5rbm93bixcblx0XHRyZXE6IFJlcXVlc3QsXG5cdFx0cmVzOiBSZXNwb25zZSxcblx0XHRuZXh0OiBOZXh0RnVuY3Rpb25cblx0KTogdm9pZCB7XG5cdFx0Y29uc3QgZXhwcmVzc01pZGRsZXdhcmVFcnJvciA9XG5cdFx0XHRuZXcgdGhpcy5lcnJvckhhbmRsZXIuRXJyb3JDbGFzc2VzLkRlcGVuZGVuY3lFcnJvckZhdGFsKFxuXHRcdFx0XHRgRmF0YWwgZXJyb3Igb2NjdXJyZWQgd2hpbGUgZXhlY3V0aW5nICcke21pZGRsZXdhcmV9JzogJHtlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICdVbmtub3duIGVycm9yJ31gLFxuXHRcdFx0XHR7IGRlcGVuZGVuY3k6IG1pZGRsZXdhcmUgfVxuXHRcdFx0KTtcblx0XHR0aGlzLmVycm9yTG9nZ2VyLmxvZ0Vycm9yKGV4cHJlc3NNaWRkbGV3YXJlRXJyb3IubWVzc2FnZSk7XG5cdFx0dGhpcy5lcnJvckhhbmRsZXIuZXhwcmVzc0Vycm9ySGFuZGxlcigpKFxuXHRcdFx0ZXhwcmVzc01pZGRsZXdhcmVFcnJvcixcblx0XHRcdHJlcSxcblx0XHRcdHJlcyxcblx0XHRcdG5leHRcblx0XHQpO1xuXHR9XG5cblx0cHJpdmF0ZSBnZXRGaWxlUGF0aChcblx0XHRlbnZWYXJpYWJsZTpcblx0XHRcdHwgJ3NlcnZlckRhdGFGaWxlUGF0aDEnXG5cdFx0XHR8ICdzZXJ2ZXJEYXRhRmlsZVBhdGgyJ1xuXHRcdFx0fCAnc2VydmVyRGF0YUZpbGVQYXRoMydcblx0XHRcdHwgJ3NlcnZlckRhdGFGaWxlUGF0aDQnXG5cdCk6IHN0cmluZyB7XG5cdFx0cmV0dXJuIHBhdGgucmVzb2x2ZShcblx0XHRcdF9fZGlybmFtZSxcblx0XHRcdHRoaXMuZW52Q29uZmlnLmdldEVudlZhcmlhYmxlKGVudlZhcmlhYmxlKVxuXHRcdCk7XG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIGNvbmN1cnJlbnRGaWxlQWNjZXNzU2FmZXR5KFxuXHRcdGZpbGVPcGVyYXRpb246ICgpID0+IFByb21pc2U8dm9pZD5cblx0KTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0dHJ5IHtcblx0XHRcdGF3YWl0IGZpbGVPcGVyYXRpb24oKTtcblx0XHR9IGNhdGNoIChlcnJvcikge1xuXHRcdFx0dGhpcy5sb2dnZXIuZXJyb3IoJ0Vycm9yIGR1cmluZyBjb25jdXJyZW50IGZpbGUgYWNjZXNzLicpO1xuXHRcdFx0dGhyb3cgZXJyb3I7XG5cdFx0fVxuXHR9XG5cblx0cHVibGljIGFzeW5jIHNodXRkb3duKCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdHRyeSB7XG5cdFx0XHR0aGlzLmxvZ2dlci5pbmZvKCdTaHV0dGluZyBkb3duIEdhdGVrZWVwZXJTZXJ2aWNlLi4uJyk7XG5cblx0XHRcdGlmICh0aGlzLlNZTkNfSU5URVJWQUwpIHtcblx0XHRcdFx0Y2xlYXJJbnRlcnZhbCh0aGlzLlNZTkNfSU5URVJWQUwpO1xuXHRcdFx0XHR0aGlzLmxvZ2dlci5pbmZvKCdTdG9wcGVkIElQIGJsYWNrbGlzdCBzeW5jIGludGVydmFsLicpO1xuXHRcdFx0fVxuXG5cdFx0XHR0aGlzLmdsb2JhbFJhdGVMaW1pdFN0YXRzLmNsZWFyKCk7XG5cdFx0XHR0aGlzLmxvZ2dlci5pbmZvKCdDbGVhcmVkIGdsb2JhbCByYXRlIGxpbWl0IHN0YXRzLicpO1xuXG5cdFx0XHR0aGlzLnJhdGVMaW1pdGVyID0gbnVsbDtcblx0XHRcdHRoaXMubG9nZ2VyLmluZm8oJ1JhdGUgbGltaXRlciBtZW1vcnkgY2xlYXJlZC4nKTtcblxuXHRcdFx0R2F0ZWtlZXBlclNlcnZpY2UuaW5zdGFuY2UgPSBudWxsO1xuXHRcdFx0dGhpcy5sb2dnZXIuaW5mbygnR2F0ZWtlZXBlclNlcnZpY2Ugc2h1dGRvd24gY29tcGxldGVkLicpO1xuXHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHRjb25zdCBzaHV0ZG93bkVycm9yID1cblx0XHRcdFx0bmV3IHRoaXMuZXJyb3JIYW5kbGVyLkVycm9yQ2xhc3Nlcy5VdGlsaXR5RXJyb3JSZWNvdmVyYWJsZShcblx0XHRcdFx0XHRgRXJyb3IgZHVyaW5nIEdhdGVrZWVwZXJTZXJ2aWNlIHNodXRkb3duOiAke2Vycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogJ1Vua25vd24gZXJyb3InfWBcblx0XHRcdFx0KTtcblx0XHRcdHRoaXMuZXJyb3JMb2dnZXIubG9nRXJyb3Ioc2h1dGRvd25FcnJvci5tZXNzYWdlKTtcblx0XHRcdHRoaXMuZXJyb3JIYW5kbGVyLmhhbmRsZUVycm9yKHsgZXJyb3I6IHNodXRkb3duRXJyb3IgfSk7XG5cdFx0fVxuXHR9XG59XG4iXX0=
