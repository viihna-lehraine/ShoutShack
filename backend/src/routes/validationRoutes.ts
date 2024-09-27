import express, { NextFunction, Request, Response, Router } from 'express';
import { validationResult } from 'express-validator';
import { initializeValidatorMiddleware } from '../middleware/validator';
import { validateDependencies } from '../utils/helpers';
import { ServiceFactory } from '../index/factory';

interface ValidationRouteDependencies {
	validator: typeof import('validator');
}

export default function initializeValidationRoutes({
	validator
}: ValidationRouteDependencies): Router {
	const router = express.Router();
	const logger = ServiceFactory.getLoggerService();
	const errorLogger = ServiceFactory.getErrorLoggerService();
	const errorHandler = ServiceFactory.getErrorHandlerService();

	try {
		validateDependencies(
			[{ name: 'validator', instance: validator }],
			logger || console
		);

		const { registrationValidationRules } = initializeValidatorMiddleware({
			validator
		});

		router.post(
			'/register',
			registrationValidationRules,
			async (req: Request, res: Response, next: NextFunction) => {
				try {
					const errors = validationResult(req);

					if (!errors.isEmpty()) {
						logger.logError(
							'Validation failed during registration',
							{ errors: errors.array() }
						);
						return res.status(400).json({ errors: errors.array() });
					}

					return next();
				} catch (error) {
					errorHandler.expressErrorHandler()(
						error as Error,
						req,
						res,
						next
					);
					errorLogger.logError(
						'Validation for user registration failed'
					);
					return res.status(500).json({
						error: 'Internal server error during validation'
					});
				}
			}
		);
	} catch (error) {
		errorHandler.handleError({ error });
		errorLogger.logError(
			'Error occurred during validation route initialization'
		);
		throw error;
	}

	return router;
}
