import { NextFunction, Request, Response } from 'express';
import validator from 'validator';
import { Logger } from '../config/logger';
import {
	handleGeneralError,
	validateDependencies
} from '../middleware/errorHandler';

interface ValidatorDependencies {
	validator: typeof validator;
	logger: Logger;
}

export function createValidatorMiddleware({
	validator,
	logger
}: ValidatorDependencies): {
	validateEntry: (req: Request, res: Response, next: NextFunction) => void;
	registrationValidationRules: (
		req: Request,
		res: Response,
		next: NextFunction
	) => void;
} {
	try {
		validateDependencies(
			[
				{ name: 'validator', instance: validator },
				{ name: 'logger', instance: logger }
			],
			logger || console
		);

		const validateEntry = (
			req: Request,
			res: Response,
			next: NextFunction
		): void => {
			const errors: Array<{ msg: string; param: string }> = [];

			if (validator.isEmpty(req.body.name || '')) {
				errors.push({ msg: 'Name is required', param: 'name' });
			}

			if (validator.isEmpty(req.body.message || '')) {
				errors.push({ msg: 'Message is required', param: 'message' });
			}

			if (errors.length) {
				logger.warn(
					`Validation failed for entry creation: ${JSON.stringify(errors)}`
				);
				res.status(400).json({ errors });
				return;
			}

			logger.info('Validation passed for entry creation');
			next();
		};

		const registrationValidationRules = (
			req: Request,
			res: Response,
			next: NextFunction
		): void => {
			const errors: Array<{ msg: string; param: string }> = [];

			try {
				if (!validator.isLength(req.body.username || '', { min: 3 })) {
					errors.push({
						msg: 'Username must be at least 3 characters long',
						param: 'username'
					});
				}

				if (!validator.matches(req.body.username || '', /^[\w-]+$/)) {
					errors.push({
						msg: 'Username can only contain letters, numbers, underscores, and hyphens',
						param: 'username'
					});
				}

				if (!validator.isEmail(req.body.email || '')) {
					errors.push({
						msg: 'Please provide a valid email address',
						param: 'email'
					});
				}

				if (!validator.isLength(req.body.password || '', { min: 8 })) {
					errors.push({
						msg: 'Password must be at least 8 characters long',
						param: 'password'
					});
				}
				if (!validator.matches(req.body.password || '', /[A-Z]/)) {
					errors.push({
						msg: 'Password must contain at least one uppercase letter',
						param: 'password'
					});
				}
				if (!validator.matches(req.body.password || '', /[a-z]/)) {
					errors.push({
						msg: 'Password must contain at least one lowercase letter',
						param: 'password'
					});
				}
				if (!validator.matches(req.body.password || '', /\d/)) {
					errors.push({
						msg: 'Password must contain at least one digit',
						param: 'password'
					});
				}

				if (
					!validator.matches(req.body.password || '', /[^\dA-Za-z]/)
				) {
					errors.push({
						msg: 'Password must contain at least one special character',
						param: 'password'
					});
				}

				if (req.body.password !== req.body.confirmPassword) {
					errors.push({
						msg: 'Passwords do not match',
						param: 'confirmPassword'
					});
				}

				if (errors.length) {
					logger.warn(
						`Validation failed for registration: ${JSON.stringify(errors)}`
					);
					res.status(400).json({ errors });
					return;
				}

				logger.info('Validation passed for registration');
				next();
			} catch (err) {
				handleGeneralError(err, logger || console, req);
				res.status(500).json({ error: 'Internal Server Error' });
			}
		};

		return {
			validateEntry,
			registrationValidationRules
		};
	} catch (error) {
		handleGeneralError(error, logger || console);
		throw error;
	}
}
