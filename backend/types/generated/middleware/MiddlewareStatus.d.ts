import { MiddlewareStatusServiceInterface } from '../index/interfaces/main';
export declare class MiddlewareStatusService implements MiddlewareStatusServiceInterface {
    private static instance;
    private middlewareStatus;
    private logger;
    private errorLogger;
    private errorHandler;
    private constructor();
    static getInstance(): Promise<MiddlewareStatusService>;
    setStatus(middlewareName: string, status: 'on' | 'off'): void;
    getStatus(middlewareName: string): 'on' | 'off' | undefined | void;
    isMiddlewareOn(middlewareName: string): boolean;
    shutdown(): Promise<void>;
}
//# sourceMappingURL=MiddlewareStatus.d.ts.map