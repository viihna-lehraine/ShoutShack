import {
	AppLoggerServiceInterface,
	ErrorHandlerServiceInterface,
	MiddlewareServiceInterface
} from '../index/interfaces';
import { ServiceFactory } from '../index/factory';
import { NextFunction, Request, Response } from 'express';

export class MiddlewareService implements MiddlewareServiceInterface {
	private static instance: MiddlewareService;
	private logger: AppLoggerServiceInterface;
	private errorHandler: ErrorHandlerServiceInterface;

	private constructor() {
		this.logger = ServiceFactory.getLoggerService();
		this.errorHandler = ServiceFactory.getErrorHandlerService();
	}

	public static getInstance(): MiddlewareService {
		if (!MiddlewareService.instance) {
			MiddlewareService.instance = new MiddlewareService();
		}
		return MiddlewareService.instance;
	}

	private handleMiddlewareError(
		error: unknown,
		errorHeader: string,
		errorDetails: object,
		customMessage: string
	): void {
		try {
			const errorMessage = `${customMessage}: ${error}\n${error instanceof Error ? error.stack : ''}`;
			this.logger.logError(errorMessage);

			const middlewareError =
				new this.errorHandler.ErrorClasses.MiddlewareServiceError(
					errorHeader,
					{
						details: errorDetails,
						exposeToClient: false
					}
				);

			this.errorHandler.handleError({
				error: middlewareError
			});
		} catch (error) {
			this.logger.error(`Error handling middleware error: ${error}`);
		}
	}
}
