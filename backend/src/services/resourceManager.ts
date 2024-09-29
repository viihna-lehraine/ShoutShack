import {
	AppLoggerServiceInterface,
	CacheServiceInterface,
	ConfigServiceInterface,
	ErrorHandlerServiceInterface,
	ErrorLoggerServiceInterface,
	RedisServiceInterface,
	ResourceManagerInterface
} from '../index/interfaces';
import { ServiceFactory } from '../index/factory';
import os from 'os';
import fs from 'fs';
import toobusy from 'toobusy-js';

export class ResourceManager implements ResourceManagerInterface {
	private static instance: ResourceManager;
	private logger: AppLoggerServiceInterface;
	private errorLogger: ErrorLoggerServiceInterface;
	private errorHandler: ErrorHandlerServiceInterface;
	private configService: ConfigServiceInterface;
	private redisService: RedisServiceInterface;
	private cacheService: CacheServiceInterface;

	private constructor() {
		this.logger = ServiceFactory.getLoggerService();
		this.errorLogger = ServiceFactory.getErrorLoggerService();
		this.errorHandler = ServiceFactory.getErrorHandlerService();
		this.configService = ServiceFactory.getConfigService();
		this.redisService = ServiceFactory.getRedisService();
		this.cacheService = ServiceFactory.getCacheService();
		this.initializeResourceManager();
	}

	public static getInstance(): ResourceManager {
		if (!ResourceManager.instance) {
			ResourceManager.instance = new ResourceManager();
		}

		return ResourceManager.instance;
	}

	private initializeResourceManager(): void {
		this.logger.info('Initializing resource monitors...');
		this.monitorMemoryUsage();
		this.monitorCPU();
		this.monitorDiskUsage();
		this.monitorNetworkUsage();
		this.monitorEventLoopLag();
	}

	public async performHealthCheck(): Promise<Record<string, unknown>> {
		try {
			const redisHealth = await this.redisService.exists('testKey');
			const eventLoopLag = toobusy.lag();

			const healthSummary: Record<string, unknown> = {
				timestamp: new Date().toISOString(),
				redisStatus: redisHealth ? 'Connected' : 'Not connected',
				cacheServiceMetrics:
					this.cacheService.getCacheMetrics('resourceManager'),
				memoryUsage: this.getMemoryUsage(),
				cpuUsage: this.getCpuUsage(),
				diskUsage: await this.getDiskUsage(),
				networkStatus: this.getNetworkUsage(),
				eventLoopLag
			};
			this.logger.info(`Health Check: ${JSON.stringify(healthSummary)}`);
			return healthSummary;
		} catch (error) {
			this.handleResourceManagerError(
				error,
				'HEALTH_CHECK_ERROR',
				{},
				'Error performing health check'
			);
			return {};
		}
	}

	public monitorEventLoopLag(): void {
		try {
			const lagThreshold =
				this.configService.getEnvVariable('eventLoopLagThreshold') ||
				70;
			setInterval(() => {
				const lag = toobusy.lag();
				if (lag > lagThreshold) {
					this.logger.warn(`High event loop lag detected: ${lag}ms`);
					this.adjustResources();
				}
			}, 10000);
		} catch (error) {
			this.handleResourceManagerError(
				error,
				'EVENT_LOOP_LAG_MONITOR_ERROR',
				{},
				'Error monitoring event loop lag'
			);
		}
	}

	public monitorMemoryUsage(): void {
		setInterval(() => {
			const memoryUsage = this.getMemoryUsage();
			this.logger.info(`Memory Usage: ${JSON.stringify(memoryUsage)}`);
			const memoryLimit = this.getMemoryThreshold();
			if (memoryUsage.heapUsed > memoryLimit) {
				this.logger.warn(
					`Memory usage exceeded limit (${memoryLimit} bytes). Adjusting resources...`
				);
				this.adjustResources();
			}
		}, 10000);
	}

