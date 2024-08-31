interface AppErrorOptions {
	message: string;
	statusCode?: number;
	isOperational?: boolean;
	errorCode?: string;
	details?: unknown;
}

interface AppErrorDependencies {
	logger?: ReturnType<typeof import('../config/logger').default>;
}

class AppError extends Error {
	public statusCode: number;
	public isOperational: boolean;
	public errorCode: string;
	public details: unknown;

	constructor(
		{
			message,
			statusCode = 500,
			isOperational = true,
			errorCode,
			details
		}: AppErrorOptions,
		{ logger }: AppErrorDependencies = {}
	) {
		super(message);

		this.statusCode = statusCode;
		this.isOperational = isOperational;
		this.errorCode = errorCode || 'ERR_GENERIC';
		this.details = details;

		if (logger) {
			logger.error(`AppError: ${message}`, {
				statusCode,
				isOperational,
				errorCode,
				details
			});
		}

		Error.captureStackTrace(this, this.constructor);
	}
}

export default AppError;
