import express from 'express';
import { Logger } from './config/logger';
import { FeatureFlags } from './config/environmentConfig';
interface RouteDependencies {
    app: express.Application;
    logger: Logger;
    featureFlags: FeatureFlags;
    staticRootPath: string;
}
export declare function initializeRoutes({ app, logger, featureFlags, staticRootPath }: RouteDependencies): Promise<undefined>;
export {};
//# sourceMappingURL=setupRoutes.d.ts.map