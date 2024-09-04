const errorCounts = new Map<string, number>();

interface AppErrorDetails {
	retryAfter?: number;
	[key: string]: unknown;
}

export class AppError extends Error {
	public readonly statusCode: number;
	public readonly errorCode?: string | undefined;
	public readonly details?: AppErrorDetails | undefined;

	constructor(
		message: string,
		statusCode: number = 500,
		errorCode?: string,
		details?: AppErrorDetails
	) {
		super(message);
		this.statusCode = statusCode;
		this.errorCode = errorCode;
		this.details = details;
		Error.captureStackTrace(this, this.constructor);
	}
}

export class PasswordValidationError extends Error {
	constructor(msg: string) {
		super(msg);
		this.name = 'PasswordValidationError';
	}
}
