import express, { NextFunction, Request, Response, Router } from 'express';
import { validationResult } from 'express-validator';
import { processError } from '../errors/processError';
import { initializeValidatorMiddleware } from '../middleware/validator';
import { Logger } from '../services/appLogger';
import { validateDependencies } from '../utils/helpers';

interface ValidationRouteDependencies {
	appLogger: Logger;
	validator: typeof import('validator');
}

export default function initializeValidationRoutes({
	appLogger,
	validator
}: ValidationRouteDependencies): Router {
	const router = express.Router();

	try {
		validateDependencies(
			[{ name: 'validator', instance: validator }],
			appLogger || console
		);

		const { registrationValidationRules } = initializeValidatorMiddleware({
			validator,
			appLogger
		});

		router.post(
			'/register',
			registrationValidationRules,
			async (req: Request, res: Response, next: NextFunction) => {
				try {
					const errors = validationResult(req);

					if (!errors.isEmpty()) {
						appLogger.error('Validation failed during registration', {
							errors: errors.array()
						});
						return res.status(400).json({ errors: errors.array() });
					}

					return next();
				} catch (error) {
					processError(error as Error, appLogger, req);
					return res.status(500).json({
						error: 'Internal server error during validation'
					});
				}
			}
		);
	} catch (error) {
		processError(error as Error, appLogger);
		throw error;
	}

	return router;
}
