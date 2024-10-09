import { ResourceManagerInterface } from '../index/interfaces/main';
export declare class ResourceManager implements ResourceManagerInterface {
    private static instance;
    private logger;
    private errorLogger;
    private errorHandler;
    private envConfig;
    private cacheService;
    private memoryCacheLRU;
    private constructor();
    static getInstance(): Promise<ResourceManager>;
    getCpuUsage(): Array<{
        core: number;
        usage: string;
    }>;
    adjustResources(): void;
    getMemoryUsage(): {
        heapUsed: number;
        heapTotal: number;
        heapUsedPercentage: number;
        memoryLimit: number;
        isMemoryHealthy: boolean;
    };
    getDiskUsage(): Promise<Record<string, unknown>>;
    getNetworkUsage(): Record<string, unknown>[];
    private adjustMemory;
    private manageMemory;
    evictCacheEntries(service: string): void;
    updateCacheAccessLRU(key: string): void;
    private autoScaleResources;
    private throttleBackgroundProcesses;
    getFromCache<T>(key: string, service: string): Promise<T | null>;
    saveToCache<T>(key: string, value: T, service: string, expiration: number): Promise<void>;
    clearCaches(service: string): Promise<void>;
    closeIdleConnections(): Promise<void>;
    private removeTemporaryFiles;
    private adjustCPU;
    private slowDownBackgroundProcesses;
    private pauseNonEssentialTasks;
    private handleOverload;
    shutdown(): Promise<void>;
    private handleResourceManagerError;
}
//# sourceMappingURL=ResourceManager.d.ts.map