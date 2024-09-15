import express from 'express';
import { FeatureFlags } from './config/envConfig';
import { Logger } from './utils/logger';
interface RouteDependencies {
    app: express.Application;
    logger: Logger;
    featureFlags: FeatureFlags;
    staticRootPath: string;
}
export declare function initializeRoutes({ app, logger, featureFlags, staticRootPath }: RouteDependencies): Promise<undefined>;
export {};
//# sourceMappingURL=setupRoutes.d.ts.map
