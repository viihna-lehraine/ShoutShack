import { Router } from 'express';
import { Logger } from '../config/logger';
interface ValidationRouteDependencies {
    logger: Logger;
    validator: typeof import('validator');
}
export default function initializeValidationRoutes({ logger, validator }: ValidationRouteDependencies): Router;
export {};
//# sourceMappingURL=validationRoutes.d.ts.map