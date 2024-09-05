import csrf from 'csrf';
import { Request, Response, NextFunction } from 'express';
import { Logger } from '../config/logger';
interface CsrfDependencies {
    logger: Logger;
    csrfProtection: csrf;
}
export declare function initializeCsrfMiddleware({ logger, csrfProtection }: CsrfDependencies): (req: Request, res: Response, next: NextFunction) => void;
export {};
//# sourceMappingURL=csrf.d.ts.map