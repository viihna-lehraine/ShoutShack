import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { inRange } from 'range_check';
import { Logger } from '../config/logger';
import { FeatureFlags } from '../config/environmentConfig';
import { handleGeneralError, validateDependencies } from './errorHandler';

let blacklist: string[] = [];

interface IpBlacklistDependencies {
	logger: Logger;
	featureFlags: FeatureFlags;
	__dirname: string;
	fsModule: typeof fs.promises;
}

export let logger: Logger;
export let featureFlags: FeatureFlags;
export let __dirname: string;
export let fsModule: typeof fs.promises;

// Function to initialize the dependencies
export const initializeIpBlacklistDependencies = (
	deps: IpBlacklistDependencies
): void => {
	validateDependencies(
		[
			{ name: 'logger', instance: deps.logger },
			{ name: 'featureFlags', instance: deps.featureFlags },
			{ name: '__dirname', instance: deps.__dirname },
			{ name: 'fsModule', instance: deps.fsModule }
		],
		deps.logger || console
	);

	logger = deps.logger;
	featureFlags = deps.featureFlags;
	__dirname = deps.__dirname;
	fsModule = deps.fsModule;
};

export const loadBlacklist = async (): Promise<void> => {
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

export const initializeBlacklist = async (): Promise<void> => {
	if (featureFlags.enableIpBlacklistFlag) {
		logger.info(
			'IP blacklist middleware is enabled. Initializing blacklist'
		);
		try {
			await loadBlacklist();
			logger.info('Blacklist and range_check module loaded successfully');
		} catch (err) {
			handleGeneralError(err, logger || console);
			throw err;
		}
	} else {
		logger.info('IP blacklist middleware is disabled');
	}
};

export const addToBlacklist = async (ip: string): Promise<void> => {
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

export const removeFromBlacklist = async (ip: string): Promise<void> => {
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

export const ipBlacklistMiddleware = (
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
				logger.warn(`Blocked request from blacklisted IP: ${clientIp}`);
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
