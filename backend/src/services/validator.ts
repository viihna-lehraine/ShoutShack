import { NextFunction, Request, Response } from 'express';
import { ValidatorInterface } from '../index/interfaces';
import { ServiceFactory } from '../index/factory';
import { validationResult } from 'express-validator';
import { ValidatorServiceInterface } from '../index/interfaces';

export class ValidatorService implements ValidatorServiceInterface {
	private validator: typeof import('validator');
	private logger = ServiceFactory.getLoggerService();
	private errorLogger = ServiceFactory.getErrorLoggerService();
	private errorHandler = ServiceFactory.getErrorHandlerService();

	constructor(validator: ValidatorInterface['validator']) {
		this.validator = validator;
	}

	public validateEntry(
		req: Request,
		res: Response,
		next: NextFunction
	): void {
		const errors: Array<{ msg: string; param: string }> = [];

		if (this.validator.isEmpty(req.body.name || '')) {
			errors.push({ msg: 'Name is required', param: 'name' });
		}

		if (this.validator.isEmpty(req.body.message || '')) {
			errors.push({ msg: 'Message is required', param: 'message' });
		}

		if (errors.length) {
			this.logger.warn(
				`Validation failed for entry creation: ${JSON.stringify(errors)}`
			);
			res.status(400).json({ errors });
			return;
		}

		this.logger.info('Validation passed for entry creation');
		next();
	}

	public registrationValidationRules(
		req: Request,
		res: Response,
		next: NextFunction
	): void {
		const errors: Array<{ msg: string; param: string }> = [];

		try {
			if (!this.validator.isLength(req.body.username || '', { min: 3 })) {
				errors.push({
					msg: 'Username must be at least 3 characters long',
					param: 'username'
				});
			}

			if (!this.validator.matches(req.body.username || '', /^[\w-]+$/)) {
				errors.push({
					msg: 'Username can only contain letters, numbers, underscores, and hyphens',
					param: 'username'
				});
			}

			if (!this.validator.isEmail(req.body.email || '')) {
				errors.push({
					msg: 'Please provide a valid email address',
					param: 'email'
				});
			}

			if (!this.validator.isLength(req.body.password || '', { min: 8 })) {
				errors.push({
					msg: 'Password must be at least 8 characters long',
					param: 'password'
				});
			}

			if (!this.validator.matches(req.body.password || '', /[A-Z]/)) {
				errors.push({
					msg: 'Password must contain at least one uppercase letter',
					param: 'password'
				});
			}

			if (!this.validator.matches(req.body.password || '', /[a-z]/)) {
				errors.push({
					msg: 'Password must contain at least one lowercase letter',
					param: 'password'
				});
			}

			if (!this.validator.matches(req.body.password || '', /\d/)) {
				errors.push({
					msg: 'Password must contain at least one digit',
					param: 'password'
				});
			}

			if (
				!this.validator.matches(req.body.password || '', /[^\dA-Za-z]/)
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
				this.logger.info(
					`Validation failed for registration: ${JSON.stringify(errors)}`
				);
				res.status(400).json({ errors });
				return;
			}

			this.logger.info('Validation passed for registration');
			next();
		} catch (error) {
			const expressMiddlewareError =
				new this.errorHandler.ErrorClasses.ExpressError(
					`Error during registration validation: ${error instanceof Error ? error.message : 'Unknown error'}`,
					{ exposeToClient: false }
				);
			this.errorLogger.logError(expressMiddlewareError.message);
			this.errorHandler.expressErrorHandler()(
				expressMiddlewareError,
				req,
				res,
				next
			);
		}
	}

	public handleValidationErrors(
		req: Request,
		res: Response,
		next: NextFunction
	): Response | void {
		const errors = validationResult(req);

		if (!errors.isEmpty()) {
			this.logger.logError('Validation failed', {
				errors: errors.array()
			});
			return res.status(400).json({ errors: errors.array() });
		}

		next();
	}
}
