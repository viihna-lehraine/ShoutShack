import {
	AppLoggerServiceInterface,
	ConfigServiceInterface,
	ErrorHandlerServiceInterface,
	ErrorLoggerServiceInterface,
	MemoryMonitorInterface,
	RedisServiceInterface
} from '../index/interfaces';
import { AppError } from '../errors/errorClasses';
import { createClient, RedisClientType } from 'redis';
import { ServiceFactory } from '../index/factory';
import os from 'os';
import fs from 'fs';
import NodeCache from 'node-cache';

export class ResourceManager {
	private static instance: ResourceManager;
	private redisClient: RedisClientType | null = null;
	private memoryMonitor: MemoryMonitorInterface | null = null;
	private logger: AppLoggerServiceInterface;
	private errorLogger: ErrorLoggerServiceInterface;
	private errorHandler: ErrorHandlerServiceInterface;
	private configService: ConfigServiceInterface;
	private redisService: RedisServiceInterface;
	private appCache: NodeCache;

	constructor() {
		this.logger = ServiceFactory.getLoggerService();
		this.errorLogger = ServiceFactory.getErrorLoggerService();
		this.errorHandler = ServiceFactory.getErrorHandlerService();
		this.configService = ServiceFactory.getConfigService();
		this.redisService = ServiceFactory.getRedisService();
		this.appCache = new NodeCache({ stdTTL: 100, checkperiod: 120 });

		this.setupMemoryMonitor();
		this.setupRedis();
	}

	public static getInstance(): ResourceManager {
		if (!ResourceManager.instance) {
			ResourceManager.instance = new ResourceManager();
		}

		return ResourceManager.instance;
	}

	private setupMemoryMonitor(): void {
		this.logger.info('Setting up memory monitor');
		const memoryLimit = this.configService.getEnvVariable('memoryLimit');
		if (memoryLimit) {
			this.createMemoryMonitor();
		} else {
			this.logger.warn(
				'Memory limit is not set, skipping memory monitor setup'
			);
		}
	}

	private async setupRedis(): Promise<void> {
		this.logger.info('Setting up Redis service');
		try {
			const redisClient = await this.redisService.getRedisClient({
				req: {} as import('express').Request,
				res: {} as import('express').Response,
				next: () => {},
				blankRequest: {} as import('express').Request,
				createRedisClient: createClient
			});
			this.redisClient = redisClient;
		} catch (error) {
			this.errorLogger.logError(
				`Failed to setup Redis service: ${error instanceof Error ? error.message : error}`
			);
			this.createMemoryMonitor();
		}
	}

	private createMemoryMonitor(): void {
		this.logger.info('Creating memory monitor as Redis is unavailable');

		setInterval(() => {
			const memoryUsage = process.memoryUsage();
			this.logger.info(`Memory Usage: ${JSON.stringify(memoryUsage)}`);
			if (
				memoryUsage.heapUsed >
				this.configService.getEnvVariable('memoryLimit')
			) {
				this.manageMemory();
			}
		}, 10000);
	}

