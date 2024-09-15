import { Request, Response, NextFunction } from 'express';
import { promises as fs } from 'fs';
import { inRange } from 'range_check';
import {
	envVariables,
	FeatureFlags,
	getFeatureFlags
} from '../config/envConfig';
import { errorClasses } from '../errors/errorClasses';
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
	envVariables
}: IpBlacklistDependencies): Promise<void> => {
	validateDependencies(
		[
			{ name: 'logger', instance: logger },
			{ name: 'fsModule', instance: fsModule },
			{ name: 'envVariables', instance: envVariables }
		],
		logger || console
	);

	const featureFlags: FeatureFlags = getFeatureFlags(logger);

	const filePath = envVariables.serverDataFilePath2;

	try {
		if (await fsModule.stat(filePath)) {
			const data = await fsModule.readFile(filePath, 'utf8');
			blacklist = JSON.parse(data);
			logger.info('Blacklist loaded successfully');
		}
	} catch (expressError) {
		const middleware: string = 'loadIpBlacklist';
		const expressMiddlwareError = new errorClasses.ExpressError(
			`Error occured when initializing ${middleware}: ${expressError instanceof Error ? expressError.message : String(expressError)}`,
			{ exposeToClient: false }
		);
		ErrorLogger.
	}
};

const saveBlacklist = async ({
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
		} catch (err) {
			processError(err, logger || console);
		}
	}
};

export const initializeBlacklist = async (
	deps: IpBlacklistDependencies
): Promise<void> => {
	validateDependencies(
		[
			{ name: 'logger', instance: deps.logger },
			{ name: 'featureFlags', instance: deps.featureFlags }
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
		} catch (err) {
			processError(err, logger);
			throw err;
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
				await saveBlacklist(deps);
				logger.info(`IP ${ip} added to blacklist`);
			} else {
				logger.info('IP already in blacklist');
			}
		} else {
			logger.info('IP Blacklist is disabled');
		}
	} catch (err) {
		processError(err, logger);
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
			await saveBlacklist(deps);
			logger.info(`IP ${ip} removed from blacklist`);
		}
	} catch (err) {
		processError(err, logger);
	}
};

export const initializeIpBlacklistMiddleware =
	(deps: IpBlacklistDependencies) =>
	(req: Request, res: Response, next: NextFunction): void => {
		const { logger, featureFlags } = deps;

		validateDependencies([
			{ name: 'logger', instance: logger },
			{ name: 'featureFlags', instance: featureFlags }
		]);

		try {
			if (featureFlags.enableIpBlacklistFlag) {
				logger.info('IP Blacklist middleware enabled');
				const clientIp = req.ip;

				if (!clientIp) {
					logger.error('Client IP not found');
					res.status(500).json({ error: 'Bad request' });
					return;
				}

				if (blacklist.some(range => inRange(clientIp, range))) {
					logger.warn(
						`Blocked request from blacklisted IP: ${clientIp}`
					);
					res.status(403).json({ error: 'Access denied' });
					return;
				}
			} else {
				logger.info('IP Blacklist middleware disabled');
			}
		} catch (err) {
			processError(err, logger);
			res.status(500).json({ error: 'Internal server error' });
			return;
		}

		next();
	};
