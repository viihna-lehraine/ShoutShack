import { Request, Response, NextFunction } from 'express';
import { promises as fs } from 'fs';
import { inRange } from 'range_check';
import { envVariables, FeatureFlags } from '../environment/envVars';
import { errorClasses, ErrorSeverity } from '../errors/errorClasses';
import { ErrorLogger } from '../errors/errorLogger';
import { expressErrorHandler, processError } from '../errors/processError';
import { Logger } from '../utils/logger';
import { validateDependencies } from '../utils/validateDependencies';

export interface IpBlacklistDependencies {
	logger: Logger;
	featureFlags: FeatureFlags;
	envVariables: typeof envVariables;
	fsModule: typeof fs;
}

let blacklist: string[] = [];

export const loadBlacklist = async ({
	logger,
	fsModule,
	envVariables,
	featureFlags
}: IpBlacklistDependencies): Promise<void> => {
	validateDependencies(
		[
			{ name: 'logger', instance: logger },
			{ name: 'fsModule', instance: fsModule },
			{ name: 'envVariables', instance: envVariables },
			{ name: 'featureFlags', instance: featureFlags }
		],
		logger || console
	);

	const filePath = envVariables.serverDataFilePath2;

	try {
		if (await fsModule.stat(filePath)) {
			const data = await fsModule.readFile(filePath, 'utf8');
			blacklist = JSON.parse(data);
			logger.info('Blacklist loaded successfully');
		}
	} catch (utilError) {
		const utility: string = 'loadIpBlacklist()';
		const expressMiddlwareError = new errorClasses.UtilityErrorRecoverable(
			`Error occured when attempting to load IP blacklist using the utility ${utility}: ${utilError instanceof Error ? utilError.message : String(utilError)}`,
			{ exposeToClient: false }
		);
		ErrorLogger.logWarning(expressMiddlwareError.message, logger);
		processError(utilError, logger);
	}
};

const saveIpBlacklist = async ({
	logger,
	featureFlags,
	fsModule,
	envVariables
}: IpBlacklistDependencies): Promise<void> => {
	validateDependencies(
		[
			{ name: 'logger', instance: logger },
			{ name: 'featureFlags', instance: featureFlags },
			{ name: 'fsModule', instance: fsModule },
			{ name: 'envVariables', instance: envVariables }
		],
		logger || console
	);

	if (featureFlags.enableIpBlacklistFlag) {
		const filePath = envVariables.serverDataFilePath2;
		try {
			await fsModule.writeFile(filePath, JSON.stringify(blacklist));
			logger.info('Blacklist saved successfully');
		} catch (utilError) {
			const utility: string = 'saveIpBlacklist()';
			const utilityError = new errorClasses.UtilityErrorRecoverable(
				`Error occured when attempting to save IP blacklist using the utility ${utility}: ${utilError instanceof Error ? utilError.message : String(utilError)}`,
				{ exposeToClient: false }
			);
			ErrorLogger.logWarning(utilityError.message, logger);
			processError(utilError, logger);
		}
	}
};

export const initializeIpBlacklist = async (
	deps: IpBlacklistDependencies
): Promise<void> => {
	validateDependencies(
		[
			{ name: 'logger', instance: deps.logger },
			{ name: 'fsModule', instance: deps.fsModule },
			{ name: 'featureFlags', instance: deps.featureFlags },
			{ name: 'envVariables', instance: deps.envVariables }
		],
		deps.logger
	);

	const { logger, featureFlags } = deps;

	if (featureFlags.enableIpBlacklistFlag) {
		logger.info(
			'IP blacklist middleware is enabled. Initializing blacklist'
		);
		try {
			await loadBlacklist(deps);
			logger.info('Blacklist and range_check module loaded successfully');
		} catch (utilError) {
			const utility: string = 'initializeIpBlacklist()';
			const utilityError = new errorClasses.UtilityErrorRecoverable(
				`Error occured when attempting to initialize IP blacklist using the utility ${utility}: ${utilError instanceof Error ? utilError.message : String(utilError)}`,
				{ exposeToClient: false }
			);
			ErrorLogger.logWarning(utilityError.message, logger);
			processError(utilError, logger);
		}
	} else {
		logger.info('IP blacklist middleware is disabled');
	}
};

