import express from 'express';
import { Logger } from '../config/logger';
interface StaticRoutesDependencies {
    logger: Logger;
    staticRootPath: string;
    appJsPath: string;
    secretsPath: string;
    browserConfigXmlPath: string;
    humansMdPath: string;
    robotsTxtPath: string;
}
export declare function setupStaticRoutes({ logger, staticRootPath, appJsPath, secretsPath, browserConfigXmlPath, humansMdPath, robotsTxtPath }: StaticRoutesDependencies): express.Router;
export declare function initializeStaticRoutes(app: express.Application, staticRootPath: string, logger: Logger): void;
export {};
//# sourceMappingURL=staticRoutes.d.ts.map