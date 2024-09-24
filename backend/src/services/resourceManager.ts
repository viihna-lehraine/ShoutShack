import { ProcessErrorStaticParameters } from '../index/parameters';
import {
	AppLoggerInterface,
	ErrorHandlerInterface,
	MemoryMonitorInterface
} from '../index/interfaces';
import { ConfigService } from './configService';
import { AppError } from '../errors/errorClasses';
import { RedisClientType, createClient } from 'redis';
import { validateDependencies } from '../utils/helpers';
import os from 'os';
import fs from 'fs';
import { AppLogger, ErrorLogger } from './logger'; // Assuming AppLogger import is correct
import { ErrorHandler } from './errorHandler';

export class ResourceManager {
	private static instance: ResourceManager;
	private redisClient: RedisClientType | null = null;
	private memoryMonitor: MemoryMonitorInterface | null = null;
	private configService: ConfigService;
	private appLogger: AppLoggerInterface;

	constructor(
		private logger: AppLoggerInterface = AppLogger.getInstance().getRedactedLogger(),
		private errorLogger: AppLoggerInterface = ErrorLogger.getInstance().getRedactedLogger(),
		public errorHandler: ErrorHandlerInterface = errorHandler
	) {
		this.configService = ConfigService.getInstance();
		this.appLogger = logger;
	}

	public static getInstance(): ResourceManager {
		if (!ResourceManager.instance) {
			const logger = AppLogger.getInstance();
			const errorLogger = ConfigService.getInstance().getErrorLogger();
			const errorHandler = ErrorHandler.getInstance(
				new AppLogger(),
				new ErrorLogger()
			);

			ResourceManager.instance = new ResourceManager(
				logger,
				errorLogger,
				errorHandler
			);
		}
		return ResourceManager.instance;
	}

	public async connectRedis(): Promise<RedisClientType | null> {
		try {
			validateDependencies(
				[{ name: 'createRedisClient', instance: createClient }],
				this.appLogger
			);

			if (!this.configService.getFeatureFlags().enableRedis) {
				this.appLogger.debug('Redis is disabled');
				return null;
			}

			if (!this.redisClient) {
				const client: RedisClientType = createClient({
					url: this.configService.getEnvVariables().redisUrl,
					socket: {
						reconnectStrategy: retries => {
							const retryAfter = Math.min(retries * 100, 3000);
							this.errorLogger.logWarn(
								`Error connecting to Redis at ${this.configService.getEnvVariables().redisUrl}, retrying in ${retryAfter}ms. Retries: ${retries}`
							);
							if (retries >= 10) {
								this.handleCriticalRedisFailure(retries);
								this.createMemoryMonitor();
							}
							return retryAfter;
						}
					}
				});

				client.on('error', error => {
					this.errorHandler.handleError({ error });
				});

				await client.connect();
				this.appLogger.info('Connected to Redis');
				this.redisClient = client;
			}

			return this.redisClient;
		} catch (error) {
			this.errorHandler.handleError({
				...ProcessErrorStaticParameters,
				error,
				details: { reason: 'Failed to connect to Redis' }
			});
			return null;
		}
	}

	public async getRedisClient(): Promise<RedisClientType | null> {
		if (this.redisClient) {
			this.errorLogger.logInfo('Redis client is already connected');
		} else {
			this.errorLogger.logWarn(
				'Redis client is not connected, calling connectRedis()'
			);
			await this.connectRedis();
		}
		return this.redisClient;
	}

	public async flushRedisMemoryCache(): Promise<void> {
		this.appLogger.info('Flushing in-memory cache');
		const redisClient = await this.getRedisClient();

		if (this.configService.getFeatureFlags().enableRedis) {
			if (redisClient) {
				try {
					await redisClient.flushAll();
					this.appLogger.info('In-memory cache flushed');
				} catch (utilError) {
					const utilityError = new AppError(
						`Error flushing Redis cache: ${utilError instanceof Error ? utilError.message : utilError}`,
						500
					);
					this.errorLogger.logError(utilityError.message, {});
				}
			} else {
				this.errorLogger.logWarn(
					'Redis client is not available for cache flush'
				);
			}
		} else {
			this.errorLogger.logInfo('No cache to flush, as Redis is disabled');
		}
	}

	private createMemoryMonitor(): void {
		this.appLogger.info('Creating memory monitor as Redis is unavailable');

		setInterval(() => {
			const memoryUsage = process.memoryUsage();
			this.appLogger.info(`Memory Usage: ${JSON.stringify(memoryUsage)}`);
			if (
				memoryUsage.heapUsed >
				this.configService.getEnvVariables().memoryLimit
			) {
				this.manageMemory();
			}
		}, 10000);
	}

	private handleCriticalRedisFailure(retries: number): void {
		const serviceError = new AppError(
			`Redis Service unavailable after ${retries} retries`
		);
		this.errorLogger.logError(serviceError.message, {});
		this.appLogger.error(
			'Max retries reached when trying to initialize Redis. Falling back to memory monitor.'
		);
	}

	private manageMemory(): void {
		const memoryUsage = process.memoryUsage();
		const memoryLimit = this.configService.getEnvVariables().memoryLimit;
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

	private clearCaches(): void {
		this.logger.info('Clearing application caches...');
		// For example, if you have a cache object, you can clear it like this:
		// myCache.clear();
	}

	private closeIdleConnections(): void {
		this.logger.info('Closing idle database connections...');
		// Implement logic to close idle database connections or connections that are not used frequently
	}

	private removeTemporaryFiles(): void {
		const tempDir = this.configService.getEnvVariables().tempDir || '/tmp';
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
				this.appLogger.info(
					`CPU ${index + 1}: Usage ${usage.toFixed(2)}%`
				);
			});
		}, 5000);
	}

	public monitorDiskUsage(): void {
		const diskPath = this.configService.getEnvVariables().diskPath || '/';
		setInterval(() => {
			fs.stat(diskPath, (err, stats) => {
				if (err) {
					this.appLogger.error(`Error getting disk usage: ${err}`);
					return;
				}
				this.appLogger.info(`Disk usage: ${JSON.stringify(stats)}`);
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
						this.appLogger.info(
							`Interface ${interfaceName}: Address ${netStat.address}, Family ${netStat.family}, Internal ${netStat.internal}`
						);
					});
				}
			});
		}, 10000);
	}

	private processResourceError(error: AppError | Error): void {
		this.errorLogger.logError(error.message, {});
	}
}