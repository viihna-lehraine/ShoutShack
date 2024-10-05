import express, { Request, Response, NextFunction } from 'express';
import { RootMiddlewareServiceInterface } from '../index/interfaces/services';
export declare class RootMiddlewareService implements RootMiddlewareServiceInterface {
    private static instance;
    private logger;
    private errorLogger;
    private errorHandler;
    private middlewareStatusService;
    private totalResponseTime;
    private requestCount;
    private errorCount;
    private openConnections;
    private requestsPerSecond;
    private requestStatsInterval;
    private constructor();
    static getInstance(): Promise<RootMiddlewareService>;
    initialize(): Promise<void>;
    trackResponseTime(req: Request, res: Response, next: NextFunction): void;
    calculateRequestsPerSecond(): void;
    getAverageResponseTime(): number;
    private logMetrics;
    private xmlParserMiddleware;
    applyMiddlewares(app: express.Application): Promise<void>;
    shutdown(): Promise<void>;
}
//# sourceMappingURL=Root.d.ts.map