import { inRange } from 'range_check';
import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { Logger } from '../config/logger';
import { FeatureFlags } from '../config/environmentConfig';

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
	const loadBlacklist = async (): Promise<void> => {
		const filePath = path.join(__dirname, '../../data/blacklist.json');
		try {
			if (await fsModule.stat(filePath)) {
				const data = await fsModule.readFile(filePath, 'utf8');
				blacklist = JSON.parse(data);
			}
		} catch (err) {
			if (err instanceof Error) {
				logger.error(`Error loading blacklist: ${err.message}`, {
					stack: err.stack
				});
			} else {
				logger.error(`Unknown error loading blacklist: ${String(err)}`);
			}
		}
	};

	const saveBlacklist = async (): Promise<void> => {
		if (featureFlags.enableIpBlacklistFlag) {
			const filePath = path.join(__dirname, '../../data/blacklist.json');
			try {
				await fsModule.writeFile(filePath, JSON.stringify(blacklist));
			} catch (err) {
				if (err instanceof Error) {
					logger.error(`Error saving blacklist: ${err.message}`, {
						stack: err.stack
					});
				} else {
					logger.error(
						`Unknown error saving blacklist: ${String(err)}`
					);
				}
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
				if (err instanceof Error) {
					logger.error(
						`Error during blacklist initialization: ${err.message}`,
						{
							stack: err.stack
						}
					);
				} else {
					logger.error(
						`Unknown error during blacklist initialization: ${String(err)}`
					);
				}
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
				} else {
					logger.info('IP already in blacklist');
				}
			} else {
				logger.info('IP Blacklist is disabled');
			}
		} catch (err) {
			if (err instanceof Error) {
				logger.error(`Error adding IP to blacklist: ${err.message}`, {
					stack: err.stack
				});
			} else {
				logger.error(
					`Unknown error adding IP to blacklist: ${String(err)}`
				);
			}
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
			if (err instanceof Error) {
				logger.error(
					`Error in IP blacklist middleware: ${err.message}`,
					{
						stack: err.stack
					}
				);
			} else {
				logger.error(
					`Unknown error in IP blacklist middleware: ${String(err)}`
				);
			}
		}

		next();
	};

	const removeFromBlacklist = async (ip: string): Promise<void> => {
		try {
			if (featureFlags.enableIpBlacklistFlag) {
				blacklist = blacklist.filter(range => range !== ip);
				await saveBlacklist();
			}
		} catch (err) {
			if (err instanceof Error) {
				logger.error(
					`Error removing IP from blacklist: ${err.message}`,
					{
						stack: err.stack
					}
				);
			} else {
				logger.error(
					`Unknown error removing IP from blacklist: ${String(err)}`
				);
			}
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
