import toobusy from 'toobusy-js';
import express from 'express';
import { HealthCheckServiceInterface } from '../index/interfaces/services';
import { ServiceFactory } from '../index/factory';
import fs from 'fs';
import os from 'os';

export class HealthCheckService implements HealthCheckServiceInterface {
	private static instance: HealthCheckService | null = null;
	private logger = ServiceFactory.getLoggerService();
	private errorLogger = ServiceFactory.getErrorLoggerService();
	private errorHandler = ServiceFactory.getErrorHandlerService();
	private envConfig = ServiceFactory.getEnvConfigService();
	private cacheService = ServiceFactory.getCacheService();
	private redisService = ServiceFactory.getRedisService();
	private resourceManager = ServiceFactory.getResourceManager();
	private databaseController = ServiceFactory.getDatabaseController();
	private httpsServer = ServiceFactory.getHTTPSServer(express.application);
	private healthCheckHistory: Record<string, unknown>[] = [];
	private thresholdBreaches: Array<Record<string, unknown>> = [];
	private healthCheckInterval: NodeJS.Timeout | null = null;

	private constructor() {
		setInterval(() => {
			this.performHealthCheck();
		}, 10000);
	}

	public static getInstance(): HealthCheckService {
		if (!HealthCheckService.instance) {
			HealthCheckService.instance = new HealthCheckService();
		}

		return HealthCheckService.instance;
	}

	public async performHealthCheck(): Promise<Record<string, unknown>> {
		try {
			const databaseInfo =
				await this.databaseController.getDatabaseInfo();
			const httpsServerInfo = await this.httpsServer.getHTTPSServerInfo();
			const redisInfo = await this.redisService.getRedisInfo();

			const databaseHealth = {
				status: databaseInfo ? 'Connected' : 'Not connected',
				uptime: databaseInfo?.uptime_in_seconds ?? 0,
				cpuUsed: databaseInfo?.used_cpu_sys ?? 0,
				memoryUsed: databaseInfo?.used_memory ?? 0,
				cacheSize: databaseInfo?.cacheSize ?? 0,
				connectedClients: databaseInfo?.connected_clients ?? 0
			};

			const httpsServerHealth = {
				status: httpsServerInfo ? 'Connected' : 'Not connected',
				uptime: httpsServerInfo?.uptime_in_seconds ?? 0,
				cpuUsed: httpsServerInfo?.used_cpu_sys ?? 0,
				memoryUsed: httpsServerInfo?.used_memory ?? 0,
				cacheSize: httpsServerInfo?.cacheSize ?? 0,
				connectedClients: httpsServerInfo?.connected_clients ?? 0,
				serverMetrics: this.getServerMetrics()
			};

			const redisHealth = {
				status: redisInfo ? 'Connected' : 'Not connected',
				uptime: redisInfo?.uptime_in_seconds ?? 0,
				memoryUsed: redisInfo?.used_memory ?? 0,
				cacheSize: redisInfo?.db0_size ?? 0,
				connectedClients: redisInfo?.connected_clients ?? 0
			};

			const healthSummary: Record<string, unknown> = {
				timestamp: new Date().toISOString(),
				databaseStatus: databaseHealth ? 'Connected' : 'Not connected',
				redisStatus: redisHealth ? 'Connected' : 'Not connected',
				cacheServiceMetrics:
					this.cacheService.getCacheMetrics('healthCheckService'),
				databaseControllerMetrics:
					this.databaseController.getDatabaseMetrics(
						'healthCheckService'
					),
				httpsServerMetrics:
					this.httpsServer.getHTTPSServerMetrics(
						'healthCheckService'
					),
				redisServiceMetrics: this.redisService.getRedisInfo(),
				eventLoopLag: toobusy.lag(),
				cpuUsage: this.resourceManager.getCpuUsage(),
				memoryUsage: this.resourceManager.getMemoryUsage(),
				diskUsage: await this.resourceManager.getDiskUsage(),
				networkStatus: this.resourceManager.getNetworkUsage(),
				eventLoopLagThreshold: this.envConfig.getEnvVariable(
					'eventLoopLagThreshold'
				),
				cpuThreshold: this.envConfig.getEnvVariable('cpuThreshold'),
				cpuLimit: this.envConfig.getEnvVariable('cpuLimit'),
				memoryThreshold:
					this.envConfig.getEnvVariable('memoryThreshold'),
				memoryLimit: this.envConfig.getEnvVariable('memoryLimit'),
				maxCacheSize: this.envConfig.getEnvVariable('maxCacheSize'),
				maxRedisCacheSize:
					this.envConfig.getEnvVariable('maxRedisCacheSize')
			};

			this.saveHealthCheckToHistory(healthSummary);
			this.logger.debug(`Health Check: ${JSON.stringify(healthSummary)}`);
			return healthSummary;
		} catch (error) {
			this.handleHealthCheckError(
				error,
				'HEALTH_CHECK_ERROR',
				{},
				'Error performing health check'
			);
			return {};
		}
	}

