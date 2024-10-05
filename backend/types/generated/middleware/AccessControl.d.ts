import { Request, Response, NextFunction } from 'express';
import { AccessControlMiddlewareServiceInterface } from '../index/interfaces/services';
export declare class AccessControlMiddlewareService implements AccessControlMiddlewareServiceInterface {
    private static instance;
    private logger;
    private constructor();
    static getInstance(): Promise<AccessControlMiddlewareService>;
    restrictTo(...allowedRoles: string[]): (req: Request, res: Response, next: NextFunction) => void;
    hasPermission(...requiredPermissions: string[]): (req: Request, res: Response, next: NextFunction) => void;
    private checkPermissions;
    shutdown(): Promise<void>;
}
//# sourceMappingURL=AccessControl.d.ts.map