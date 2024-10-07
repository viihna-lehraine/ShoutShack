import { Sequelize } from 'sequelize';
import { DatabaseControllerInterface } from '../index/interfaces/main';
import { ModelOperations } from '../index/interfaces/models';
export declare class DatabaseController implements DatabaseControllerInterface {
    private static instance;
    private logger;
    private errorLogger;
    private errorHandler;
    private envConfig;
    private vault;
    private cacheService;
    private sequelizeInstance;
    private attempt;
    private constructor();
    static getInstance(): Promise<DatabaseController>;
    getSequelizeInstance(): Sequelize;
    private connect;
    initialize(): Promise<Sequelize>;
    private tryInitDB;
    getEntries<T>(Model: ModelOperations<T>): Promise<T[]>;
    createEntry<T>(Model: ModelOperations<T>, data: T): Promise<T>;
    deleteEntry<T>(Model: ModelOperations<T>, id: number): Promise<boolean>;
    clearIdleConnections(): Promise<void>;
    cacheData<T>(key: string, data: T, expiration?: number): Promise<void>;
    queryWithCache<T extends object>(query: string, cacheKey: string, expiration?: number): Promise<T | null>;
    getCachedData<T>(key: string): Promise<T | null>;
    clearCache(key: string): Promise<void>;
    getDatabaseInfo(): Promise<Record<string, unknown>>;
    getDatabaseMetrics(serviceName: string): Promise<Record<string, unknown>>;
    shutdown(): Promise<void>;
    private handleDBErrorRecoverable;
    private handleDBErrorFatal;
}
//# sourceMappingURL=DatabaseController.d.ts.map