	public monitorCPU(): void {
		setInterval(() => {
			const cpuUsage = this.getCpuUsage();
			cpuUsage.forEach(({ core, usage }) => {
				this.logger.info(`CPU ${core}: Usage ${usage}`);
			});
			this.adjustResources();
		}, 5000);
	}

	public monitorDiskUsage(): void {
		try {
			const diskPath =
				this.configService.getEnvVariable('diskPath') || '/';
			setInterval(() => {
				fs.stat(diskPath, (err, stats) => {
					if (err) {
						this.logger.error(`Error getting disk usage: ${err}`);
						return;
					}
					this.logger.info(`Disk usage: ${JSON.stringify(stats)}`);
				});
			}, 30000);
		} catch (error) {
			this.handleResourceManagerError(
				error,
				'DISK_MONITOR_ERROR',
				{},
				'Error monitoring disk usage'
			);
		}
	}

	public monitorCacheSize(): void {
		const cacheMetrics =
			this.cacheService.getCacheMetrics('resourceManager');
		const cacheSize = cacheMetrics.cacheSize;
		if (cacheSize) {
			if (cacheSize > this.configService.getEnvVariable('maxCacheSize')) {
				this.logger.warn(
					`Cache size exceeded limit. Clearing old entries...`
				);
				this.evictCacheEntries();
			}
		} else {
			this.logger.error('Error getting cache size');
		}
	}

	private evictCacheEntries(): void {
		// Logic to evict least recently used or old cache entries
	}

	private getMemoryThreshold(): number {
		return (
			this.configService.getEnvVariable('memoryThreshold') ||
			os.totalmem() * 0.9
		);
	}

	public monitorNetworkUsage(): void {
		try {
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
		} catch (error) {
			this.handleResourceManagerError(
				error,
				'NETWORK_MONITOR_ERROR',
				{},
				'Error monitoring network usage'
			);
		}
	}

