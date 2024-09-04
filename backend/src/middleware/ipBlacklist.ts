import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { inRange } from 'range_check';
import { Logger } from '../config/logger';
import { FeatureFlags } from '../config/environmentConfig';
import { handleGeneralError, validateDependencies } from './errorHandler';

interface IpBlacklistDependencies {
	logger: Logger;
	featureFlags: FeatureFlags;
	__dirname: string;
	fsModule: typeof fs.promises;
}

interface IpBlacklist {
	initializeBlacklist: () => Promise<void>;
	loadBlacklist: () => Promise<void>;
	addToBlacklist: (ip: string) => Promise<void>;
	ipBlacklistMiddleware: (
		req: Request,
		res: Response,
		next: NextFunction
	) => void;
	removeFromBlacklist: (ip: string) => Promise<void>;
}

let blacklist: string[] = [];

export function createIpBlacklist({
	logger,
	featureFlags,
	__dirname,
	fsModule
}: IpBlacklistDependencies): IpBlacklist {
	validateDependencies(
		[
			{ name: 'logger', instance: logger },
			{ name: 'featureFlags', instance: featureFlags },
			{ name: '__dirname', instance: __dirname },
			{ name: 'fsModule', instance: fsModule }
		],
		logger || console
	);

	const loadBlacklist = async (): Promise<void> => {
		const filePath = path.join(__dirname, '../../data/blacklist.json');
		try {
			if (await fsModule.stat(filePath)) {
				const data = await fsModule.readFile(filePath, 'utf8');
				blacklist = JSON.parse(data);
				logger.info('Blacklist loaded successfully');
			}
		} catch (err) {
			handleGeneralError(err, logger || console);
		}
	};

	const saveBlacklist = async (): Promise<void> => {
		if (featureFlags.enableIpBlacklistFlag) {
			const filePath = path.join(__dirname, '../../data/blacklist.json');
			try {
				await fsModule.writeFile(filePath, JSON.stringify(blacklist));
				logger.info('Blacklist saved successfully');
			} catch (err) {
				handleGeneralError(err, logger || console);
			}
		}
	};

	const initializeBlacklist = async (): Promise<void> => {
		if (featureFlags.enableIpBlacklistFlag) {
			logger.info(
				'IP blacklist middleware is enabled. Initializing blacklist'
			);
			try {
				await loadBlacklist();
				logger.info(
					'Blacklist and range_check module loaded successfully'
				);
			} catch (err) {
				handleGeneralError(err, logger || console);
				throw err;
			}
		} else {
			logger.info('IP blacklist middleware is disabled');
		}
	};

	const addToBlacklist = async (ip: string): Promise<void> => {
		try {
			if (featureFlags.enableIpBlacklistFlag) {
				logger.info('IP Blacklist is enabled. Adding IP to blacklist');
				if (!blacklist.includes(ip)) {
					blacklist.push(ip);
					await saveBlacklist();
					logger.info(`IP ${ip} added to blacklist`);
				} else {
					logger.info('IP already in blacklist');
				}
			} else {
				logger.info('IP Blacklist is disabled');
			}
		} catch (err) {
			handleGeneralError(err, logger || console);
		}
	};

	const ipBlacklistMiddleware = (
		req: Request,
		res: Response,
		next: NextFunction
	): void => {
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
			handleGeneralError(err, logger || console);
			res.status(500).json({ error: 'Internal server error' });
			return;
		}

		next();
	};

	const removeFromBlacklist = async (ip: string): Promise<void> => {
		try {
			if (featureFlags.enableIpBlacklistFlag) {
				blacklist = blacklist.filter(range => range !== ip);
				await saveBlacklist();
				logger.info(`IP ${ip} removed from blacklist`);
			}
		} catch (err) {
			handleGeneralError(err, logger || console);
		}
	};

	return {
		initializeBlacklist,
		loadBlacklist,
		addToBlacklist,
		ipBlacklistMiddleware,
		removeFromBlacklist
	};
}

export const initializeIpBlacklist = createIpBlacklist;
