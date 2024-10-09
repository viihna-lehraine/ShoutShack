import {
	AppError,
	ClientError,
	ErrorClasses,
	ErrorSeverity,
	ErrorSeverityType
} from './ErrorClasses';
import { NextFunction, Request, Response } from 'express';
import {
	AppLoggerServiceInterface,
	ErrorHandlerServiceInterface,
	ErrorLoggerServiceInterface
} from '../index/interfaces/main';
import { v4 as uuidv4 } from 'uuid';
import { Sequelize } from 'sequelize';
import { sanitizeRequestBody } from '../utils/validator';

export class ErrorHandlerService implements ErrorHandlerServiceInterface {
	private static instance: ErrorHandlerService;
	public ErrorClasses = ErrorClasses;
	public ErrorSeverity = ErrorSeverity;
	private logger: AppLoggerServiceInterface;
	private errorLogger: ErrorLoggerServiceInterface;
	private shutdownFunction: (() => Promise<void>) | null = null;

	private constructor(
		logger: AppLoggerServiceInterface,
		errorLogger: ErrorLoggerServiceInterface
	) {
		this.logger = logger;
		this.errorLogger = errorLogger;
	}

	public static async getInstance(
		logger: AppLoggerServiceInterface,
		errorLogger: ErrorLoggerServiceInterface
	): Promise<ErrorHandlerService> {
		if (!ErrorHandlerService.instance) {
			ErrorHandlerService.instance = new ErrorHandlerService(
				logger,
				errorLogger
			);
			ErrorHandlerService.instance.initializeGlobalErrorHandlers();
		}
		return ErrorHandlerService.instance;
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
			appError = new AppError(`Unknown error type encountered\n${error}`);
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
			this.logger.logError('Error occurred.', errorDetails);
		}

		if (severity === ErrorSeverity.FATAL) {
			this.logger.logCritical('A fatal error occurred.', errorDetails);
		} else {
			this.logger.logError('A recoverable error occurred.', errorDetails);
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

			this.logger.logInfo(
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

		this.logger.logCritical(`CriticalError: ${errorMessage}`, {
			stack: errorStack,
			...logDetails
		});

		if (process.env.NODE_ENV === 'production') {
			process.exitCode = 1;
			setTimeout(() => process.exit(1), 1500);
		} else {
			this.errorLogger.logCritical(
				`Non-Prod environment: Critical error occurred\n${error}`
			);
			throw new Error(errorMessage);
		}
	}

	public async sendClientErrorResponse({
		message,
		res,
		responseId,
		statusCode = 400
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

		this.logger.logInfo(
			`Client error response sent. Response ID: ${responseId}\nMessage: ${message}`,
			{ statusCode, responseId }
		);
	}

	public initializeGlobalErrorHandlers(): void {
		process.on('SIGINT', async () => {
			this.logger.logInfo('Received SIGINT. Gracefully shutting down...');
			await this.performGracefulShutdown();
		});

		process.on('SIGTERM', async () => {
			this.logger.logInfo(
				'Received SIGTERM. Gracefully shutting down...'
			);
			await this.performGracefulShutdown();
		});

		process.on('unhandledRejection', (reason, promise) => {
			const rejectionMessage = `Unhandled promise rejection: ${reason}`;
			this.handleError({
				error: new Error(rejectionMessage),
				details: { reason, promise },
				action: 'unhandledRejection'
			});
			console.error(rejectionMessage);
		});

		process.on('uncaughtException', error => {
			this.handleCriticalError({
				error,
				details: { action: 'uncaughtException' }
			});
			console.error('Uncaught Exception:', error);
			if (process.env.NODE_ENV === 'production') {
				process.exit(1);
			}
		});
	}

	public setShutdownHandler(shutdownFn: () => Promise<void>): void {
		this.shutdownFunction = shutdownFn;
	}

	private async performGracefulShutdown(): Promise<void> {
		try {
			if (this.shutdownFunction) {
				this.logger.logInfo('Performing graceful shutdown...');
				await this.shutdownFunction();
			} else {
				this.logger.logError('Shutdown function not set.');
			}
		} catch (error) {
			this.handleCriticalError({
				error,
				details: { action: 'gracefulShutdown' }
			});
			process.exit(1);
		}
	}

	public async shutdown(): Promise<void> {
		this.logger.logInfo('Initiating ErrorHandlerService shutdown...');

		if (this.shutdownFunction) {
			await this.shutdownFunction();
			this.logger.logInfo('Error Handler shutdown function completed.');
		}

		this.logger.logInfo('ErrorHandlerService shutdown completed.');
	}
}
