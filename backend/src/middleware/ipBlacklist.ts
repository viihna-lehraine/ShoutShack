import { inRange } from 'range_check';
import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';

interface IpBlacklistDependencies {
	logger: ReturnType<typeof import('../config/logger').default>;
	featureFlags: ReturnType<
		typeof import('../config/featureFlags').getFeatureFlags
	>;
	__dirname: string;
	fsModule: typeof fs;
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
	removeFromBlacklist: (ip: string) => void;
}

let blacklist: string[] = [];

export function createIpBlacklist({
	logger,
	featureFlags,
	__dirname,
	fsModule
}: IpBlacklistDependencies): IpBlacklist {
	const IP_BLACKLIST_ENABLED = featureFlags.enableIpBlacklistFlag;

	const loadBlacklist = async (): Promise<void> => {
		const filePath = path.join(__dirname, '../../data/blacklist.json');
		try {
			if (fsModule.existsSync(filePath)) {
				const data = fsModule.readFileSync(filePath, 'utf8');
				blacklist = JSON.parse(data);
			}
		} catch (err) {
			logger.error(`Error loading blacklist: ${err}`);
		}
	};

	const saveBlacklist = async (): Promise<void> => {
		if (IP_BLACKLIST_ENABLED) {
			const filePath = path.join(__dirname, '../../data/blacklist.json');
			try {
				fsModule.writeFileSync(filePath, JSON.stringify(blacklist));
			} catch (err) {
				logger.error(`Error saving blacklist: ${err}`);
			}
		}
	};

	const initializeBlacklist = async (): Promise<void> => {
		if (IP_BLACKLIST_ENABLED) {
			logger.info(
				'IP blacklist middleware is enabled. Initializing blacklist'
			);
			try {
				await loadBlacklist();
				logger.info(
					'Blacklist and range_check module loaded successfully'
				);
			} catch (err) {
				logger.error(`Error during blacklist initialization: ${err}`);
				throw err;
			}
		} else {
			logger.info('IP blacklist middleware is disabled');
		}
	};

	const addToBlacklist = async (ip: string): Promise<void> => {
		if (IP_BLACKLIST_ENABLED) {
			logger.info('IP Blacklist is enabled. Adding IP to blacklist');
			if (!blacklist.includes(ip)) {
				blacklist.push(ip);
				await saveBlacklist();
			} else {
				logger.info('IP already in blacklist');
			}
		} else {
			logger.info('IP Blacklist is disabled');
		}
	};

	const ipBlacklistMiddleware = (
		req: Request,
		res: Response,
		next: NextFunction
	): void => {
		if (IP_BLACKLIST_ENABLED) {
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

		next();
	};

	const removeFromBlacklist = (ip: string): void => {
		if (IP_BLACKLIST_ENABLED) {
			blacklist = blacklist.filter(range => range !== ip);
			saveBlacklist();
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