export const addToBlacklist = async (
	ip: string,
	deps: IpBlacklistDependencies
): Promise<void> => {
	const { logger, featureFlags } = deps;

	validateDependencies(
		[
			{ name: 'ip', instance: ip },
			{ name: 'logger', instance: deps.logger },
			{ name: 'featureFlags', instance: deps.featureFlags }
		],
		logger || console
	);

	try {
		if (featureFlags.enableIpBlacklistFlag) {
			logger.info('IP Blacklist is enabled. Adding IP to blacklist');
			if (!blacklist.includes(ip)) {
				blacklist.push(ip);
				await saveIpBlacklist(deps);
				logger.info(`IP ${ip} added to blacklist`);
			} else {
				logger.info('IP already in blacklist');
			}
		} else {
			logger.info('IP Blacklist is disabled');
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
		ErrorLogger.logWarning(utilityError.message, logger);
		processError(utilError, logger);
	}
};

export const removeFromBlacklist = async (
	ip: string,
	deps: IpBlacklistDependencies
): Promise<void> => {
	const { logger, featureFlags } = deps;

	validateDependencies(
		[
			{ name: 'ip', instance: ip },
			{ name: 'logger', instance: deps.logger },
			{ name: 'featureFlags', instance: deps.featureFlags }
		],
		logger || console
	);

	try {
		if (featureFlags.enableIpBlacklistFlag) {
			blacklist = blacklist.filter(range => range !== ip);
			await saveIpBlacklist(deps);
			logger.info(`IP ${ip} removed from blacklist`);
		}
	} catch (utilError) {
		const utility: string = 'removeFromBlacklist()';
		const utilityError = new errorClasses.UtilityErrorRecoverable(
			`Error occured when attempting to remove IP address ${ip} from blacklist using the utility ${utility}: ${utilError instanceof Error ? utilError.message : String(utilError)}`,
			{
				severity: ErrorSeverity.WARNING,
				exposeToClient: false
			}
		);
		ErrorLogger.logWarning(utilityError.message, logger);
		processError(utilError, logger);
	}
};

export const initializeIpBlacklistMiddleware =
	(deps: IpBlacklistDependencies) =>
	(req: Request, res: Response, next: NextFunction): void => {
		const { logger, featureFlags } = deps;

		validateDependencies([
			{ name: 'logger', instance: logger },
			{ name: 'featureFlags', instance: featureFlags },
			{ name: 'envVariables', instance: deps.envVariables },
			{ name: 'fsModule', instance: deps.fsModule }
		]);

		try {
			if (featureFlags.enableIpBlacklistFlag) {
				logger.info('IP Blacklist middleware enabled');
				const clientIp = req.ip;

				if (!clientIp) {
					logger.info('Client IP not found');
					res.status(500).json({ error: 'Bad request' });
					return;
				}

				if (blacklist.some(range => inRange(clientIp, range))) {
					logger.info(
						`Blocked request from blacklisted IP: ${clientIp}`
					);
					res.status(403).json({ error: 'Access denied' });
					return;
				}
			} else {
				logger.info('IP Blacklist middleware disabled');
			}
		} catch (expressError) {
			const middleware: string = 'initializeIpBlacklistMiddleware()';
			const expressMiddlewareError = new errorClasses.ExpressError(
				`Error occurred when initializing ${middleware}: ${expressError instanceof Error ? expressError.message : String(expressError)}`,
				{ severity: ErrorSeverity.FATAL, exposeToClient: false }
			);
			ErrorLogger.logError(expressMiddlewareError, logger);
			expressErrorHandler({ logger, featureFlags });
		}

		next();
	};
