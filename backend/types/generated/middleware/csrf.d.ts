import csrf from 'csrf';
import { Request, Response, NextFunction } from 'express';
interface CsrfDependencies {
    featureFlags: ReturnType<typeof import('../utils/featureFlags').getFeatureFlags>;
    logger: ReturnType<typeof import('../config/logger').default>;
    csrfProtection: csrf;
}
export declare function createCsrfMiddleware({ featureFlags, logger, csrfProtection }: CsrfDependencies): (req: Request, res: Response, next: NextFunction) => void;
export {};
//# sourceMappingURL=csrf.d.ts.map