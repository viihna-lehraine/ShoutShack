import { NextFunction, Request, Response } from 'express';
import validator from 'validator';
import { Logger } from '../config/logger';
interface ValidatorDependencies {
    validator: typeof validator;
    logger: Logger;
}
export declare function initializeValidatorMiddleware({ validator, logger }: ValidatorDependencies): {
    validateEntry: (req: Request, res: Response, next: NextFunction) => void;
    registrationValidationRules: (req: Request, res: Response, next: NextFunction) => void;
};
export {};
//# sourceMappingURL=validator.d.ts.map