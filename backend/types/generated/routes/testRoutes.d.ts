import { Application, Router } from 'express';
import { Logger } from '../utils/logger';
import { FeatureFlags } from '../config/environmentConfig';
interface TestRouteDependencies {
    app: Application;
    logger: Logger;
    featureFlags: FeatureFlags;
    environmentVariables: typeof import('../config/environmentConfig').environmentVariables;
}
export declare function initializeTestRoutes({ app, logger, featureFlags, environmentVariables }: TestRouteDependencies): Router;
export {};
//# sourceMappingURL=testRoutes.d.ts.map
