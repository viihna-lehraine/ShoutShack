import { Application, Router } from 'express';
import { Logger } from '../utils/logger';
import { FeatureFlags } from '../config/envConfig';
interface TestRouteDependencies {
    app: Application;
    logger: Logger;
    featureFlags: FeatureFlags;
    environmentVariables: typeof import('../config/envConfig').environmentVariables;
}
export declare function initializeTestRoutes({ app, logger, featureFlags, environmentVariables }: TestRouteDependencies): Router;
export {};
//# sourceMappingURL=testRoutes.d.ts.map
