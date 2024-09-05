import express, { Request, Response, NextFunction, Router } from 'express';
import { validationResult } from 'express-validator';
import { Logger } from '../config/logger';
import { initializeValidatorMiddleware } from '../middleware/validator';
import { processError } from '../utils/processError';
import { validateDependencies } from '../utils/validateDependencies';

interface ValidationRouteDependencies {
	logger: Logger;
	validator: typeof import('validator');
}

export default function initializeValidationRoutes({
	logger,
	validator
}: ValidationRouteDependencies): Router {
	const router = express.Router();

	try {
		validateDependencies(
			[
				{ name: 'logger', instance: logger },
				{ name: 'validator', instance: validator }
			],
			logger || console
		);

		const { registrationValidationRules } = initializeValidatorMiddleware({
			validator,
			logger
		});

		router.post(
			'/register',
			registrationValidationRules,
			async (req: Request, res: Response, next: NextFunction) => {
				try {
					const errors = validationResult(req);

					if (!errors.isEmpty()) {
						logger.error('Validation failed during registration', {
							errors: errors.array()
						});
						return res.status(400).json({ errors: errors.array() });
					}

					return next();
				} catch (error) {
					processError(error as Error, logger, req);
					return res.status(500).json({
						error: 'Internal server error during validation'
					});
				}
			}
		);
	} catch (error) {
		processError(error as Error, logger);
		throw error;
	}

	return router;
}
