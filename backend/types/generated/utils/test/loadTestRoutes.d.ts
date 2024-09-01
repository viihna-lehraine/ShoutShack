import express, { Application } from 'express';
import { Logger } from 'winston';
interface LoadTestRoutesDependencies {
    app: Application;
    testRoutes: express.Router;
    logger: Logger;
    featureFlag: string | undefined;
}
export declare function loadTestRoutes({ app, testRoutes, logger, featureFlag }: LoadTestRoutesDependencies): void;
export default loadTestRoutes;
//# sourceMappingURL=loadTestRoutes.d.ts.map