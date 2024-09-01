import { NextFunction, Request, Response } from 'express';
import validator from 'validator';
interface ValidatorDependencies {
    validator: typeof validator;
}
export declare function createValidatorMiddleware({ validator }: ValidatorDependencies): {
    validateEntry: (req: Request, res: Response, next: NextFunction) => void;
    registrationValidationRules: (req: Request, res: Response, next: NextFunction) => void;
};
export {};
//# sourceMappingURL=validator.d.ts.map