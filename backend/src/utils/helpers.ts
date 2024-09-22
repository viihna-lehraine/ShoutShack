import { isAppLogger, AppLogger } from '../services/appLogger';
import { Dependency } from '../interfaces/utilityInterfaces';
import { configService } from '../services/configService';
import { errorLogger } from '../services/errorLogger';
import { processError } from '../errors/processError';
import { AppError, errorClasses, ErrorSeverity } from '../errors/errorClasses';
import { v4 as uuidv4 } from 'uuid';
import { Request } from 'express';
import { Socket } from 'net';

export const blankRequest: Request = {
	headers: {},
	ip: '',
	socket: {
		remoteAddress: '0.0.0.0'
	} as Socket
} as Request;

export function errorLoggerDetails(
	getCallerInfo: () => string,
	req?: Request,
	actionManual?: string
): Record<string, unknown> {
	const adminIdVal = configService.getAdminId() || null;
	const ipDetails =
		req?.ip ||
		req?.headers['x-forwarded-for'] ||
		req?.socket.remoteAddress ||
		null;
	const userAgentDetails = req?.headers['user-agent'] || null;
	const details: Record<string, unknown> = {
		requestId: 'N/A',
		adminId: adminIdVal,
		userId: 'N/A',
		action: actionManual || 'unknown',
		caller: String(getCallerInfo()),
		timestamp: Date.now(),
		additionalInfo: {
			ip: ipDetails,
			userAgent: userAgentDetails
		}
	};

	return details;
}

// *DEV-NOTE* implement this in middleware
export function generateRequestId(): string {
	return uuidv4();
}

export function getCallerInfo(): string {
	const stack = new Error().stack;
	if (stack) {
		const stackLines = stack.split('\n');
		const callerLine = stackLines[3]?.trim();
		return callerLine || 'Unknown caller';
	}
	return 'No stack trace available';
}

export function parseBoolean(value: string | boolean | undefined): boolean {
	const appLogger = configService.getAppLogger() || console;

	try {
		validateDependencies([{ name: 'value', instance: value }], appLogger);

		if (value === undefined) {
			appLogger.warn(
				'Feature flag value is undefined. Defaulting to false'
			);
			return false;
		}
		if (typeof value === 'string') {
			return value.toLowerCase() === 'true';
		}
		return value === true;
	} catch (utilError) {
		const utilityError = new errorClasses.UtilityErrorFatal(
			`
			Fatal error: Unable to parse boolean value ${value} using 'parseBoolean()\n${utilError instanceof Error ? utilError.message : utilError}`,
			{
				utility: 'parseBoolean()',
				originalError: utilError,
				statusCode: 500,
				severity: ErrorSeverity.FATAL,
				exposeToClient: false
			}
		);
		const actionVal: string = 'parse_data_to_type_boolean';
		const severity: string = ErrorSeverity.FATAL;
		errorLogger.logError(
			utilityError as AppError,
			errorLoggerDetails(getCallerInfo, blankRequest, actionVal),
			appLogger,
			severity
		);
		processError(utilityError);
		throw utilityError;
	}
}

export function validateDependencies(
	dependencies: Dependency[],
	appLogger: AppLogger
): void {
	const logInfo = isAppLogger(appLogger) ? appLogger.info : console.info;
	const logWarn = isAppLogger(appLogger) ? appLogger.warn : console.warn;
	const logError = isAppLogger(appLogger) ? appLogger.error : console.error;

	const callerInfo = getCallerInfo();

	if (!dependencies || dependencies.length === 0) {
		logWarn('No dependencies provided for validation');
		throw new Error('No dependencies provided for validation');
	}

	try {
		logInfo(
			`Validating the following dependencies (called from: ${callerInfo}): ${dependencies.map(dep => `${dep.name}: ${dep.instance}`).join(', ')}`
		);

		const missingDependencies = dependencies.filter(
			({ instance }) => instance === undefined || instance === null
		);

		if (missingDependencies.length > 0) {
			const missingNames = missingDependencies
				.map(({ name }) => name)
				.join(', ');
			logError(`
				Missing dependencies (called from ${callerInfo}): ${missingNames}`);
			throw new Error(`Missing dependencies: ${missingNames}`);
		}

		logInfo(
			`All dependencies are valid (called from: ${callerInfo}): ${dependencies
				.map(({ name }) => name)
				.join(', ')}`
		);
	} catch (error) {
		const message =
			error instanceof Error ? error.message : 'Unknown error';
		const stack = error instanceof Error ? error.stack : 'No stack trace';

		if (isAppLogger(appLogger)) {
			appLogger.error('An error occurred during dependency validation', {
				stack: stack ?? 'No stack trace',
				message: message ?? 'Unknown error'
			});
		} else {
			console.error('An error occurred during dependency validation', {
				stack: stack ?? 'No stack trace',
				message: message ?? 'Unknown error'
			});
		}
		throw error;
	}
}