	public getServerMetrics(): Record<string, unknown> {
		const serverMetrics =
			this.httpsServer.getServiceMetrics('healthCheckService');
		return {
			averageResponseTime: serverMetrics.averageResponseTime,
			requestRate: serverMetrics.requestsPerSecond,
			openConnections: serverMetrics.openConnections
		};
	}

	public getHealthCheckHistory(): Array<Record<string, unknown>> {
		return this.healthCheckHistory;
	}

	public async getHealthDataForDashboard(): Promise<Record<string, unknown>> {
		return {
			currentHealth: await this.performHealthCheck(),
			history: this.getHealthCheckHistory()
		};
	}

	public monitorEventLoopLag(): void {
		try {
			const lagThreshold =
				this.envConfig.getEnvVariable('eventLoopLagThreshold') || 70;

			setInterval(() => {
				const lag = toobusy.lag();

				if (lag > lagThreshold) {
					this.logger.warn(`High event loop lag detected: ${lag}ms`);
					this.resourceManager.adjustResources();
				}
			}, 10000);
		} catch (error) {
			this.handleHealthCheckError(
				error,
				'EVENT_LOOP_LAG_MONITOR_ERROR',
				{},
				'Error monitoring event loop lag'
			);
		}
	}

	public monitorCPU(): void {
		setInterval(() => {
			const cpuUsage = this.resourceManager.getCpuUsage();
			cpuUsage.forEach(({ core, usage }) => {
				this.logger.info(`CPU ${core}: Usage ${usage}`);
			});
			this.resourceManager.adjustResources();
		}, 5000);
	}

	public monitorMemoryUsage(): void {
		setInterval(() => {
			const memoryUsage = this.resourceManager.getMemoryUsage();
			this.logger.info(`Memory Usage: ${JSON.stringify(memoryUsage)}`);
			const memoryLimit = this.envConfig.getEnvVariable('memoryLimit');
			if (memoryUsage.heapUsed > memoryLimit) {
				this.logger.warn(
					`Memory usage exceeded limit (${memoryLimit} bytes). Adjusting resources...`
				);
				this.resourceManager.adjustResources();
			}
		}, 10000);
	}

	public monitorDiskUsage(): void {
		try {
			const diskPath = this.envConfig.getEnvVariable('diskPath') || '/';
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
			this.handleHealthCheckError(
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
			if (cacheSize > this.envConfig.getEnvVariable('maxCacheSize')) {
				this.logger.warn(
					`Cache size exceeded limit. Clearing old entries...`
				);
				this.resourceManager.evictCacheEntries('resourceManager');
			}
		} else {
			this.logger.error('Error getting cache size');
		}
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
			this.handleHealthCheckError(
				error,
				'NETWORK_MONITOR_ERROR',
				{},
				'Error monitoring network usage'
			);
		}
	}

	private saveHealthCheckToHistory(
		healthCheckData: Record<string, unknown>
	): void {
		if (this.healthCheckHistory.length >= 100) {
			this.healthCheckHistory.shift();
		}
		this.healthCheckHistory.push(healthCheckData);
	}