	private manageMemory(): void {
		const memoryUsage = process.memoryUsage();
		const memoryLimit = this.configService.getEnvVariable('memoryLimit');
		const usedHeapPercentage =
			(memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;

		this.logger.info(
			`Memory usage: ${usedHeapPercentage.toFixed(2)}% of heap used`
		);

		if (memoryUsage.heapUsed > memoryLimit) {
			this.logger.warn(
				`Memory usage exceeded the limit (${memoryLimit} bytes). Initiating memory cleanup...`
			);
			this.clearCaches();

			if (global.gc) {
				this.logger.info('Forcing garbage collection');
				global.gc();
			} else {
				this.logger.warn(
					'Garbage collection is not exposed. Start the process with --expose-gc to enable forced GC.'
				);
			}

			this.closeIdleConnections();
			this.removeTemporaryFiles();

			const postCleanupMemoryUsage = process.memoryUsage();
			this.logger.info(
				`Post-cleanup memory usage: ${postCleanupMemoryUsage.heapUsed} bytes`
			);
		}
	}

	public async getFromCache<T>(key: string): Promise<T | null> {
		const cachedData = await this.redisService.get<string>(key);
		if (cachedData) {
			return JSON.parse(cachedData) as T;
		}
		return null;
	}

	public async saveToCache<T>(
		key: string,
		value: T,
		expiration: number
	): Promise<void> {
		await this.redisService.set<T>(key, value, expiration);
	}

	private clearCaches(): void {
		this.logger.info('Clearing application caches...');

		this.redisService
			.flushRedisMemoryCache()
			.then(() => {
				this.logger.info('Redis cache flushed successfully');
			})
			.catch(error => {
				this.errorLogger.logError(
					`Failed to flush Redis cache: ${error.message}`
				);
			});

		// Clear local in-memory cache
		if (this.appCache) {
			this.appCache.flushAll();
			this.logger.info('In-memory cache cleared');
		}
	}

	private async closeIdleConnections(): Promise<void> {
		this.logger.info('Closing idle database connections...');

		try {
			const databaseService = ServiceFactory.getDatabaseService();
			await databaseService.clearIdleConnections();

			this.logger.info('Idle database connections closed successfully');
		} catch (error) {
			this.errorLogger.logError(
				`Failed to close idle connections: ${error instanceof Error ? error.message : error}`
			);
		}

		// Optionally, close other types of idle connections (like HTTP client connections) if needed
	}

	private removeTemporaryFiles(): void {
		const tempDir = this.configService.getEnvVariable('tempDir') || '/tmp';
		this.logger.info(`Removing temporary files from ${tempDir}...`);
		fs.readdir(tempDir, (err, files) => {
			if (err) {
				this.logger.error(`Error reading temp directory: ${err}`);
				return;
			}
			files.forEach(file => {
				const filePath = `${tempDir}/${file}`;
				fs.unlink(filePath, err => {
					if (err) {
						this.logger.error(
							`Error deleting file ${filePath}: ${err}`
						);
					} else {
						this.logger.info(`Deleted file: ${filePath}`);
					}
				});
			});
		});
	}

	public monitorCPU(): void {
		setInterval(() => {
			const cpus = os.cpus();
			cpus.forEach((cpu, index) => {
				const total = Object.values(cpu.times).reduce(
					(acc, time) => acc + time,
					0
				);
				const usage = ((total - cpu.times.idle) / total) * 100;
				this.logger.info(
					`CPU ${index + 1}: Usage ${usage.toFixed(2)}%`
				);
			});
		}, 5000);
	}

	public monitorDiskUsage(): void {
		const diskPath = this.configService.getEnvVariable('diskPath') || '/';
		setInterval(() => {
			fs.stat(diskPath, (err, stats) => {
				if (err) {
					this.logger.error(`Error getting disk usage: ${err}`);
					return;
				}
				this.logger.info(`Disk usage: ${JSON.stringify(stats)}`);
			});
		}, 30000);
	}

	public monitorNetworkUsage(): void {
		setInterval(() => {
			const networkInterfaces = os.networkInterfaces();
			Object.keys(networkInterfaces).forEach(interfaceName => {
				const netStats = networkInterfaces[interfaceName];
				if (netStats) {
					netStats.forEach(netStat => {
						this.logger.info(
							`Interface ${interfaceName}: Address ${netStat.address}, Family ${netStat.family}, Internal ${netStat.internal}`
						);
					});
				}
			});
		}, 10000);
	}

	public async performHealthCheck(
		req: import('express').Request,
		res: import('express').Response,
		next: import('express').NextFunction
	): Promise<Record<string, unknown>> {
		const redisClientStatus = await this.redisService.getRedisClient({
			req,
			res,
			next,
			blankRequest: req,
			createRedisClient: createClient
		});

		const healthSummary: Record<string, unknown> = {
			timestamp: new Date().toISOString(),
			redisStatus: redisClientStatus ? 'Connected' : 'Not connected',
			memoryUsage: this.getMemoryUsage(),
			cpuUsage: this.getCpuUsage(),
			diskUsage: await this.getDiskUsage(),
			networkStatus: this.getNetworkUsage()
		};

		this.logger.info(`Health Check: ${JSON.stringify(healthSummary)}`);
		return healthSummary;
	}

	private getMemoryUsage(): Record<string, unknown> {
		const memoryUsage = process.memoryUsage();
		const memoryLimit =
			this.configService.getEnvVariable('memoryLimit') || os.totalmem();
		const usedHeapPercentage =
			(memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;

		return {
			heapUsed: memoryUsage.heapUsed,
			heapTotal: memoryUsage.heapTotal,
			heapUsedPercentage: usedHeapPercentage,
			memoryLimit,
			isMemoryHealthy: memoryUsage.heapUsed < memoryLimit
		};
	}

	private getCpuUsage(): Array<{ core: number; usage: string }> {
		const cpus = os.cpus();
		return cpus.map((cpu, index) => {
			const total = Object.values(cpu.times).reduce(
				(acc, time) => acc + time,
				0
			);
			const usage = ((total - cpu.times.idle) / total) * 100;
			return { core: index + 1, usage: `${usage.toFixed(2)}%` };
		});
	}

	private async getDiskUsage(): Promise<Record<string, unknown>> {
		const diskPath = this.configService.getEnvVariable('diskPath') || '/';
		return new Promise(resolve => {
			fs.stat(diskPath, (err, stats) => {
				if (err) {
					this.errorLogger.logError(
						`Error getting disk usage: ${err.message}`
					);
					resolve({ error: err.message });
				} else {
					resolve({
						diskPath,
						diskStats: stats
					});
				}
			});
		});
	}

	private getNetworkUsage(): Record<string, unknown>[] {
		const networkInterfaces = os.networkInterfaces();
		return Object.keys(networkInterfaces)
			.map(interfaceName => {
				const netStats = networkInterfaces[interfaceName];
				if (netStats) {
					return netStats.map(netStat => ({
						interface: interfaceName,
						address: netStat.address,
						family: netStat.family,
						internal: netStat.internal
					}));
				}
				return [];
			})
			.flat();
	}

	private processResourceError(error: AppError | Error): void {
		this.errorLogger.logError(error.message, {});
	}
}
