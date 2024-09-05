import express, { Request, Response, NextFunction, Router } from 'express';
import { validationResult } from 'express-validator';
import { Logger } from '../config/logger';
import { createValidatorMiddleware } from '../middleware/validator';
import {
	handleGeneralError,
	validateDependencies
} from '../middleware/errorHandler';

const { registrationValidationRules } = createValidatorMiddleware({
	logger: Logger,
	validator: (await import('validator')).default
});

export default function createValidationRoutes(): Router {
	const router = express.Router();

	router.post(
		'/register',
		registrationValidationRules,
		async (req: Request, res: Response, next: NextFunction) => {
			const errors = validationResult(req);

			// check for validation errors
			if (!errors.isEmpty()) {
				logger.error('Validation failed during registration', {
					errors: errors.array()
				});
				return res.status(400).json({ errors: errors.array() });
			}

			return next();
		}
	);

	return router;
}