	private checkThresholds(healthSummary: Record<string, unknown>): void {
		const eventLoopLag = healthSummary.eventLoopLag as number;
		const cpuUsage = healthSummary.cpuUsage as Array<{
			core: number;
			usage: string;
		}>;
		const memoryUsage = healthSummary.memoryUsage as {
			heapUsed: number;
			heapTotal: number;
		};

		if (
			eventLoopLag >
			this.envConfig.getEnvVariable('eventLoopLagThreshold')
		) {
			this.triggerAlert(
				'Event Loop Lag exceeded threshold',
				eventLoopLag
			);
		}

		if (
			cpuUsage.some(
				cpu =>
					parseFloat(cpu.usage) >
					this.envConfig.getEnvVariable('cpuThreshold')
			)
		) {
			this.triggerAlert('CPU Usage exceeded threshold', cpuUsage);
		}

		if (
			memoryUsage.heapUsed >
			this.envConfig.getEnvVariable('memoryThreshold')
		) {
			this.triggerAlert(
				'Memory Usage exceeded threshold',
				memoryUsage.heapUsed
			);
		}
	}

	private triggerAlert(message: string, value: unknown): void {
		this.logger.warn(`${message}: ${value}`);
		// *DEV-NOTE* email alert + webhook notification here.
	}

	private autoRecover(healthSummary: Record<string, unknown>): void {
		const memoryUsage = healthSummary.memoryUsage as {
			heapUsed: number;
			heapTotal: number;
		};

		if (
			memoryUsage.heapUsed > this.envConfig.getEnvVariable('memoryLimit')
		) {
			this.logger.warn('Memory usage high, attempting recovery...');
			const serviceName = 'healthCheckService'; // Specify the service name

			this.resourceManager.clearCaches(serviceName).catch(err => {
				this.logger.error(
					`Failed to clear caches for service: ${serviceName}`,
					err
				);
			});
			this.resourceManager.closeIdleConnections().catch(err => {
				this.logger.error('Failed to close idle connections', err);
			});
		}
	}

	private logThresholdBreach(metric: string, value: unknown): void {
		this.thresholdBreaches.push({
			metric,
			value,
			timestamp: new Date().toISOString()
		});
		if (this.thresholdBreaches.length > 100) {
			this.thresholdBreaches.shift();
		}
	}

	public async shutdown(): Promise<void> {
		try {
			this.logger.info('Shutting down HealthCheckService...');

			if (this.healthCheckInterval) {
				clearInterval(this.healthCheckInterval);
				this.logger.info('Health check interval cleared.');
			}

			await this.cacheService.clearNamespace('healthCheckService');
			this.logger.info('Health check cache cleared.');

			if (toobusy) {
				toobusy.shutdown();
				this.logger.info('Toobusy.js shutdown complete.');
			}

			this.logger.info('HealthCheckService shutdown completed.');
		} catch (error) {
			this.handleHealthCheckError(
				error,
				'SHUTDOWN_ERROR',
				{},
				'Error during HealthCheckService shutdown'
			);
		}
	}

	private handleHealthCheckError(
		error: unknown,
		errorHeader: string,
		errorDetails: object,
		customMessage: string
	): void {
		try {
			const errorMessage = `${customMessage}: ${error}\n${error instanceof Error ? error.stack : ''}`;
			this.errorLogger.logError(errorMessage);
			const healthCheckError =
				new this.errorHandler.ErrorClasses.ResourceManagerError(
					errorHeader,
					{
						details: errorDetails,
						exposeToClient: false
					}
				);

			this.errorHandler.handleError({
				error: healthCheckError
			});
		} catch (error) {
			this.errorLogger.logError(
				`Error handling health check error: ${error}`
			);
			const severity = this.errorHandler.ErrorSeverity.WARNING;
			this.errorHandler.handleError({
				error,
				details: {
					context: 'Health Check Service',
					action: 'Passing error from health check error handler to ErrorHandlerService',
					notes: 'Error occurred while handling Health Check error: ResourceManager.handleResourceManagerError'
				},
				severity
			});
		}
	}
}
