import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import xss from 'xss';
import { ServiceFactory } from '../index/factory';

const errorLogger = await ServiceFactory.getErrorLoggerService();
const errorHandler = await ServiceFactory.getErrorHandlerService();

export function sanitizeInput(input: string): string {
	return xss(input.trim());
}

export async function sanitizeRequestBody(
	body: Record<string, unknown>
): Promise<Record<string, unknown>> {
	const { sensitiveFields } = await import('../config/security').then(
		module => ({
			sensitiveFields: module.sensitiveFields
		})
	);

	const sanitize = async (
		data: Record<string, unknown>
	): Promise<Record<string, unknown>> => {
		const sanitizedData = new Map(Object.entries(data));

		for (const [key, value] of sanitizedData) {
			if (sensitiveFields.includes(key)) {
				sanitizedData.set(key, '[REDACTED]');
			} else if (typeof value === 'object' && value !== null) {
				if (Array.isArray(value)) {
					const sanitizedArray = await Promise.all(
						value.map(async item =>
							typeof item === 'object' && item !== null
								? await sanitize(
										item as Record<string, unknown>
									)
								: item
						)
					);
					sanitizedData.set(key, sanitizedArray);
				} else {
					sanitizedData.set(
						key,
						await sanitize(value as Record<string, unknown>)
					);
				}
			}
		}

		return Object.fromEntries(sanitizedData);
	};

	return await sanitize(body);
}

export function validateBlotEntry(
	req: Request,
	res: Response,
	next: NextFunction
): Response | void {
	req.body.name = sanitizeInput(req.body.name || '');
	req.body.message = sanitizeInput(req.body.message || '');

	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({ errors: errors.array() });
	}

	next();
}

export function handleValidationErrors(
	req: Request,
	res: Response,
	next: NextFunction
): Response | void {
	const errors = validationResult(req);

	if (!errors.isEmpty()) {
		const errorDetails: Record<string, unknown> = {
			message: 'Validation failed',
			errors: errors.array()
		};
		errorLogger.logError('Validation failed', { errors: errors.array() });
		errorHandler.expressErrorHandler()(errorDetails, req, res, next);

		return res.status(400).json({ errors: errors.array() });
	}

	next();
}
