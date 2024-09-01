import { Router } from 'express';
interface TestRouteDependencies {
    logger: {
        info: (msg: string) => void;
    };
}
export default function createTestRouter(deps: TestRouteDependencies): Router;
export {};
//# sourceMappingURL=testRoutes.d.ts.map