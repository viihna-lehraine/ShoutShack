import { NextFunction, Request, Response } from 'express';
import validator from 'validator';

export const validateEntry = (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	const errors = [];

	// Name validation
	if (validator.isEmpty(req.body.name || '')) {
		errors.push({ msg: 'Name is required', param: 'name' });
	}

	// Message validation
	if (validator.isEmpty(req.body.message || '')) {
		errors.push({ msg: 'Message is required', param: 'message' });
	}

	if (errors.length) {
		return res.status(400).json({ errors });
	}

	return next;
};

export const registrationValidationRules = (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	const errors = [];

	// Username validation
	if (!validator.isLength(req.body.username || '', { min: 3 })) {
		errors.push({
			msg: 'Username must be at least 3 characters long',
			param: 'username'
		});
	}
	if (!validator.matches(req.body.username || '', /^[a-zA-Z0-9_-]+$/)) {
		errors.push({
			msg: 'Username can only contain letters, numbers, underscores, and dashes',
			param: 'username'
		});
	}

	// Email validation
	if (!validator.isEmail(req.body.email || '')) {
		errors.push({
			msg: 'Please provide a valid email address',
			param: 'email'
		});
	}

	// Password validation
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
			msg: 'Password must contain at least one number',
			param: 'password'
		});
	}
	if (!validator.matches(req.body.password || '', /[^A-Za-z0-9]/)) {
		errors.push({
			msg: 'Password must contain at least one special character',
			param: 'password'
		});
	}

	// Confirm password validation
	if (req.body.password !== req.body.confirmPassword) {
		errors.push({
			msg: 'Passwords do not match',
			param: 'confirmPassword'
		});
	}

	if (errors.length) {
		res.status(400).json({ errors });
		return;
	}

	next();
};
