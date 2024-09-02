import express, { Request, Response, NextFunction, Router } from 'express';
import { validationResult } from 'express-validator';
import { createValidatorMiddleware } from '../middleware/validator';
import { Logger, setupLogger } from '../config/logger';

const logger: Logger = setupLogger();

const { registrationValidationRules } = createValidatorMiddleware({
	validator: (await import('validator')).default,
	logger
});

export default function createValidationRoutes(): Router {
	const router = express.Router();

	router.post(
		'/register',
		registrationValidationRules,
		async (req: Request, res: Response, next: NextFunction) => {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				logger.error('Validation failed', { errors: errors.array() });
				return res.status(400).json({ errors: errors.array() });
			}

			return next();
		}
	);

	return router;
}
