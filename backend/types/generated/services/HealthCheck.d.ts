import { HealthCheckServiceInterface } from '../index/interfaces/main';
export declare class HealthCheckService implements HealthCheckServiceInterface {
    private static instance;
    private logger;
    private errorLogger;
    private errorHandler;
    private envConfig;
    private cacheService;
    private redisService;
    private resourceManager;
    private databaseController;
    private httpsServer;
    private healthCheckHistory;
    private thresholdBreaches;
    private healthCheckInterval;
    private constructor();
    static getInstance(): Promise<HealthCheckService>;
    performHealthCheck(): Promise<Record<string, unknown>>;
    getHTTPSServerMetrics(serviceName: string): Promise<Record<string, unknown>>;
    getHealthCheckHistory(): Array<Record<string, unknown>>;
    getHealthDataForDashboard(): Promise<Record<string, unknown>>;
    monitorEventLoopLag(): void;
    monitorCPU(): void;
    monitorMemoryUsage(): void;
    monitorDiskUsage(): void;
    monitorCacheSize(): void;
    monitorNetworkUsage(): void;
    private saveHealthCheckToHistory;
    private checkThresholds;
    private triggerAlert;
    private autoRecover;
    private logThresholdBreach;
    shutdown(): Promise<void>;
    private handleHealthCheckError;
}
//# sourceMappingURL=HealthCheck.d.ts.map