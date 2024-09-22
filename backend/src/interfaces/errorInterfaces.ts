import { AppError } from '../errors/errorClasses';
import { NextFunction, Response, Request } from 'express';
import { AppLogger } from '../services/appLogger';
import { ClientError } from '../errors/errorClasses';

export interface ExpressErrorHandlerInterface {
	expressError: AppError | ClientError | Error;
	req: Request;
	res: Response;
	next: NextFunction;
	appLogger: AppLogger;
	ConfigService: typeof import('../services/configService').ConfigService;
	errorLogger: typeof import('../services/errorLogger').errorLogger;
	errorLoggerDetails: typeof import('../utils/helpers').errorLoggerDetails;
	fallbackLogger: Console;
	isAppLogger: typeof import('../services/appLogger').isAppLogger;
	errorResponse?: string;
}

export interface ProcessCriticalErrorInterface {
	appLogger: AppLogger;
	ConfigService: typeof import('../services/configService').ConfigService;
	fallbackLogger: Console;
	isAppLogger: typeof import('../services/appLogger').isAppLogger;
	error?: AppError | ClientError | Error | unknown;
	req?: Request;
	details: Record<string, unknown>;
}

export interface ProcessErrorInterface {
	appLogger: AppLogger;
	ConfigService: typeof import('../services/configService').ConfigService;
	errorLogger: typeof import('../services/errorLogger').errorLogger;
	errorLoggerDetails: typeof import('../utils/helpers').errorLoggerDetails;
	fallbackLogger: Console;
	isAppLogger: typeof import('../services/appLogger').isAppLogger;
	error: AppError | ClientError | Error | unknown;
}

export interface sendClientErrorResponseInterface {
	message: string;
	statusCode: number;
	res: Response;
}
