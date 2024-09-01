import express from 'express';
interface StaticRoutesDependencies {
    logLevel?: string;
    logDirectory?: string;
    serviceName?: string;
    isProduction?: boolean;
    staticRootPath: string;
    appMjsPath: string;
    appJsPath: string;
    secretsPath: string;
    browserConfigXmlPath: string;
    humansMdPath: string;
    robotsTxtPath: string;
}
export declare function setupStaticRoutes(deps: StaticRoutesDependencies): express.Router;
export declare function initializeStaticRoutes(app: express.Application): void;
export {};
//# sourceMappingURL=staticRoutes.d.ts.map