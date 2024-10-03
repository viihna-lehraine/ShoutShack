import { ResourceManagerInterface } from '../index/interfaces/services';
import { ServiceFactory } from '../index/factory';
import os from 'os';
import fs from 'fs';
import toobusy from 'toobusy-js';

export class ResourceManager implements ResourceManagerInterface {
	private static instance: ResourceManager;
	private logger = ServiceFactory.getLoggerService();
	private errorLogger = ServiceFactory.getErrorLoggerService();
	private errorHandler = ServiceFactory.getErrorHandlerService();
	private envConfig = ServiceFactory.getEnvConfigService();
	private redisService = ServiceFactory.getRedisService();
	private cacheService = ServiceFactory.getCacheService();
	private memoryCacheLRU = new Map<string, number>();

	private constructor() {}

	public static getInstance(): ResourceManager {
		if (!ResourceManager.instance) {
			ResourceManager.instance = new ResourceManager();
		}

		return ResourceManager.instance;
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

	public adjustResources(): void {
		// *DEV-NOTE* this is unused in the current implementation
		try {
			const memoryUsage = process.memoryUsage();
			const memoryLimit = this.envConfig.getEnvVariable('memoryLimit');
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
				this.envConfig.getEnvVariable('memoryLimit') || os.totalmem();
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
			const diskPath = this.envConfig.getEnvVariable('diskPath') || '/';
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

	private adjustMemory(): void {
		try {
			const memoryUsage = process.memoryUsage();
			const memoryLimit = this.envConfig.getEnvVariable('memoryLimit');

			if (memoryUsage.heapUsed > memoryLimit * 0.9) {
				this.logger.warn(
					'Memory usage is critically high, initiating memory cleanup...'
				);

				// *DEV-NOTE* pass an appropriate context string to the clearCaches method
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

	private manageMemory(): void {
		try {
			const memoryUsage = process.memoryUsage();
			const memoryLimit = this.envConfig.getEnvVariable('memoryLimit');
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

	public evictCacheEntries(service: string): void {
		const maxCacheSize = this.envConfig.getEnvVariable('maxCacheSize');

		const serviceMemoryCache = this.cacheService.getMemoryCache(service);

		if (!serviceMemoryCache || serviceMemoryCache.size <= maxCacheSize) {
			return;
		}

		const excessEntries = serviceMemoryCache.size - maxCacheSize;
		const sortedLRUEntries = Array.from(this.memoryCacheLRU.entries()).sort(
			(a, b) => a[1] - b[1]
		);

		for (let i = 0; i < excessEntries; i++) {
			const [oldestKey] = sortedLRUEntries[i];

			this.cacheService.del(oldestKey, service);
			this.memoryCacheLRU.delete(oldestKey);
			this.cacheService.del(oldestKey, service);

			this.logger.info(`Evicted cache entry for key: ${oldestKey}`);
		}
	}

	public updateCacheAccessLRU(key: string): void {
		this.memoryCacheLRU.set(key, Date.now());
	}

	private autoScaleResources(): void {
		if (this.envConfig.getFeatureFlags().enableAutoScaling) {
			const memoryUsage = process.memoryUsage();
			if (
				memoryUsage.heapUsed >
				this.envConfig.getEnvVariable('memoryThreshold')
			) {
				this.logger.warn('Scaling up memory resources...');
				// *DEV-NOTE* logic for scaling memory resources dynamically
			}
		}
	}

	private throttleBackgroundProcesses(): void {
		// *DEV-NOTE* logic to reduce background process frequency
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
			await this.cacheService.set(key, value, service, expiration);
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
			const tempDir = this.envConfig.getEnvVariable('tempDir') || '/tmp';
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

	private slowDownBackgroundProcesses(): void {
		// *DEV-NOTE* logic to reduce background process frequency
	}

	private pauseNonEssentialTasks(): void {
		// *DEV-NOTE* logic to temporarily pause non-essential services or processes
	}

	private handleOverload(): void {
		try {
			if (toobusy()) {
				this.logger.error(
					'Server is overloaded, rejecting new requests'
				);
				this.slowDownBackgroundProcesses();
				this.pauseNonEssentialTasks();

				// *DEV-NOTE* reject-requesting middleware goes here
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

	public async shutdown(): Promise<void> {
		try {
			this.logger.info('Shutting down Resource Manager...');

			toobusy.shutdown();
			this.logger.info('TooBusy.js shutdown complete.');

			this.memoryCacheLRU.clear();
			this.logger.info('Memory cache (LRU) cleared.');

			await this.clearCaches('resourceManager');
			this.logger.info('Caches cleared successfully.');

			await this.closeIdleConnections();
			this.logger.info('Idle database connections closed successfully.');

			this.logger.info('Resource Manager shutdown complete.');
		} catch (error) {
			this.handleResourceManagerError(
				error,
				'SHUTDOWN_ERROR',
				{},
				'Error during Resource Manager shutdown'
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
