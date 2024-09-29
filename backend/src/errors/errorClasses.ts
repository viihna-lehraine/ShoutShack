import { AppErrorClasses } from './appErrorClasses';
import { ClientErrorClasses } from './clientErrorClasses';
import { ERROR_CODES } from './errorCodes';

export interface ErrorDetails {
	retryAfter?: number | undefined;
	exposeToClient?: boolean;
	[key: string]: unknown;
}

export const ErrorSeverity = {
	FATAL: 'fatal',
	RECOVERABLE: 'recoverable',
	WARNING: 'warning',
	INFO: 'info'
} as const;

export type ErrorSeverityType =
	(typeof ErrorSeverity)[keyof typeof ErrorSeverity];

export class RootError extends Error {
	public readonly statusCode: number;
	public readonly errorCode?: string | undefined;
	public readonly details?: ErrorDetails | undefined;
	public readonly severity: ErrorSeverityType;

	constructor(
		errorMessage: string,
		statusCode: number = 500,
		severity: ErrorSeverityType = ErrorSeverity.RECOVERABLE,
		errorCode?: string,
		details: ErrorDetails = {}
	) {
		super(errorMessage);
		this.statusCode = statusCode;
		this.severity = severity;
		this.errorCode = errorCode;
		this.details = setDefaultDetails(details);
		Error.captureStackTrace(this, this.constructor);
	}
}

export class AppError extends RootError {
	constructor(
		errorMessage: string,
		statusCode: number = 500,
		severity: ErrorSeverityType = ErrorSeverity.FATAL,
		errorCode: string = ERROR_CODES.APP_ERROR,
		details: ErrorDetails = {}
	) {
		super(
			errorMessage,
			statusCode,
			severity,
			errorCode,
			setDefaultDetails(details)
		);
		this.name = 'AppError';
	}
}

export class ClientError extends RootError {
	constructor(
		errorMessage: string,
		statusCode: number = 400,
		severity: ErrorSeverityType = ErrorSeverity.RECOVERABLE,
		errorCode: string = ERROR_CODES.CLIENT_ERROR,
		details: ErrorDetails = {}
	) {
		super(
			errorMessage,
			statusCode,
			severity,
			errorCode,
			setDefaultDetails(details)
		);
		this.name = 'ClientError';
	}
}

export const ErrorClasses = {
	...AppErrorClasses,
	...ClientErrorClasses
};

export const defaultRetryAfter = 60;

export function setDefaultDetails(details?: ErrorDetails): ErrorDetails {
	return {
		...details,
		exposeToClient: details?.exposeToClient ?? false
	};
}

export function createRetryMessage(retryAfter?: number): string {
	return retryAfter
		? ` Please try again after ${retryAfter} seconds.`
		: 'Please try again later';
}

export function createQuotaExceededMessage(
	quotaName?: string,
	limit?: number,
	retryAfter?: number
): string {
	const message: string = quotaName ? `${quotaName} limit` : 'Limit';
	const limitMessage: string = limit ? `of ${limit}` : '';
	const retryMessage = createRetryMessage(retryAfter);

	return `${message}${limitMessage}${retryMessage}`;
}