	private manageMemory(): void {
		try {
			const memoryUsage = process.memoryUsage();
			const memoryLimit =
				this.configService.getEnvVariable('memoryLimit');
			const usedHeapPercentage =
				(memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;

			this.logger.info(
				`Memory usage: ${usedHeapPercentage.toFixed(2)}% of heap used`
			);

			if (memoryUsage.heapUsed > memoryLimit) {
				this.logger.warn(
					`Memory usage exceeded the limit (${memoryLimit} bytes). Initiating memory cleanup...`
				);
				this.clearCaches('memoryCleanupService');

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
		} catch (error) {
			this.handleResourceManagerError(
				error,
				'MEMORY_MANAGEMENT_ERROR',
				{},
				'Error managing memory usage'
			);
		}
	}

	public getCpuUsage(): Array<{ core: number; usage: string }> {
		try {
			const cpus = os.cpus();
			return cpus.map((cpu, index) => {
				const total = Object.values(cpu.times).reduce(
					(acc, time) => acc + time,
					0
				);
				const usage = ((total - cpu.times.idle) / total) * 100;
				return { core: index + 1, usage: `${usage.toFixed(2)}%` };
			});
		} catch (error) {
			this.handleResourceManagerError(
				error,
				'CPU_USAGE_ERROR',
				{},
				'Error getting CPU usage'
			);
			return [];
		}
	}

	public getMemoryUsage(): {
		heapUsed: number;
		heapTotal: number;
		heapUsedPercentage: number;
		memoryLimit: number;
		isMemoryHealthy: boolean;
	} {
		try {
			const memoryUsage = process.memoryUsage();
			const memoryLimit =
				this.configService.getEnvVariable('memoryLimit') ||
				os.totalmem();
			const usedHeapPercentage =
				(memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;

			return {
				heapUsed: memoryUsage.heapUsed,
				heapTotal: memoryUsage.heapTotal,
				heapUsedPercentage: usedHeapPercentage,
				memoryLimit,
				isMemoryHealthy: memoryUsage.heapUsed < memoryLimit
			};
		} catch (error) {
			this.handleResourceManagerError(
				error,
				'MEMORY_USAGE_ERROR',
				{},
				'Error getting memory usage'
			);
			return {
				heapUsed: 0,
				heapTotal: 0,
				heapUsedPercentage: 0,
				memoryLimit: 0,
				isMemoryHealthy: true
			};
		}
	}

	public async getDiskUsage(): Promise<Record<string, unknown>> {
		try {
			const diskPath =
				this.configService.getEnvVariable('diskPath') || '/';
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
		} catch (error) {
			this.handleResourceManagerError(
				error,
				'DISK_USAGE_ERROR',
				{},
				'Error getting disk usage'
			);
			return {};
		}
	}

	public getNetworkUsage(): Record<string, unknown>[] {
		try {
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
		} catch (error) {
			this.handleResourceManagerError(
				error,
				'NETWORK_USAGE_ERROR',
				{},
				'Error getting network usage'
			);
			return [];
		}
	}

	public async getFromCache<T>(
		key: string,
		service: string
	): Promise<T | null> {
		try {
			const cachedData = await this.cacheService.get<T>(key, service);
			if (cachedData) {
				return cachedData;
			}
			return null;
		} catch (error) {
			this.handleResourceManagerError(
				error,
				'CACHE_RETRIEVAL_ERROR',
				{ key },
				`Error retrieving data from cache for key: ${key}`
			);
			return null;
		}
	}

	public async saveToCache<T>(
		key: string,
		value: T,
		service: string,
		expiration: number
	): Promise<void> {
		try {
			await this.cacheService.set(key, value, service, expiration); // Use CacheService
		} catch (error) {
			this.handleResourceManagerError(
				error,
				'CACHE_SAVE_ERROR',
				{ key, value, expiration },
				`Error saving data to cache for key: ${key}`
			);
		}
	}

	public async clearCaches(service: string): Promise<void> {
		try {
			this.logger.info(`Clearing cache for service ${service}...`);

			await this.cacheService
				.flushCache(service)
				.then(() => {
					this.logger.info(
						`Cache flushed successfully for service ${service}`
					);
				})
				.catch(error => {
					this.errorLogger.logError(
						`Failed to flush cache for service ${service}: ${error.message}`
					);
				});
		} catch (error) {
			this.handleResourceManagerError(
				error,
				'CLEAR_CACHES_ERROR',
				{},
				`Error clearing caches for service ${service}`
			);
		}
	}

	public async closeIdleConnections(): Promise<void> {
		try {
			this.logger.info('Closing idle database connections...');
			const databaseController = ServiceFactory.getDatabaseController();
			await databaseController.clearIdleConnections();
			this.logger.info('Idle database connections closed successfully');

			this.logger.info(
				'Clearing cache after closing idle connections...'
			);
			await this.clearCaches('idleConnectionService');
		} catch (error) {
			this.handleResourceManagerError(
				error,
				'IDLE_CONNECTIONS_ERROR',
				{},
				'Error closing idle connections'
			);
		}
	}

	private removeTemporaryFiles(): void {
		try {
			const tempDir =
				this.configService.getEnvVariable('tempDir') || '/tmp';
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
		} catch (error) {
			this.handleResourceManagerError(
				error,
				'REMOVE_TEMP_FILES_ERROR',
				{},
				'Error removing temporary files'
			);
		}
	}

	private adjustResources(): void {
		try {
			const memoryUsage = process.memoryUsage();
			const memoryLimit =
				this.configService.getEnvVariable('memoryLimit');
			const usedHeapPercentage =
				(memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;

			if (usedHeapPercentage > memoryLimit || 80) {
				this.logger.warn(
					`Memory usage high: ${usedHeapPercentage}% of heap used.`
				);
				this.clearCaches('highMemoryUsageService');
				this.closeIdleConnections();
				this.adjustMemory();
			}

			const cpuUsage = this.getCpuUsage();
			if (cpuUsage.some(cpu => parseFloat(cpu.usage) > 89)) {
				this.logger.warn(
					'High CPU usage detected, adjusting CPU resources...'
				);
				this.adjustCPU();
			}
		} catch (error) {
			this.handleResourceManagerError(
				error,
				'ADJUST_RESOURCES_ERROR',
				{},
				'Error adjusting resources'
			);
		}
	}

	private adjustCPU(): void {
		try {
			const cpuUsage = this.getCpuUsage();

			cpuUsage.forEach(({ usage }) => {
				if (parseFloat(usage) > 85) {
					this.logger.warn(
						'CPU usage is critically high, adjusting CPU resources...'
					);
					this.clearCaches('aTaskService');
					// *DEV-NOTE* clear caches for CPU-intensive services
				}
			});
		} catch (error) {
			this.handleResourceManagerError(
				error,
				'ADJUST_CPU_ERROR',
				{},
				'Error adjusting CPU resources'
			);
		}
	}

	private adjustMemory(): void {
		try {
			const memoryUsage = process.memoryUsage();
			const memoryLimit =
				this.configService.getEnvVariable('memoryLimit');

			if (memoryUsage.heapUsed > memoryLimit * 0.9) {
				this.logger.warn(
					'Memory usage is critically high, initiating memory cleanup...'
				);

				// Pass an appropriate context string to the clearCaches method
				this.clearCaches('memoryAdjustmentService');

				if (global.gc) {
					global.gc();
					this.logger.info('Garbage collection forced');
				} else {
					this.logger.warn(
						'Garbage collection not exposed. Use --expose-gc to allow forced GC.'
					);
				}
			}
		} catch (error) {
			this.handleResourceManagerError(
				error,
				'ADJUST_MEMORY_ERROR',
				{},
				'Error adjusting memory resources'
			);
		}
	}

	private slowDownBackgroundProcesses(): void {
		// Logic to reduce background process frequency
	}

	private pauseNonEssentialTasks(): void {
		// Logic to temporarily pause non-essential services or processes
	}

	private handleOverload(): void {
		try {
			if (toobusy()) {
				this.logger.error(
					'Server is overloaded, rejecting new requests'
				);
				this.slowDownBackgroundProcesses();
				this.pauseNonEssentialTasks();

				// Example: add middleware in your web server to reject requests
				// You can integrate this logic directly in your server handler
				// For example:
				// app.use((req, res, next) => {
				//     if (toobusy()) {
				//         res.status(503).send('Server too busy. Try again later.');
				//     } else {
				//         next();
				//     }
				// });
			}
		} catch (error) {
			this.handleResourceManagerError(
				error,
				'OVERLOAD_ERROR',
				{},
				'Error handling server overload'
			);
		}
	}

	private handleResourceManagerError(
		error: unknown,
		errorHeader: string,
		errorDetails: object,
		customMessage: string
	): void {
		try {
			const errorMessage = `${customMessage}: ${error}\n${error instanceof Error ? error.stack : ''}`;
			this.errorLogger.logError(errorMessage);

			const resourceError =
				new this.errorHandler.ErrorClasses.ResourceManagerError(
					errorHeader,
					{
						details: errorDetails,
						exposeToClient: false
					}
				);

			this.errorHandler.handleError({
				error: resourceError
			});
		} catch (error) {
			this.logger.error(
				`Error handling resource manager error: ${error}`
			);
			const severity = this.errorHandler.ErrorSeverity.WARNING;
			this.errorHandler.handleError({
				error,
				details: {
					context: 'Resource Manager',
					action: 'Passing error from resource manager handle to ErrorHandlerService',
					notes: 'Error occurred while handling resource manager error: ResourceManager.handleResourceManagerError'
				},
				severity
			});
		}
	}
}
