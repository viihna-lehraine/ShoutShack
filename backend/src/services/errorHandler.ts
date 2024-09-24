import {
	AppError,
	ClientError,
	ErrorClasses,
	ErrorSeverity,
	ErrorSeverityType
} from '../errors/errorClasses';
import { NextFunction, Request, Response } from 'express';
import { AppLogger, ErrorLogger } from '../services/logger';
import { v4 as uuidv4 } from 'uuid';
import { Sequelize } from 'sequelize';
import { sanitizeRequestBody } from '../utils/helpers';

export class ErrorHandler {
	private static instance: ErrorHandler;
	private appLogger: AppLogger;
	private errorLogger: ErrorLogger;
	public ErrorClasses = ErrorClasses;
	public ErrorSeverity = ErrorSeverity;

	constructor(appLogger: AppLogger, errorLogger: ErrorLogger) {
		this.appLogger = appLogger;
		this.errorLogger = errorLogger;
	}

	public static getInstance(
		appLogger: AppLogger,
		errorLogger: ErrorLogger
	): ErrorHandler {
		if (!ErrorHandler.instance) {
			ErrorHandler.instance = new ErrorHandler(appLogger, errorLogger);
		}
		return ErrorHandler.instance;
	}

	public handleError(params: {
		error: unknown;
		req?: Request;
		details?: Record<string, unknown>;
		severity?: ErrorSeverityType;
		action?: string;
		userId?: string;
		sequelize?: Sequelize;
	}): void {
		const {
			error,
			req,
			details,
			severity = ErrorSeverity.RECOVERABLE,
			action = 'unknown',
			userId = null,
			sequelize
		} = params;

		let appError: AppError;

		if (error instanceof AppError) {
			appError = error;
		} else if (error instanceof Error) {
			appError = new AppError(error.message);
		} else {
			appError = new AppError(`Unknown error: ${String(error)}`);
		}

		const errorDetails = this.errorLogger.getErrorDetails(
			() => 'handleError',
			action,
			req,
			userId,
			details
		);

		if (sequelize) {
			this.errorLogger.logAppError(appError, sequelize, errorDetails);
		} else {
			this.appLogger.logError('Error occurred.', errorDetails);
		}

		if (severity === ErrorSeverity.FATAL) {
			this.appLogger.logCritical('A fatal error occurred.', errorDetails);
		} else {
			this.appLogger.logError(
				'A recoverable error occurred.',
				errorDetails
			);
		}
	}

	public expressErrorHandler() {
		return (
			err: AppError | ClientError | Error | Record<string, unknown>,
			req: Request,
			res: Response,
			next: NextFunction
		): void => {
			const responseId = uuidv4();
			let statusCode = err instanceof AppError ? err.statusCode : 500;
			let message = 'An unexpected error occurred';
			let errorCode = 'ERR_GENERIC';

			const logDetails = {
				responseId,
				method: req.method,
				url: req.url,
				ip: req.ip,
				headers: req.headers,
				query: req.query,
				body: req.body ? sanitizeRequestBody(req.body) : null
			};

			if (err instanceof AppError) {
				statusCode = err.statusCode ?? 500;
				message = err.message || message;
				errorCode = err.errorCode ?? errorCode;

				if (err.details?.retryAfter) {
					res.set('Retry-After', String(err.details.retryAfter));
				}

				this.handleError({
					error: err,
					req,
					details: {
						...logDetails,
						severity: err.severity ?? 'unknown',
						errorCode: err.errorCode ?? 'ERR_GENERIC'
					},
					severity: err.severity
				});

				res.status(statusCode).json({
					status: 'error',
					message: err.message,
					code: errorCode,
					details: err.details || null,
					responseId
				});
			} else if (err instanceof Error) {
				statusCode = 500;
				message = err.message || message;

				this.handleError({
					error: err,
					req,
					details: logDetails
				});

				res.status(statusCode).json({
					status: 'error',
					message,
					responseId
				});
			} else {
				this.handleError({
					error: new Error(`Unknown error: ${String(err)}`),
					req,
					details: logDetails
				});

				res.status(500).json({
					status: 'error',
					message: 'Unknown error occurred',
					responseId
				});
			}

			this.appLogger.logInfo(
				`Error response sent to client. Response ID: ${responseId} | Status Code: ${statusCode} | Message: ${message}`,
				logDetails
			);

			next();
		};
	}

	public handleCriticalError(params: {
		error: unknown;
		req?: Request;
		details?: Record<string, unknown>;
	}): void {
		const { error, req, details = {} } = params;
		const errorMessage =
			error instanceof Error ? error.message : String(error);
		const errorStack = error instanceof Error ? error.stack : undefined;

		const logDetails = {
			method: req?.method ?? 'Unknown method',
			url: req?.url ?? 'Unknown URL',
			ip: req?.ip ?? 'Unknown IP',
			...details
		};

		this.appLogger.logCritical(`CriticalError: ${errorMessage}`, {
			stack: errorStack,
			...logDetails
		});

		if (process.env.NODE_ENV === 'production') {
			process.exit(1);
		} else {
			throw new Error(errorMessage);
		}
	}

	public async sendClientErrorResponse({
		message,
		statusCode = 400,
		res,
		responseId
	}: {
		message: string;
		statusCode?: number;
		res: Response;
		responseId?: string;
	}): Promise<void> {
		if (!responseId) {
			responseId = uuidv4();
		}

		res.status(statusCode).json({
			status: 'error',
			message,
			responseId
		});

		this.appLogger.logInfo(
			`Client error response sent. Response ID: ${responseId}\nMessage: ${message}`,
			{ statusCode, responseId }
		);
	}
}

export const errorHandler = ErrorHandler.getInstance(
	new AppLogger(),
	new ErrorLogger()
);
