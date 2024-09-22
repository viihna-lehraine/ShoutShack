import { Request, Response, NextFunction } from 'express';
import { promises as fs } from 'fs';
import { inRange } from 'range_check';
import { ConfigService } from '../services/configService';
import { errorClasses, ErrorSeverity } from '../errors/errorClasses';
import { ErrorLogger } from '../services/errorLogger';
import { expressErrorHandler, processError } from '../errors/processError';
import { validateDependencies } from '../utils/helpers';

let blacklist: string[] = [];

export const loadBlacklist = async (fsModule: typeof fs): Promise<void> => {
	const appLogger = ConfigService.getInstance().getLogger();
	const envVariables = ConfigService.getInstance().getEnvVariables();

	validateDependencies(
		[{ name: 'fsModule', instance: fsModule }],
		appLogger || console
	);

	const filePath = envVariables.serverDataFilePath2;

	try {
		if (await fsModule.stat(filePath)) {
			const data = await fsModule.readFile(filePath, 'utf8');
			blacklist = JSON.parse(data);
			appLogger.info('Blacklist loaded successfully');
		}
	} catch (utilError) {
		const utility: string = 'loadIpBlacklist()';
		const expressMiddlwareError = new errorClasses.UtilityErrorRecoverable(
			`Error occured when attempting to load IP blacklist using the utility ${utility}: ${utilError instanceof Error ? utilError.message : String(utilError)}`,
			{ exposeToClient: false }
		);
		ErrorLogger.logWarning(expressMiddlwareError.message);
		processError(utilError);
	}
};

const saveIpBlacklist = async (fsModule: typeof fs): Promise<void> => {
	const appLogger = ConfigService.getInstance().getLogger();
	const envVariables = ConfigService.getInstance().getEnvVariables();
	const featureFlags = ConfigService.getInstance().getFeatureFlags();

	validateDependencies(
		[{ name: 'fsModule', instance: fsModule }],
		appLogger || console
	);

	if (featureFlags.enableIpBlacklist) {
		const filePath = envVariables.serverDataFilePath2;
		try {
			await fsModule.writeFile(filePath, JSON.stringify(blacklist));
			appLogger.info('Blacklist saved successfully');
		} catch (utilError) {
			const utility: string = 'saveIpBlacklist()';
			const utilityError = new errorClasses.UtilityErrorRecoverable(
				`Error occured when attempting to save IP blacklist using the utility ${utility}: ${utilError instanceof Error ? utilError.message : String(utilError)}`,
				{ exposeToClient: false }
			);
			ErrorLogger.logWarning(utilityError.message);
			processError(utilError);
		}
	}
};

export const initializeIpBlacklist = async (
	fsModule: typeof fs
): Promise<void> => {
	const appLogger = ConfigService.getInstance().getLogger();
	const featureFlags = ConfigService.getInstance().getFeatureFlags();

	validateDependencies(
		[{ name: 'fsModule', instance: fsModule }],
		appLogger || console
	);

	if (featureFlags.enableIpBlacklist) {
		appLogger.info(
			'IP blacklist middleware is enabled. Initializing blacklist'
		);
		try {
			await loadBlacklist(fsModule);
			appLogger.info(
				'Blacklist and range_check module loaded successfully'
			);
		} catch (utilError) {
			const utilityError = new errorClasses.UtilityErrorRecoverable(
				`Error occured when initializing IP blacklist:\n${utilError instanceof Error ? utilError.message : String(utilError)}`,
				{
					utiliy: 'initializeIpBlacklist()',
					originalError: utilError,
					statusCode: 500,
					severity: ErrorSeverity.RECOVERABLE,
					exposeToClient: false
				}
			);
			ErrorLogger.logWarning(utilityError.message);
			processError(utilError);
		}
	} else {
		appLogger.info('IP blacklist middleware is disabled');
	}
};

export const addToBlacklist = async (
	ip: string,
	fsModule: typeof fs
): Promise<void> => {
	const appLogger = ConfigService.getInstance().getLogger();
	const featureFlags = ConfigService.getInstance().getFeatureFlags();

	validateDependencies([{ name: 'ip', instance: ip }], appLogger || console);

	try {
		if (featureFlags.enableIpBlacklist) {
			appLogger.info('IP Blacklist is enabled. Adding IP to blacklist');
			if (!blacklist.includes(ip)) {
				blacklist.push(ip);
				await saveIpBlacklist(fsModule);
				appLogger.info(`IP ${ip} added to blacklist`);
			} else {
				appLogger.info('IP already in blacklist');
			}
		} else {
			appLogger.info('IP Blacklist is disabled');
		}
	} catch (utilError) {
		const utility: string = 'addToBlacklist()';
		const utilityError = new errorClasses.UtilityErrorRecoverable(
			`Error occured when attempting to add IP address ${ip} to blacklist using the utility ${utility}: ${utilError instanceof Error ? utilError.message : String(utilError)}`,
			{
				severity: ErrorSeverity.WARNING,
				exposeToClient: false
			}
		);
		ErrorLogger.logWarning(utilityError.message);
		processError(utilError);
	}
};

export const removeFromBlacklist = async (
	ip: string,
	fsModule: typeof fs
): Promise<void> => {
	const appLogger = ConfigService.getInstance().getLogger();
	const featureFlags = ConfigService.getInstance().getFeatureFlags();

	validateDependencies([{ name: 'ip', instance: ip }], appLogger || console);

	try {
		if (featureFlags.enableIpBlacklist) {
			blacklist = blacklist.filter(range => range !== ip);
			await saveIpBlacklist(fsModule);
			appLogger.info(`IP ${ip} removed from blacklist`);
		}
	} catch (utilError) {
		const utilityError = new errorClasses.UtilityErrorRecoverable(
			`Error occured when removing IP address ${ip} from blacklist\n${utilError instanceof Error ? utilError.message : String(utilError)}`,
			{
				utility: 'removeFromBlacklist()',
				originalError: utilError,
				statusCode: 500,
				severity: ErrorSeverity.WARNING,
				exposeToClient: false
			}
		);
		ErrorLogger.logWarning(utilityError.message);
		processError(utilError);
	}
};

export const initializeIpBlacklistMiddleware =
	(fsModule: typeof fs) =>
	(req: Request, res: Response, next: NextFunction): void => {
		const appLogger = ConfigService.getInstance().getLogger();
		const featureFlags = ConfigService.getInstance().getFeatureFlags();

		validateDependencies(
			[{ name: 'fsModule', instance: fsModule }],
			appLogger || console
		);

		try {
			if (featureFlags.enableIpBlacklist) {
				appLogger.info('IP Blacklist middleware enabled');
				const clientIp = req.ip;

				if (!clientIp) {
					appLogger.info('Client IP not found');
					res.status(500).json({ error: 'Bad request' });
					return;
				}

				if (blacklist.some(range => inRange(clientIp, range))) {
					appLogger.info(
						`Blocked request from blacklisted IP: ${clientIp}`
					);
					res.status(403).json({ error: 'Access denied' });
					return;
				}
			} else {
				appLogger.info('IP Blacklist middleware disabled');
			}
		} catch (expressError) {
			const middleware: string = 'initializeIpBlacklistMiddleware()';
			const expressMiddlewareError = new errorClasses.ExpressError(
				`Error occurred when initializing ${middleware}: ${expressError instanceof Error ? expressError.message : String(expressError)}`,
				{ severity: ErrorSeverity.FATAL, exposeToClient: false }
			);
			ErrorLogger.logError(expressMiddlewareError);
			expressErrorHandler();
		}

		next();
	};
