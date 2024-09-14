import express from 'express';
import { Logger } from '../utils/logger';
interface StaticRoutesDependencies {
    logger: Logger;
    staticRootPath: string;
    secretsPath: string;
}
export declare function setupStaticRoutes({ logger, staticRootPath, secretsPath }: StaticRoutesDependencies): express.Router;
export declare function initializeStaticRoutes(app: express.Application, staticRootPath: string, logger: Logger): void;
export {};
//# sourceMappingURL=staticRoutes.d.ts.map
